/**
 * Board Management - Unit Tests
 * Run: npm test
 */

process.env.JWT_SECRET = 'taskmanagement_super_secret_key_2026';
process.env.NODE_ENV = 'test';

require('dotenv').config();
const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../src/app');

const { MongoMemoryServer } = require('mongodb-memory-server');

// ─── Generate test tokens ──────────────────────────────────────────────────────
const adminToken = jwt.sign(
    { id: 'user_admin', name: 'Admin User', email: 'admin@merncore.dev', role: 'admin' },
    process.env.JWT_SECRET || 'taskmanagement_super_secret_key_2026',
    { expiresIn: '1h' }
);

const memberToken = jwt.sign(
    { id: 'user_member', name: 'Member User', email: 'member@merncore.dev', role: 'member' },
    process.env.JWT_SECRET || 'taskmanagement_super_secret_key_2026',
    { expiresIn: '1h' }
);

const authHeader = `Bearer ${adminToken}`;
const memberAuthHeader = `Bearer ${memberToken}`;

let createdBoardId;
let mongoServer;

// ─── Connect / Disconnect DB ───────────────────────────────────────────────────
beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
});

afterAll(async () => {
    // Clean up test boards
    if (createdBoardId) {
        await mongoose.connection.collection('boards').deleteOne({
            _id: new mongoose.Types.ObjectId(createdBoardId),
        });
    }
    // Clean up any additional test boards
    await mongoose.connection.collection('boards').deleteMany({
        name: { $regex: /^Test Board|Board for/ },
    });
    await mongoose.disconnect();
    if (mongoServer) {
        await mongoServer.stop();
    }
});

// ─── Board CRUD ───────────────────────────────────────────────────────────────
describe('Board CRUD', () => {
    it('POST /api/boards → creates a new board', async () => {
        const res = await request(app)
            .post('/api/boards')
            .set('Authorization', authHeader)
            .send({
                name: 'Test Board from Jest',
                description: 'Automated test board',
                sprint: 'Sprint 1',
                members: [],
            });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.board.name).toBe('Test Board from Jest');
        expect(res.body.board.createdBy).toBeDefined();
        expect(res.body.board.createdBy.id).toBe('user_admin');
        createdBoardId = res.body.board._id;
    });

    it('POST /api/boards without name → 400 validation error', async () => {
        const res = await request(app)
            .post('/api/boards')
            .set('Authorization', authHeader)
            .send({ description: 'No name board' });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it('POST /api/boards with name too long → 400 validation error', async () => {
        const res = await request(app)
            .post('/api/boards')
            .set('Authorization', authHeader)
            .send({ name: 'A'.repeat(101) });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it('GET /api/boards → returns board list', async () => {
        const res = await request(app)
            .get('/api/boards')
            .set('Authorization', authHeader);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.boards)).toBe(true);
        expect(res.body.count).toBeGreaterThan(0);
    });

    it('GET /api/boards/:id → returns single board', async () => {
        const res = await request(app)
            .get(`/api/boards/${createdBoardId}`)
            .set('Authorization', authHeader);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.board._id).toBe(createdBoardId);
        expect(res.body.board.name).toBe('Test Board from Jest');
    });

    it('GET /api/boards/invalid-id → 400 bad ID', async () => {
        const res = await request(app)
            .get('/api/boards/notanid')
            .set('Authorization', authHeader);

        expect(res.status).toBe(400);
    });

    it('GET /api/boards/:id (non-existent) → 404', async () => {
        const fakeId = new mongoose.Types.ObjectId().toString();
        const res = await request(app)
            .get(`/api/boards/${fakeId}`)
            .set('Authorization', authHeader);

        expect(res.status).toBe(404);
    });

    it('PUT /api/boards/:id → updates board', async () => {
        const res = await request(app)
            .put(`/api/boards/${createdBoardId}`)
            .set('Authorization', authHeader)
            .send({
                name: 'Updated Test Board',
                description: 'Updated description',
                sprint: 'Sprint 2',
            });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.board.name).toBe('Updated Test Board');
        expect(res.body.board.sprint).toBe('Sprint 2');
    });

    it('PUT /api/boards/:id with partial data → updates only provided fields', async () => {
        const res = await request(app)
            .put(`/api/boards/${createdBoardId}`)
            .set('Authorization', authHeader)
            .send({ sprint: 'Sprint 3' });

        expect(res.status).toBe(200);
        expect(res.body.board.sprint).toBe('Sprint 3');
        expect(res.body.board.name).toBe('Updated Test Board'); // unchanged
    });
});

