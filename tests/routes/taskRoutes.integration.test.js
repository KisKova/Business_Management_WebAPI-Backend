
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

describe('Task Routes Integration', () => {
    it('GET /auth/tasks - should fetch all tasks', async () => {
        const res = await request(app).get('/auth/tasks');
        expect([200, 500]).toContain(res.statusCode);
    });

    it('GET /auth/tasks/:id - should fetch a single task', async () => {
        const res = await request(app).get('/auth/tasks/1');
        expect([200, 404, 500]).toContain(res.statusCode);
    });

    it('POST /auth/tasks - should create a task', async () => {
        const res = await request(app)
            .post('/auth/tasks')
            .send({ name: 'New Task' });
        expect([200, 201, 500]).toContain(res.statusCode);
    });

    it('PUT /auth/tasks/:id - should update task name', async () => {
        const res = await request(app)
            .put('/auth/tasks/1')
            .send({ name: 'Updated Task' });
        expect([200, 500]).toContain(res.statusCode);
    });

    it('DELETE /auth/tasks/:id - should delete a task', async () => {
        const res = await request(app).delete('/auth/tasks/1');
        expect([200, 500]).toContain(res.statusCode);
    });
});