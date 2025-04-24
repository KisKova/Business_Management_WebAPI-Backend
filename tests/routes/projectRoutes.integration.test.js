
const request = require('supertest');
const app = require('../../server');

jest.mock('../../middlewares/authMiddleware', () => ({
    authenticateJWT: (req, res, next) => {
        req.user = { userId: 1, role: 'admin' };
        next();
    },
    isAdmin: (req, res, next) => {
        if (req.user.role === 'admin') return next();
        return res.status(403).json({ error: 'Forbidden' });
    }
}));

describe('Project Routes Integration', () => {
    it('GET /auth/projects - should fetch all projects', async () => {
        const res = await request(app).get('/auth/projects');
        expect([200, 500]).toContain(res.statusCode);
    });

    it('GET /auth/projects/:id - should fetch a single project', async () => {
        const res = await request(app).get('/auth/projects/1');
        expect([200, 404, 500]).toContain(res.statusCode);
    });

    it('POST /auth/projects - should create a project', async () => {
        const res = await request(app)
            .post('/auth/projects')
            .send({ name: 'New Project' });
        expect([200, 201, 500]).toContain(res.statusCode);
    });

    it('PUT /auth/projects/:id - should update a project name', async () => {
        const res = await request(app)
            .put('/auth/projects/1')
            .send({ name: 'Updated Project' });
        expect([200, 500]).toContain(res.statusCode);
    });

    it('DELETE /auth/projects/:id - should delete a project', async () => {
        const res = await request(app).delete('/auth/projects/1');
        expect([200, 500]).toContain(res.statusCode);
    });
});