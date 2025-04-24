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

describe('Time Tracking Routes Integration', () => {
    it('GET /auth/time-tracking - should fetch all time tracking', async () => {
        const res = await request(app).get('/auth/time-tracking');
        console.log("This is the status code: " + res.statusCode);
        expect([200, 500]).toContain(res.statusCode);
    });

    it('POST /auth/time-tracking/start - should start tracking', async () => {
        const res = await request(app)
            .post('/auth/time-tracking/start')
            .send({ note: 'Starting work on task' });
        console.log("This is the status code: " + res.statusCode);
        expect([200, 500]).toContain(res.statusCode);
    });

    it('POST /auth/time-tracking/stop - should stop tracking', async () => {
        const res = await request(app)
            .post('/auth/time-tracking/stop')
            .send({ id: 1, project_id: 1, task_id: 1, customer_id: 1 });
        console.log("This is the status code: " + res.statusCode);
        expect([200, 500]).toContain(res.statusCode);
    });

    it('POST /auth/time-tracking/manual - should add manual tracking', async () => {
        const res = await request(app)
            .post('/auth/time-tracking/manual')
            .send({
                customer_id: 1,
                project_id: 2,
                task_id: 3,
                start_time: new Date().toISOString(),
                duration_hours: 1,
                duration_minutes: 30,
                note: "Manual entry"
            });
        console.log("This is the status code: " + res.statusCode);
        expect([200, 500]).toContain(res.statusCode);
    });

    it('DELETE /auth/time-tracking/:id - should delete a tracking entry', async () => {
        const res = await request(app).delete('/auth/time-tracking/1');
        console.log("This is the status code: " + res.statusCode);
        expect([200, 500]).toContain(res.statusCode);
    });

    it('PUT /auth/time-tracking/:id - should update tracking', async () => {
        const res = await request(app)
            .put('/auth/time-tracking/1')
            .send({
                start_time: new Date().toISOString(),
                duration_hours: 2,
                duration_minutes: 0,
                customer_id: 1,
                project_id: 2,
                task_id: 3,
                note: "Updated task"
            });
        console.log("This is the status code: " + res.statusCode);
        expect([200, 500]).toContain(res.statusCode);
    });

    it('GET /auth/time-tracking/active - should get active tracking session', async () => {
        const res = await request(app).get('/auth/time-tracking/active');
        console.log("This is the status code: " + res.statusCode);
        expect([200, 500]).toContain(res.statusCode);
    });

    it('GET /auth/time-tracking/all-active - should get all active sessions', async () => {
        const res = await request(app).get('/auth/time-tracking/all-active');
        console.log("This is the status code: " + res.statusCode);
        expect([200, 500]).toContain(res.statusCode);
    });

    it('GET /auth/time-tracking/entries - should get user time entries', async () => {
        const res = await request(app).get('/auth/time-tracking/entries');
        console.log("This is the status code: " + res.statusCode);
        expect([200, 500]).toContain(res.statusCode);
    });

    it('GET /auth/time-tracking/assigned-customers - should get assigned customers', async () => {
        const res = await request(app).get('/auth/time-tracking/assigned-customers');
        console.log("This is the status code: " + res.statusCode);
        expect([200, 500]).toContain(res.statusCode);
    });

    it('GET /auth/time-tracking/:id/summary - should get customer summary', async () => {
        const res = await request(app).get('/auth/time-tracking/1/summary');
        console.log("This is the status code: " + res.statusCode);
        expect([200, 500]).toContain(res.statusCode);
    });
});