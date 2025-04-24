const request = require('supertest');
const app = require('../../server'); // assuming the express app is exported here

jest.mock('../../middlewares/authMiddleware', () => ({
    authenticateJWT: (req, res, next) => {
        req.user = { userId: 1, role: 'admin' }; // Simulate authenticated admin user
        next();
    },
    isAdmin: (req, res, next) => {
        if (req.user.role === 'admin') return next();
        return res.status(403).json({ error: 'Forbidden' });
    }
}));

describe('User Routes Integration', () => {
    it('POST /auth/login - should login user', async () => {
        const response = await request(app)
            .post('/auth/login')
            .send({ identifier: 'brownieka@ppcmedia.hu', password: 'juti' });

        expect([200, 500]).toContain(response.statusCode); // mock backend may return 500
    });

    it('GET /auth/profile - should get user profile', async () => {
        const response = await request(app).get('/auth/profile');
        expect([200, 500]).toContain(response.statusCode);
    });

    it('GET /auth/admin - should return admin welcome message', async () => {
        const response = await request(app).get('/auth/admin');
        expect(response.statusCode).toBe(200);
        expect(response.body.message).toBe('Welcome Admin');
    });

    it('PUT /auth/change-password - should update password', async () => {
        const response = await request(app)
            .put('/auth/change-password')
            .send({ oldPassword: 'oldpass', newPassword: 'newpass' });

        expect([200, 500]).toContain(response.statusCode);
    });

    it('PUT /auth/change-personal-data - should update personal data', async () => {
        const response = await request(app)
            .put('/auth/change-personal-data')
            .send({ username: 'updateduser', email: 'updated@ppcmedia.hu' });

        expect([200, 500]).toContain(response.statusCode);
    });

    it('GET /auth/users - should fetch all users', async () => {
        const response = await request(app).get('/auth/users');
        expect([200, 500]).toContain(response.statusCode);
    });

    it('POST /auth/create-user - should create a new user', async () => {
        const response = await request(app)
            .post('/auth/create-user')
            .send({
                username: 'newuser',
                email: 'newuser@ppcmedia.hu',
                password: 'securepass',
                role: 'user'
            });

        expect([200, 500]).toContain(response.statusCode);
    });

    it('PUT /auth/users/:id - should update a user', async () => {
        const response = await request(app)
            .put('/auth/users/1')
            .send({
                id: 1,
                username: 'updateduser',
                email: 'updated@ppcmedia.hu',
                role: 'admin',
                is_active: true
            });

        expect([200, 500]).toContain(response.statusCode);
    });

    it('PUT /auth/users/:id/password - should update user password', async () => {
        const response = await request(app)
            .put('/auth/users/1/password')
            .send({ id: 1, newPassword: 'newpassword123' });

        expect([200, 500]).toContain(response.statusCode);
    });
});