/**
 * Task Management - Unit Tests
 * Run: npm test
 */

process.env.JWT_SECRET = 'taskmanagement_super_secret_key_2026';
process.env.NODE_ENV = 'test';

require('dotenv').config();
const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../src/app');

// Mock axios down below
jest.mock('axios', () => {
    return {
        get: jest.fn().mockResolvedValue({ data: { users: [{ _id: 'user_001', name: 'Mock User', email: 'mock@example.com', role: 'user' }] } }),
        post: jest.fn().mockResolvedValue({ data: { success: true } })
    };
});

const { MongoMemoryServer } = require('mongodb-memory-server');

// ─── Generate a test token ─────────────────────────────────────────────────────
const testToken = jwt.sign(
    { id: 'user_001', name: 'Alex Morgan', email: 'alex@merncore.dev', role: 'admin' },
    process.env.JWT_SECRET || 'taskmanagement_super_secret_key_2026',
    { expiresIn: '1h' }
);

const authHeader = `Bearer ${testToken}`;

let createdTaskId;
let mongoServer;

// ─── Connect / Disconnect DB ───────────────────────────────────────────────────
beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
});

afterAll(async () => {
    // Clean up test tasks
    if (createdTaskId) {
        await mongoose.connection.collection('tasks').deleteOne({
            _id: new mongoose.Types.ObjectId(createdTaskId),
        });
    }
    await mongoose.disconnect();
    if (mongoServer) {
        await mongoServer.stop();
    }
});

// ─── Health Check ─────────────────────────────────────────────────────────────
describe('Health Check', () => {
    it('GET /health → 200 OK', async () => {
        const res = await request(app).get('/health');
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('OK');
        expect(res.body.service).toBe('task-management');
    });
});

// ─── Auth ─────────────────────────────────────────────────────────────────────
describe('Authentication', () => {
    it('GET /api/tasks without token → 401', async () => {
        const res = await request(app).get('/api/tasks');
        expect(res.status).toBe(401);
    });

    it('GET /api/tasks with invalid token → 401', async () => {
        const res = await request(app)
            .get('/api/tasks')
            .set('Authorization', 'Bearer invalidtoken');
        expect(res.status).toBe(401);
    });
});

// ─── Task CRUD ────────────────────────────────────────────────────────────────
describe('Task CRUD', () => {
    it('POST /api/tasks → creates a new task', async () => {
        const res = await request(app)
            .post('/api/tasks')
            .set('Authorization', authHeader)
            .send({
                title: 'Test Task from Jest',
                description: 'Automated test task',
                status: 'todo',
                priority: 'high',
                project: 'Test Project',
            });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.task.title).toBe('Test Task from Jest');
        createdTaskId = res.body.task._id;
    });

    it('POST /api/tasks without title → 400 validation error', async () => {
        const res = await request(app)
            .post('/api/tasks')
            .set('Authorization', authHeader)
            .send({ description: 'No title task' });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it('GET /api/tasks → returns task list', async () => {
        const res = await request(app)
            .get('/api/tasks')
            .set('Authorization', authHeader);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.tasks)).toBe(true);
    });

    it('GET /api/tasks?status=todo → filters by status', async () => {
        const res = await request(app)
            .get('/api/tasks?status=todo')
            .set('Authorization', authHeader);

        expect(res.status).toBe(200);
        res.body.tasks.forEach((t) => expect(t.status).toBe('todo'));
    });

    it('GET /api/tasks/:id → returns single task', async () => {
        const res = await request(app)
            .get(`/api/tasks/${createdTaskId}`)
            .set('Authorization', authHeader);

        expect(res.status).toBe(200);
        expect(res.body.task._id).toBe(createdTaskId);
    });

    it('GET /api/tasks/invalid-id → 400 bad ID', async () => {
        const res = await request(app)
            .get('/api/tasks/notanid')
            .set('Authorization', authHeader);

        expect(res.status).toBe(400);
    });

    it('PUT /api/tasks/:id → updates task', async () => {
        const res = await request(app)
            .put(`/api/tasks/${createdTaskId}`)
            .set('Authorization', authHeader)
            .send({ title: 'Updated Test Task', priority: 'urgent' });

        expect(res.status).toBe(200);
        expect(res.body.task.title).toBe('Updated Test Task');
        expect(res.body.task.priority).toBe('urgent');
    });

    it('PATCH /api/tasks/:id → updates status (drag-drop)', async () => {
        const res = await request(app)
            .patch(`/api/tasks/${createdTaskId}`)
            .set('Authorization', authHeader)
            .send({ status: 'in_progress' });

        expect(res.status).toBe(200);
        expect(res.body.task.status).toBe('in_progress');
    });

    it('GET /api/tasks/stats → returns counts by status', async () => {
        const res = await request(app)
            .get('/api/tasks/stats')
            .set('Authorization', authHeader);

        expect(res.status).toBe(200);
        expect(res.body.stats).toHaveProperty('total');
        expect(res.body.stats).toHaveProperty('todo');
        expect(res.body.stats).toHaveProperty('in_progress');
        expect(res.body.stats).toHaveProperty('done');
    });

    it('GET /api/tasks/users → returns mock users', async () => {
        const res = await request(app)
            .get('/api/tasks/users')
            .set('Authorization', authHeader);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.users)).toBe(true);
        expect(res.body.users.length).toBeGreaterThan(0);
    });

    it('DELETE /api/tasks/:id → deletes task', async () => {
        const res = await request(app)
            .delete(`/api/tasks/${createdTaskId}`)
            .set('Authorization', authHeader);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        createdTaskId = null; // Prevent afterAll cleanup attempt
    });

    it('GET /api/tasks/:id (deleted) → 404', async () => {
        const fakeId = new mongoose.Types.ObjectId().toString();
        const res = await request(app)
            .get(`/api/tasks/${fakeId}`)
            .set('Authorization', authHeader);

        expect(res.status).toBe(404);
    });
});

