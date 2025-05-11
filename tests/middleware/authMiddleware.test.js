const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const { authenticateJWT, isAdmin } = require('../../middlewares/authMiddleware');

const app = express();
app.use(express.json());

// Protected route with JWT auth
app.get('/protected', authenticateJWT, (req, res) => {
    res.json({ message: 'Authenticated' });
});

// Protected route with admin check
app.get('/admin-only', authenticateJWT, isAdmin, (req, res) => {
    res.json({ message: 'Welcome Admin' });
});

describe('authMiddleware.js', () => {
    const secret = process.env.JWT_SECRET;

    it('should return 403 if no token is provided', async () => {
        const res = await request(app).get('/protected');
        expect(res.statusCode).toBe(403);
        expect(res.body.message).toMatch(/no token/i);
    });

    it('should return 403 if token is invalid', async () => {
        const res = await request(app)
            .get('/protected')
            .set('Authorization', 'Bearer invalid.token.here');

        expect(res.statusCode).toBe(403);
        expect(res.body.message).toMatch(/Invalid token/i);
    });

    it('should return 403 if user is not admin', async () => {
        const nonAdminToken = jwt.sign({ id: 1, role: 'user' }, secret);
        const res = await request(app)
            .get('/admin-only')
            .set('Authorization', `Bearer ${nonAdminToken}`);

        expect(res.statusCode).toBe(403);
        expect(res.body.message).toMatch(/Access denied, admin only/i);
    });

    it('should pass if token is valid and user is admin', async () => {
        const adminToken = jwt.sign({ id: 2, role: 'admin' }, secret);
        const res = await request(app)
            .get('/admin-only')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('Welcome Admin');
    });
});