// ─── Board Member Management ──────────────────────────────────────────────────
describe('Board Member Management', () => {
    let boardForMembers;

    beforeAll(async () => {
        const res = await request(app)
            .post('/api/boards')
            .set('Authorization', authHeader)
            .send({
                name: 'Board for Member Tests',
                description: 'Testing member operations',
                sprint: 'Sprint 1',
            });
        boardForMembers = res.body.board._id;
    });

    afterAll(async () => {
        if (boardForMembers) {
            await mongoose.connection.collection('boards').deleteOne({
                _id: new mongoose.Types.ObjectId(boardForMembers),
            });
        }
    });

    it('POST /api/boards/:id/members → adds member', async () => {
        const res = await request(app)
            .post(`/api/boards/${boardForMembers}/members`)
            .set('Authorization', authHeader)
            .send({
                member: {
                    id: 'user_member',
                    name: 'Member User',
                    email: 'member@test.com',
                    role: 'member',
                },
            });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.board.members).toBeDefined();
        expect(res.body.board.members.length).toBeGreaterThan(0);
        expect(res.body.board.members[0].id).toBe('user_member');
    });

    it('POST /api/boards/:id/members with duplicate member → 400', async () => {
        const res = await request(app)
            .post(`/api/boards/${boardForMembers}/members`)
            .set('Authorization', authHeader)
            .send({
                member: {
                    id: 'user_member',
                    name: 'Member User',
                    email: 'member@test.com',
                    role: 'member',
                },
            });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain('already a member');
    });

    it('POST /api/boards/:id/members adds admin role', async () => {
        const res = await request(app)
            .post(`/api/boards/${boardForMembers}/members`)
            .set('Authorization', authHeader)
            .send({
                member: {
                    id: 'user_admin_2',
                    name: 'Admin Two',
                    email: 'admin2@test.com',
                    role: 'admin',
                },
            });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        const addedMember = res.body.board.members.find(m => m.id === 'user_admin_2');
        expect(addedMember.role).toBe('admin');
    });

    it('DELETE /api/boards/:id/members/:memberId → removes member', async () => {
        const res = await request(app)
            .delete(`/api/boards/${boardForMembers}/members/user_member`)
            .set('Authorization', authHeader);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        const memberExists = res.body.board.members.some(m => m.id === 'user_member');
        expect(memberExists).toBe(false);
    });

    it('POST /api/boards/invalid-id/members → 400 bad ID', async () => {
        const res = await request(app)
            .post('/api/boards/notanid/members')
            .set('Authorization', authHeader)
            .send({
                member: { id: 'test', name: 'Test' },
            });

        expect(res.status).toBe(400);
    });

    it('DELETE /api/boards/invalid-id/members/:memberId → 400 bad ID', async () => {
        const res = await request(app)
            .delete('/api/boards/notanid/members/user_member')
            .set('Authorization', authHeader);

        expect(res.status).toBe(400);
    });
});

