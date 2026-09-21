const request = require('supertest');
const express = require('express');
const {
    validateCreateNotification,
    validateMarkAllRead,
    validateObjectId,
    validateUpdatePreferences,
} = require('../../src/middleware/validators');

function createValidatorApp(routePath, validators) {
    const app = express();
    app.use(express.json());
    app.post(routePath, validators, (req, res) => {
        res.status(200).json({ success: true });
    });
    return app;
}

describe('validators middleware', () => {
    describe('validateCreateNotification', () => {
        const app = createValidatorApp('/notifications', validateCreateNotification);

        it('accepts a valid notification payload', async () => {
            const response = await request(app)
                .post('/notifications')
                .send({
                    type: 'task_assigned',
                    title: 'Valid title',
                    message: 'Valid body',
                    recipientId: 'user_001',
                    priority: 'medium',
                });

            expect(response.status).toBe(200);
        });

        it('rejects titles longer than 200 characters', async () => {
            const response = await request(app)
                .post('/notifications')
                .send({
                    type: 'task_assigned',
                    title: 'x'.repeat(201),
                    message: 'Valid body',
                    recipientId: 'user_001',
                });

            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ field: 'title', message: 'Title cannot exceed 200 characters' }),
                ])
            );
        });

        it('rejects invalid priorities', async () => {
            const response = await request(app)
                .post('/notifications')
                .send({
                    type: 'task_assigned',
                    title: 'Valid title',
                    message: 'Valid body',
                    recipientId: 'user_001',
                    priority: 'urgent',
                });

            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ field: 'priority' }),
                ])
            );
        });
    });

    describe('validateUpdatePreferences', () => {
        const app = createValidatorApp('/preferences/:userId', validateUpdatePreferences);

        it('rejects non-boolean preference flags', async () => {
            const response = await request(app)
                .post('/preferences/user_001')
                .send({ emailEnabled: 'yes', inAppEnabled: 'no' });

            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ field: 'emailEnabled' }),
                    expect.objectContaining({ field: 'inAppEnabled' }),
                ])
            );
        });
    });

    describe('validateObjectId', () => {
        const app = createValidatorApp('/notifications/:id', validateObjectId);

        it('rejects invalid Mongo object IDs', async () => {
            const response = await request(app)
                .post('/notifications/not-a-valid-id')
                .send({});

            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ field: 'id', message: 'Invalid notification ID format' }),
                ])
            );
        });
    });

    describe('validateMarkAllRead', () => {
        const app = createValidatorApp('/notifications/read-all', validateMarkAllRead);

        it('requires a recipientId', async () => {
            const response = await request(app)
                .post('/notifications/read-all')
                .send({});

            expect(response.status).toBe(400);
            expect(response.body.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ field: 'recipientId', message: 'Recipient ID is required' }),
                ])
            );
        });
    });
});