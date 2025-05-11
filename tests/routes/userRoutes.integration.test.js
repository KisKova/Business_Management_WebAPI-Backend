const request = require('supertest');
const app = require('../../server');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

describe('User Routes Integration', () => {
    let adminToken;
    let adminId;
    let createdUserId;
    let unique;

    beforeAll(async () => {
        unique = Date.now();
        const email = `adminseed_${unique}@ppcmedia.hu`;

        const hashedPassword = await bcrypt.hash('adminpass', 10);
        const result = await pool.query(`
            INSERT INTO users (username, email, password, role, is_active)
            VALUES ($1, $2, $3, 'admin', true)
            ON CONFLICT (email) DO UPDATE SET password = $3
            RETURNING id;
        `, [`adminseed_${unique}`, email, hashedPassword]);

        adminId = result.rows[0].id;

        const login = await request(app)
            .post('/auth/login')
            .send({ identifier: email, password: 'adminpass' });

        adminToken = login.body?.token || login.body?.data?.token;
        expect(adminToken).toBeDefined();
    });

    afterAll(async () => {
        await pool.query(`DELETE FROM users WHERE email LIKE $1`, [`testuser%`]);
        await pool.query(`DELETE FROM users WHERE email LIKE $1`, [`adminseed_%@ppcmedia.hu`]);
        await pool.end();
    });

    it('POST /auth/create-user - should allow admin to create a new user', async () => {
        const res = await request(app)
            .post('/auth/create-user')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                username: `testuser_${unique}`,
                email: `testuser_${unique}@ppcmedia.hu`,
                password: 'testpass123',
                role: 'user'
            });
        console.log(res.body);

        expect(res.statusCode).toBe(200);
        expect(res.body.data.message).toMatch(/User created successfully/i);
        createdUserId = res.body.data.newUser.id;
    });

    it('GET /auth/users - should return all users (admin only)', async () => {
        const res = await request(app)
            .get('/auth/users')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(200);
        //expect(Array.isArray(res.body)).toBe(true);
        //expect(res.body.some(u => u.email === `testuser_${unique}@ppcmedia.hu`)).toBe(true);
    });

    it('PUT /auth/users/:id - should update user data (admin only)', async () => {
        const res = await request(app)
            .put(`/auth/users/${createdUserId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                id: createdUserId,
                username: `updateduser_${unique}`,
                email: `updateduser_${unique}@ppcmedia.hu`,
                role: 'user',
                is_active: true
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.data.message).toMatch(/updated successfully/i);
    });

    it('PUT /auth/users/:id/password - should update user password (admin only)', async () => {
        const res = await request(app)
            .put(`/auth/users/${createdUserId}/password`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ id: createdUserId, newPassword: 'newpass123' });

        expect(res.statusCode).toBe(200);
        expect(res.body.data.message).toMatch(/Password updated successfully/i);
    });

    it('PUT /auth/change-personal-data - should allow user to change their personal data', async () => {
        const login = await request(app)
            .post('/auth/login')
            .send({ identifier: `updateduser_${unique}@ppcmedia.hu`, password: 'newpass123' });

        const userToken = login.body?.data?.token;
        expect(userToken).toBeDefined();

        const res = await request(app)
            .put('/auth/change-personal-data')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
                email: `updateduser2_${unique}@ppcmedia.hu`,
                username: `updateduser2_${unique}`
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.data.message).toMatch(/updated successfully/i);
    });

    it('PUT /auth/change-password - should allow user to change their own password', async () => {
        const login = await request(app)
            .post('/auth/login')
            .send({ identifier: `updateduser2_${unique}@ppcmedia.hu`, password: 'newpass123' });

        const userToken = login.body?.data?.token;
        expect(userToken).toBeDefined();

        const res = await request(app)
            .put('/auth/change-password')
            .set('Authorization', `Bearer ${userToken}`)
            .send({ oldPassword: 'newpass123', newPassword: 'finalpass123' });

        expect(res.statusCode).toBe(200);
        expect(res.body.data.message).toMatch(/Password updated successfully/i);
    });

    it('GET /auth/admin - should only be accessible to admin', async () => {
        const res = await request(app)
            .get('/auth/admin')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(200);
        //expect(res.body.data.message).toMatch(/Welcome Admin/i);
    });
});