// ─── Board Access Control ─────────────────────────────────────────────────────
describe('Board Access Control', () => {
    let restrictedBoard;

    beforeAll(async () => {
        // Create a board with admin user
        const res = await request(app)
            .post('/api/boards')
            .set('Authorization', authHeader)
            .send({
                name: 'Board for Access Tests',
                description: 'Testing access control',
                sprint: 'Sprint 1',
            });
        restrictedBoard = res.body.board._id;
    });

    afterAll(async () => {
        if (restrictedBoard) {
            await mongoose.connection.collection('boards').deleteOne({
                _id: new mongoose.Types.ObjectId(restrictedBoard),
            });
        }
    });

    it('GET /api/boards/:id by non-member → 403', async () => {
        const res = await request(app)
            .get(`/api/boards/${restrictedBoard}`)
            .set('Authorization', memberAuthHeader);

        expect(res.status).toBe(403);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain('Access denied');
    });

    it('PUT /api/boards/:id by non-creator → 403', async () => {
        // First add member to board
        await request(app)
            .post(`/api/boards/${restrictedBoard}/members`)
            .set('Authorization', authHeader)
            .send({
                member: {
                    id: 'user_member',
                    name: 'Member User',
                    email: 'member@test.com',
                    role: 'member',
                },
            });

        // Try to update as member (not creator)
        const res = await request(app)
            .put(`/api/boards/${restrictedBoard}`)
            .set('Authorization', memberAuthHeader)
            .send({ name: 'Unauthorized Update' });

        expect(res.status).toBe(403);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain('creator');
    });

    it('DELETE /api/boards/:id by non-creator → 403', async () => {
        const res = await request(app)
            .delete(`/api/boards/${restrictedBoard}`)
            .set('Authorization', memberAuthHeader);

        expect(res.status).toBe(403);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain('creator');
    });

    it('GET /api/boards/:id by member → 200', async () => {
        const res = await request(app)
            .get(`/api/boards/${restrictedBoard}`)
            .set('Authorization', memberAuthHeader);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });
});

// ─── Board Deletion (Archive) ─────────────────────────────────────────────────
describe('Board Deletion', () => {
    let boardToDelete;

    beforeEach(async () => {
        const res = await request(app)
            .post('/api/boards')
            .set('Authorization', authHeader)
            .send({
                name: 'Board to Delete',
                description: 'This board will be deleted',
                sprint: 'Sprint 1',
            });
        boardToDelete = res.body.board._id;
    });

    it('DELETE /api/boards/:id → permanently deletes board', async () => {
        const res = await request(app)
            .delete(`/api/boards/${boardToDelete}`)
            .set('Authorization', authHeader);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toContain('deleted');

        // Verify board is deleted from DB
        const board = await mongoose.connection.collection('boards').findOne({
            _id: new mongoose.Types.ObjectId(boardToDelete),
        });
        expect(board).toBeNull();
    });

    it('DELETE /api/boards/:id (non-existent) → 404', async () => {
        const fakeId = new mongoose.Types.ObjectId().toString();
        const res = await request(app)
            .delete(`/api/boards/${fakeId}`)
            .set('Authorization', authHeader);

        expect(res.status).toBe(404);
    });

    it('Deleted board should not appear in GET /api/boards', async () => {
        // Delete the board
        await request(app)
            .delete(`/api/boards/${boardToDelete}`)
            .set('Authorization', authHeader);

        // Try to get all boards
        const res = await request(app)
            .get('/api/boards')
            .set('Authorization', authHeader);

        expect(res.status).toBe(200);
        const deletedBoard = res.body.boards.find(b => b._id === boardToDelete);
        expect(deletedBoard).toBeUndefined();
    });
});

// ─── Board Authentication ─────────────────────────────────────────────────────
describe('Board Authentication', () => {
    it('GET /api/boards without token → 401', async () => {
        const res = await request(app).get('/api/boards');
        expect(res.status).toBe(401);
    });

    it('GET /api/boards with invalid token → 401', async () => {
        const res = await request(app)
            .get('/api/boards')
            .set('Authorization', 'Bearer invalidtoken');
        expect(res.status).toBe(401);
    });

    it('POST /api/boards without token → 401', async () => {
        const res = await request(app)
            .post('/api/boards')
            .send({ name: 'Test Board' });
        expect(res.status).toBe(401);
    });

    it('PUT /api/boards/:id without token → 401', async () => {
        const fakeId = new mongoose.Types.ObjectId().toString();
        const res = await request(app)
            .put(`/api/boards/${fakeId}`)
            .send({ name: 'Updated' });
        expect(res.status).toBe(401);
    });

    it('DELETE /api/boards/:id without token → 401', async () => {
        const fakeId = new mongoose.Types.ObjectId().toString();
        const res = await request(app).delete(`/api/boards/${fakeId}`);
        expect(res.status).toBe(401);
    });
});
