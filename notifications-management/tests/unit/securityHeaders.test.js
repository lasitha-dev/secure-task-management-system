const fs = require('fs');
const path = require('path');
const request = require('supertest');
const express = require('express');

describe('X-Powered-By header', () => {
    it('is absent from responses once disabled the same way src/app.js does', async () => {
        const app = express();
        app.disable('x-powered-by');
        app.get('/health', (req, res) => res.status(200).json({ status: 'OK' }));

        const res = await request(app).get('/health');

        expect(res.headers['x-powered-by']).toBeUndefined();
    });

    it('src/app.js disables x-powered-by on the real Express app', () => {
        const appSource = fs.readFileSync(
            path.join(__dirname, '../../src/app.js'),
            'utf8'
        );

        expect(appSource).toMatch(/app\.disable\(\s*['"]x-powered-by['"]\s*\)/);
    });
});
