const request = require('supertest');
const app = require('../../server');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

describe('Task Routes Integration (Isolated)', () => {
    let token;
    let userId;
    const unique = `task_${Date.now()}`;

    beforeAll(async () => {
        const email = `${unique}@ppcmedia.hu`;
        const username = unique;
        const hashedPassword = await bcrypt.hash('adminpass', 10);

        await pool.query(`
            INSERT INTO users (username, email, password, role, is_active)
            VALUES ($1, $2, $3, 'admin', true)
            ON CONFLICT (email) DO NOTHING;
        `, [username, email, hashedPassword]);

        const login = await request(app)
            .post('/auth/login')
            .send({ identifier: email, password: 'adminpass' });

        token = login.body?.data?.token;
        userId = login.body?.data?.user?.id;

        expect(token).toBeDefined();
        expect(userId).toBeDefined();
    });

    afterAll(async () => {
        await pool.query(`DELETE FROM tasks WHERE name LIKE $1`, [`Task task_%`]);
        await pool.query(`DELETE FROM users WHERE email = $1`, [`${unique}@ppcmedia.hu`]);
        await pool.end();
    });

    it('POST /auth/tasks - should create a new task', async () => {
        const response = await request(app)
            .post('/auth/tasks')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: `Task ${unique}_A` });

        expect(response.statusCode).toBe(200);
        expect(response.body.data.name).toBe(`Task ${unique}_A`);
    });

    it('GET /auth/tasks - should return all tasks', async () => {
        await pool.query(`INSERT INTO tasks (name) VALUES ($1)`, [`Task ${unique}_B`]);

        const response = await request(app)
            .get('/auth/tasks')
            .set('Authorization', `Bearer ${token}`);

        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.some(t => t.name.includes(`${unique}`))).toBe(true);
    });

    it('PUT /auth/tasks/:id - should update a task name', async () => {
        const inserted = await pool.query(`
            INSERT INTO tasks (name) VALUES ($1) RETURNING id
        `, [`Task ${unique}_C`]);

        const taskId = inserted.rows[0].id;

        const response = await request(app)
            .put(`/auth/tasks/${taskId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ name: `Updated Task ${unique}_C` });

        expect(response.statusCode).toBe(200);
        expect(response.body.data.name).toBe(`Updated Task ${unique}_C`);
    });

    it('DELETE /auth/tasks/:id - should delete a task', async () => {
        const inserted = await pool.query(`
            INSERT INTO tasks (name) VALUES ($1) RETURNING id
        `, [`Task ${unique}_D`]);

        const taskId = inserted.rows[0].id;

        const response = await request(app)
            .delete(`/auth/tasks/${taskId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(response.statusCode).toBe(200);
        //expect(response.body.data.message.toLowerCase()).toContain('deleted');
    });
});
