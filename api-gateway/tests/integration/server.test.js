const request = require('supertest');
const { app } = require('../../src/server');

describe('API Gateway server', () => {
    it('returns gateway health status', async () => {
        const response = await request(app).get('/health');

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ status: 'OK', service: 'api-gateway' });
    });
});