// ─── User Search ──────────────────────────────────────────────────────────────
describe('User Search', () => {
    it('GET /api/tasks/users/search?q=alex → searches users', async () => {
        const res = await request(app)
            .get('/api/tasks/users/search?q=alex')
            .set('Authorization', authHeader);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.users)).toBe(true);
    });

    it('GET /api/tasks/users/search?q=alex&limit=3 → limits results', async () => {
        const res = await request(app)
            .get('/api/tasks/users/search?q=alex&limit=3')
            .set('Authorization', authHeader);

        expect(res.status).toBe(200);
        expect(res.body.users.length).toBeLessThanOrEqual(3);
    });

    it('GET /api/tasks/users/search → returns all users when no query', async () => {
        const res = await request(app)
            .get('/api/tasks/users/search')
            .set('Authorization', authHeader);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.users)).toBe(true);
    });
});

// ─── Task Assignees ───────────────────────────────────────────────────────────
describe('Task Assignees', () => {
    let taskForAssignees;

    beforeAll(async () => {
        const res = await request(app)
            .post('/api/tasks')
            .set('Authorization', authHeader)
            .send({
                title: 'Task for Assignee Tests',
                description: 'Testing assignee operations',
                status: 'todo',
            });
        taskForAssignees = res.body.task._id;
    });

    afterAll(async () => {
        if (taskForAssignees) {
            await mongoose.connection.collection('tasks').deleteOne({
                _id: new mongoose.Types.ObjectId(taskForAssignees),
            });
        }
    });

    it('POST /api/tasks/:id/assignees → adds assignee', async () => {
        const res = await request(app)
            .post(`/api/tasks/${taskForAssignees}/assignees`)
            .set('Authorization', authHeader)
            .send({
                id: 'user_002',
                name: 'John Doe',
                email: 'john@test.com',
                role: 'developer',
            });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.task.assignees).toBeDefined();
        expect(res.body.task.assignees.length).toBeGreaterThan(0);
    });

    it('POST /api/tasks/:id/assignees without id → 400', async () => {
        const res = await request(app)
            .post(`/api/tasks/${taskForAssignees}/assignees`)
            .set('Authorization', authHeader)
            .send({ email: 'test@test.com' });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it('DELETE /api/tasks/:id/assignees/:userId → removes assignee', async () => {
        const res = await request(app)
            .delete(`/api/tasks/${taskForAssignees}/assignees/user_002`)
            .set('Authorization', authHeader);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('POST /api/tasks/invalid-id/assignees → 400 bad ID', async () => {
        const res = await request(app)
            .post('/api/tasks/notanid/assignees')
            .set('Authorization', authHeader)
            .send({ id: 'user_003', name: 'Test' });

        expect(res.status).toBe(400);
    });
});

// ─── Task Comments ────────────────────────────────────────────────────────────
describe('Task Comments', () => {
    let taskForComments;
    let createdCommentId;

    beforeAll(async () => {
        const res = await request(app)
            .post('/api/tasks')
            .set('Authorization', authHeader)
            .send({
                title: 'Task for Comment Tests',
                description: 'Testing comment operations',
                status: 'todo',
            });
        taskForComments = res.body.task._id;
    });

    afterAll(async () => {
        if (taskForComments) {
            await mongoose.connection.collection('tasks').deleteOne({
                _id: new mongoose.Types.ObjectId(taskForComments),
            });
        }
    });

    it('POST /api/tasks/:id/comments → adds comment', async () => {
        const res = await request(app)
            .post(`/api/tasks/${taskForComments}/comments`)
            .set('Authorization', authHeader)
            .send({ text: 'This is a test comment' });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.task.comments).toBeDefined();
        expect(res.body.task.comments.length).toBeGreaterThan(0);
        createdCommentId = res.body.task.comments[res.body.task.comments.length - 1]._id;
    });

    it('POST /api/tasks/:id/comments without text → 400', async () => {
        const res = await request(app)
            .post(`/api/tasks/${taskForComments}/comments`)
            .set('Authorization', authHeader)
            .send({ text: '' });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it('POST /api/tasks/:id/comments with empty text → 400', async () => {
        const res = await request(app)
            .post(`/api/tasks/${taskForComments}/comments`)
            .set('Authorization', authHeader)
            .send({ text: '   ' });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it('DELETE /api/tasks/:id/comments/:commentId → deletes comment', async () => {
        const res = await request(app)
            .delete(`/api/tasks/${taskForComments}/comments/${createdCommentId}`)
            .set('Authorization', authHeader);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('POST /api/tasks/invalid-id/comments → 400 bad ID', async () => {
        const res = await request(app)
            .post('/api/tasks/notanid/comments')
            .set('Authorization', authHeader)
            .send({ text: 'Test comment' });

        expect(res.status).toBe(400);
    });
});

// ─── Task Time Logs ───────────────────────────────────────────────────────────
describe('Task Time Logs', () => {
    let taskForTimeLogs;

    beforeAll(async () => {
        const res = await request(app)
            .post('/api/tasks')
            .set('Authorization', authHeader)
            .send({
                title: 'Task for Time Log Tests',
                description: 'Testing time log operations',
                status: 'in_progress',
            });
        taskForTimeLogs = res.body.task._id;
    });

    afterAll(async () => {
        if (taskForTimeLogs) {
            await mongoose.connection.collection('tasks').deleteOne({
                _id: new mongoose.Types.ObjectId(taskForTimeLogs),
            });
        }
    });

    it('POST /api/tasks/:id/time-logs → logs time', async () => {
        const res = await request(app)
            .post(`/api/tasks/${taskForTimeLogs}/time-logs`)
            .set('Authorization', authHeader)
            .send({ hours: 2.5, note: 'Worked on implementation' });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.task.timeLogs).toBeDefined();
        expect(res.body.task.timeLogs.length).toBeGreaterThan(0);
    });

    it('POST /api/tasks/:id/time-logs without note → still works', async () => {
        const res = await request(app)
            .post(`/api/tasks/${taskForTimeLogs}/time-logs`)
            .set('Authorization', authHeader)
            .send({ hours: 1 });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
    });

    it('POST /api/tasks/:id/time-logs without hours → 400', async () => {
        const res = await request(app)
            .post(`/api/tasks/${taskForTimeLogs}/time-logs`)
            .set('Authorization', authHeader)
            .send({ note: 'Missing hours' });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it('POST /api/tasks/:id/time-logs with negative hours → 400', async () => {
        const res = await request(app)
            .post(`/api/tasks/${taskForTimeLogs}/time-logs`)
            .set('Authorization', authHeader)
            .send({ hours: -2 });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it('POST /api/tasks/:id/time-logs with zero hours → 400', async () => {
        const res = await request(app)
            .post(`/api/tasks/${taskForTimeLogs}/time-logs`)
            .set('Authorization', authHeader)
            .send({ hours: 0 });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it('POST /api/tasks/invalid-id/time-logs → 400 bad ID', async () => {
        const res = await request(app)
            .post('/api/tasks/notanid/time-logs')
            .set('Authorization', authHeader)
            .send({ hours: 1 });

        expect(res.status).toBe(400);
    });
});
