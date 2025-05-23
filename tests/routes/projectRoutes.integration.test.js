const request = require('supertest');
const app = require('../../server');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

describe('Project Routes Integration (Isolated)', () => {
    let token;
    let userId;
    const unique = `project_${Date.now()}`;

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
        // Only delete projectRoutes test-created projects
        await pool.query(`DELETE FROM projects WHERE name LIKE $1`, [`Project project_%`]);
        await pool.query(`DELETE FROM users WHERE email = $1`, [`${unique}@ppcmedia.hu`]);
        await pool.end();
    });

    it('POST /auth/projects - should create a new project', async () => {
        const response = await request(app)
            .post('/auth/projects')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: `Project ${unique}_A` });

        expect(response.statusCode).toBe(200);
        expect(response.body.data.name).toBe(`Project ${unique}_A`);
    });

    it('GET /auth/projects - should return all projects', async () => {
        await pool.query(`
            INSERT INTO projects (name) VALUES ($1)
        `, [`Project ${unique}_B`]);

        const response = await request(app)
            .get('/auth/projects')
            .set('Authorization', `Bearer ${token}`);

        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.some(p => p.name.includes(`${unique}`))).toBe(true);
    });

    it('PUT /auth/projects/:id - should update a project name', async () => {
        const inserted = await pool.query(`
            INSERT INTO projects (name) VALUES ($1) RETURNING id
        `, [`Project ${unique}_C`]);

        const projectId = inserted.rows[0].id;

        const response = await request(app)
            .put(`/auth/projects/${projectId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ name: `Updated Project ${unique}_C` });

        expect(response.statusCode).toBe(200);
        expect(response.body.data.name).toBe(`Updated Project ${unique}_C`);
    });

    it('DELETE /auth/projects/:id - should delete a project', async () => {
        const inserted = await pool.query(`
            INSERT INTO projects (name) VALUES ($1) RETURNING id
        `, [`Project ${unique}_D`]);

        const projectId = inserted.rows[0].id;

        const response = await request(app)
            .delete(`/auth/projects/${projectId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(response.statusCode).toBe(200);
        //expect(response.body.data.message.toLowerCase()).toContain('deleted');
    });
});
