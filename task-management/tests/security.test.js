/**
 * Security Test Suite - SE4030 Secure Software Development
 * =============================================================================
 * Target Vulnerabilities:
 *   1. OWASP A01:2021 – Broken Access Control / IDOR (BOLA)
 *   2. OWASP A03:2021 – NoSQL Query & Operator Injection
 *
 * Tests included:
 *   - Unit Tests: TaskPolicy (canUpdate, canDelete) with all role matrices
 *   - Integration Tests: IDOR mitigation (PUT, PATCH, DELETE /api/tasks/:id)
 *   - Integration Tests: NoSQL injection mitigation (express-validator, express-mongo-sanitize)
 * =============================================================================
 */

process.env.JWT_SECRET = 'taskmanagement_super_secret_key_2026';
process.env.NODE_ENV = 'test';

require('dotenv').config();
const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');

const app = require('../src/app');
const Task = require('../src/models/Task');
const TaskPolicy = require('../src/utils/taskPolicy');

// Mock axios to isolate microservice from user-management and notification service calls
jest.mock('axios', () => ({
    get: jest.fn().mockResolvedValue({ data: { users: [] } }),
    post: jest.fn().mockResolvedValue({ data: { success: true } }),
}));

describe('Security Test Suite (OWASP Top 10 Mitigation)', () => {
    let mongoServer;

    // Helper function to sign test JWT tokens
    const createToken = (user) => {
        return jwt.sign(
            {
                id: user.id,
                name: user.name,
                email: user.email || `${user.id}@test.com`,
                role: user.role || 'User',
            },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
    };

    // User personas
    const adminUser = { id: 'usr_admin_01', name: 'System Administrator', role: 'Admin' };
    const reporterUser = { id: 'usr_reporter_01', name: 'Project Reporter', role: 'User' };
    const assigneeUser = { id: 'usr_assignee_01', name: 'Assigned Developer', role: 'User' };
    const strangerUser = { id: 'usr_stranger_01', name: 'Unauthorized Intruder', role: 'User' };

    // Bearer token headers
    const adminHeader = `Bearer ${createToken(adminUser)}`;
    const reporterHeader = `Bearer ${createToken(reporterUser)}`;
    const assigneeHeader = `Bearer ${createToken(assigneeUser)}`;
    const strangerHeader = `Bearer ${createToken(strangerUser)}`;

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        await mongoose.connect(uri);
    });

    afterAll(async () => {
        await mongoose.disconnect();
        if (mongoServer) {
            await mongoServer.stop();
        }
    });

    beforeEach(async () => {
        // Clear tasks collection before each test
        await Task.deleteMany({});
    });

    // =========================================================================
    // 1. TaskPolicy Unit Tests
    // =========================================================================
    describe('1. TaskPolicy Unit Tests (Authorization Rules)', () => {
        const mockTask = {
            _id: new mongoose.Types.ObjectId(),
            title: 'Top Secret Feature Roadmap',
            reporter: {
                id: reporterUser.id,
                name: reporterUser.name,
                email: 'reporter@test.com',
            },
            assignees: [
                {
                    id: assigneeUser.id,
                    name: assigneeUser.name,
                    email: 'assignee@test.com',
                    role: 'developer',
                },
            ],
        };

        describe('canUpdate(user, task)', () => {
            it('should ALLOW Admin to update task (user.role === "Admin")', () => {
                expect(TaskPolicy.canUpdate(adminUser, mockTask)).toBe(true);
            });

            it('should ALLOW Admin to update task with lowercase role ("admin")', () => {
                const lowerAdmin = { id: 'usr_admin_02', role: 'admin' };
                expect(TaskPolicy.canUpdate(lowerAdmin, mockTask)).toBe(true);
            });

            it('should ALLOW the task reporter (creator) to update task', () => {
                expect(TaskPolicy.canUpdate(reporterUser, mockTask)).toBe(true);
            });

            it('should ALLOW assigned users (assignees) to update task', () => {
                expect(TaskPolicy.canUpdate(assigneeUser, mockTask)).toBe(true);
            });

            it('should DENY unauthorized third-party user (stranger) from updating task', () => {
                expect(TaskPolicy.canUpdate(strangerUser, mockTask)).toBe(false);
            });

            it('should DENY when user or task is null / undefined', () => {
                expect(TaskPolicy.canUpdate(null, mockTask)).toBe(false);
                expect(TaskPolicy.canUpdate(reporterUser, null)).toBe(false);
                expect(TaskPolicy.canUpdate(null, null)).toBe(false);
            });
        });

        describe('canDelete(user, task)', () => {
            it('should ALLOW Admin to delete task', () => {
                expect(TaskPolicy.canDelete(adminUser, mockTask)).toBe(true);
            });

            it('should ALLOW task reporter (creator) to delete task', () => {
                expect(TaskPolicy.canDelete(reporterUser, mockTask)).toBe(true);
            });

            it('should STRICTLY DENY assignees from deleting task (only update allowed)', () => {
                expect(TaskPolicy.canDelete(assigneeUser, mockTask)).toBe(false);
            });

            it('should DENY unauthorized third-party user (stranger) from deleting task', () => {
                expect(TaskPolicy.canDelete(strangerUser, mockTask)).toBe(false);
            });

            it('should DENY when user or task is null / undefined', () => {
                expect(TaskPolicy.canDelete(null, mockTask)).toBe(false);
                expect(TaskPolicy.canDelete(reporterUser, null)).toBe(false);
                expect(TaskPolicy.canDelete(null, null)).toBe(false);
            });
        });
    });

    // =========================================================================
    // 2. IDOR / Broken Access Control (OWASP A01:2021) Integration Tests
    // =========================================================================
    describe('2. IDOR / Broken Object-Level Authorization (A01:2021) Integration Tests', () => {
        let targetTask;

        beforeEach(async () => {
            // Seed a task owned by reporterUser, assigned to assigneeUser
            targetTask = await Task.create({
                title: 'Confidential Strategic Architecture',
                description: 'Sensitive technical specifications',
                status: 'todo',
                priority: 'high',
                reporter: {
                    id: reporterUser.id,
                    name: reporterUser.name,
                    email: 'reporter@test.com',
                },
                assignees: [
                    {
                        id: assigneeUser.id,
                        name: assigneeUser.name,
                        email: 'assignee@test.com',
                    },
                ],
            });
        });

        it('PUT /api/tasks/:id → DENIES unauthorized user (403 Forbidden)', async () => {
            const res = await request(app)
                .put(`/api/tasks/${targetTask._id}`)
                .set('Authorization', strangerHeader)
                .send({ title: 'Tampered Title by Stranger' });

            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toMatch(/Forbidden/i);

            // Verify task was NOT modified in the database
            const unchanged = await Task.findById(targetTask._id);
            expect(unchanged.title).toBe('Confidential Strategic Architecture');
        });

        it('PATCH /api/tasks/:id → DENIES unauthorized user (403 Forbidden)', async () => {
            const res = await request(app)
                .patch(`/api/tasks/${targetTask._id}`)
                .set('Authorization', strangerHeader)
                .send({ status: 'completed' });

            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toMatch(/Forbidden/i);

            const unchanged = await Task.findById(targetTask._id);
            expect(unchanged.status).toBe('todo');
        });

        it('DELETE /api/tasks/:id → DENIES unauthorized user (403 Forbidden)', async () => {
            const res = await request(app)
                .delete(`/api/tasks/${targetTask._id}`)
                .set('Authorization', strangerHeader);

            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toMatch(/Forbidden/i);

            // Verify task was NOT deleted
            const taskInDb = await Task.findById(targetTask._id);
            expect(taskInDb).not.toBeNull();
        });

        it('DELETE /api/tasks/:id → DENIES assignee from deleting task (403 Forbidden)', async () => {
            // Assignees can edit/progress tasks, but must NOT be allowed to delete them
            const res = await request(app)
                .delete(`/api/tasks/${targetTask._id}`)
                .set('Authorization', assigneeHeader);

            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toMatch(/Forbidden/i);

            const taskInDb = await Task.findById(targetTask._id);
            expect(taskInDb).not.toBeNull();
        });

        it('PUT /api/tasks/:id → ALLOWS assignee to update task (200 OK)', async () => {
            const res = await request(app)
                .put(`/api/tasks/${targetTask._id}`)
                .set('Authorization', assigneeHeader)
                .send({ progress: 50, priority: 'urgent' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.task.progress).toBe(50);
        });

        it('PUT /api/tasks/:id → ALLOWS reporter to update task (200 OK)', async () => {
            const res = await request(app)
                .put(`/api/tasks/${targetTask._id}`)
                .set('Authorization', reporterHeader)
                .send({ title: 'Legitimate Update by Reporter' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.task.title).toBe('Legitimate Update by Reporter');
        });

        it('DELETE /api/tasks/:id → ALLOWS reporter to delete task (200 OK)', async () => {
            const res = await request(app)
                .delete(`/api/tasks/${targetTask._id}`)
                .set('Authorization', reporterHeader);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);

            const deleted = await Task.findById(targetTask._id);
            expect(deleted).toBeNull();
        });

        it('DELETE /api/tasks/:id → ALLOWS Admin to delete task (200 OK)', async () => {
            const res = await request(app)
                .delete(`/api/tasks/${targetTask._id}`)
                .set('Authorization', adminHeader);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);

            const deleted = await Task.findById(targetTask._id);
            expect(deleted).toBeNull();
        });
    });

    // =========================================================================
    // 3. NoSQL Injection (OWASP A03:2021) Integration Tests
    // =========================================================================
    describe('3. NoSQL Query & Operator Injection (A03:2021) Integration Tests', () => {
        beforeEach(async () => {
            await Task.create([
                { title: 'Task A', status: 'todo', priority: 'low' },
                { title: 'Task B', status: 'in_progress', priority: 'high' },
                { title: 'Task C', status: 'completed', priority: 'urgent' },
            ]);
        });

        it('GET /api/tasks?status[$ne]=completed → rejects operator injection with 400 Bad Request', async () => {
            const res = await request(app)
                .get('/api/tasks?status[$ne]=completed')
                .set('Authorization', reporterHeader);

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(Array.isArray(res.body.errors)).toBe(true);
            expect(res.body.errors[0].path).toBe('status');
        });

        it('GET /api/tasks?status[$gt]= → rejects operator injection with 400 Bad Request', async () => {
            const res = await request(app)
                .get('/api/tasks?status[$gt]=')
                .set('Authorization', reporterHeader);

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('GET /api/tasks?priority[$ne]=low → rejects unwhitelisted operator input with 400 Bad Request', async () => {
            const res = await request(app)
                .get('/api/tasks?priority[$ne]=low')
                .set('Authorization', reporterHeader);

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.errors[0].path).toBe('priority');
        });

        it('GET /api/tasks?board=invalid-object-id → rejects malformed board ID with 400 Bad Request', async () => {
            const res = await request(app)
                .get('/api/tasks?board=notAValidMongoId123')
                .set('Authorization', reporterHeader);

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.errors[0].msg).toMatch(/ObjectId/i);
        });

        it('GET /api/tasks?status=todo&priority=low → accepts valid whitelisted query parameters (200 OK)', async () => {
            const res = await request(app)
                .get('/api/tasks?status=todo&priority=low')
                .set('Authorization', reporterHeader);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.count).toBe(1);
            expect(res.body.tasks[0].title).toBe('Task A');
        });

        it('POST /api/tasks with payload containing $ operators → sanitizes input via express-mongo-sanitize', async () => {
            const res = await request(app)
                .post('/api/tasks')
                .set('Authorization', reporterHeader)
                .send({
                    title: 'Clean Sanitized Task',
                    description: 'Testing mongo-sanitize',
                    priority: 'medium',
                    $where: 'sleep(5000)',
                    nestedInjection: { $gt: '' },
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);

            // Verify stored document does not contain the $where or $gt injection keys
            const savedTask = await Task.findById(res.body.task._id).lean();
            expect(savedTask.$where).toBeUndefined();
            if (savedTask.nestedInjection) {
                expect(savedTask.nestedInjection.$gt).toBeUndefined();
            }
        });
    });
});
