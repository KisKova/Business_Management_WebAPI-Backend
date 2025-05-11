const request = require('supertest');
const app = require('../../server');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

describe('Time Tracking Routes Integration (Isolated)', () => {
    let token;
    let userId;
    let customerId;
    let projectId;
    let taskId;
    const unique = `tracking_${Date.now()}`;

    beforeAll(async () => {
        const email = `${unique}@ppcmedia.hu`;
        const username = unique;

        const hashedPassword = await bcrypt.hash('adminpass', 10);
        const result = await pool.query(`
            INSERT INTO users (username, email, password, role, is_active)
            VALUES ($1, $2, $3, 'admin', true)
            ON CONFLICT (email) DO NOTHING
            RETURNING id;
        `, [username, email, hashedPassword]);
        userId = result.rows[0].id;

        const login = await request(app)
            .post('/auth/login')
            .send({ identifier: email, password: 'adminpass' });

        token = login.body?.data?.token;
        expect(token).toBeDefined();

        const customer = await pool.query(`
            INSERT INTO customers (name, hourly_fee, billing_type, invoice_type, tax_number)
            VALUES ($1, 100, 'hourly', 'monthly', $2)
            RETURNING id;
        `, [`Customer ${unique}`, `${Date.now()}`]);
        customerId = customer.rows[0].id;

        await pool.query(`INSERT INTO customer_users (customer_id, user_id) VALUES ($1, $2)`, [customerId, userId]);

        const project = await pool.query(`INSERT INTO projects (name) VALUES ($1) RETURNING id`, [`Project ${unique}`]);
        projectId = project.rows[0].id;

        const task = await pool.query(`INSERT INTO tasks (name) VALUES ($1) RETURNING id`, [`Task ${unique}`]);
        taskId = task.rows[0].id;
    });

    afterAll(async () => {
        await pool.query(`DELETE FROM time_tracking WHERE note LIKE ANY($1)`, [[
            `Manual entry test ${unique}`,
            'To be updated',
            'Updated entry',
            'Delete me'
        ]]);
        await pool.query(`DELETE FROM customer_users WHERE user_id = $1`, [userId]);
        await pool.query(`DELETE FROM customers WHERE name LIKE $1`, [`Customer ${unique}%`]);
        await pool.query(`DELETE FROM projects WHERE name LIKE $1`, [`Project ${unique}%`]);
        await pool.query(`DELETE FROM tasks WHERE name LIKE $1`, [`Task ${unique}%`]);
        await pool.query(`DELETE FROM users WHERE email = $1`, [`${unique}@ppcmedia.hu`]);
        await pool.end();
    });

    it('POST /auth/time-tracking/manual - should create manual tracking', async () => {
        const response = await request(app)
            .post('/auth/time-tracking/manual')
            .set('Authorization', `Bearer ${token}`)
            .send({
                customer_id: customerId,
                project_id: projectId,
                task_id: taskId,
                start_time: new Date().toISOString(),
                duration_hours: 1,
                duration_minutes: 15,
                note: `Manual entry test ${unique}`
            });

        console.log('Manual tracking response:', response.body);
        expect(response.statusCode).toBe(200);
        expect(response.body.data.note).toContain('Manual entry test');
    });

    it('POST /auth/time-tracking/start - should begin a tracking session', async () => {
        const response = await request(app)
            .post('/auth/time-tracking/start')
            .set('Authorization', `Bearer ${token}`)
            .send({ note: 'Started work' });

        expect(response.statusCode).toBe(200);
        expect(response.body.data.note).toBe('Started work');
    });

    it('POST /auth/time-tracking/stop - should stop an active session', async () => {
        await request(app)
            .post('/auth/time-tracking/start')
            .set('Authorization', `Bearer ${token}`)
            .send({ note: 'Track this' });

        const active = await pool.query(`SELECT id FROM time_tracking WHERE user_id = $1 AND end_time IS NULL`, [userId]);
        const trackingId = active.rows[0]?.id;
        expect(trackingId).toBeDefined();

        const response = await request(app)
            .post('/auth/time-tracking/stop')
            .set('Authorization', `Bearer ${token}`)
            .send({
                id: trackingId,
                customer_id: customerId,
                project_id: projectId,
                task_id: taskId
            });

        expect(response.statusCode).toBe(200);
        expect(response.body.data.id).toBe(trackingId);
    });

    it('PUT /auth/time-tracking/:id - should update tracking entry', async () => {
        const manual = await request(app)
            .post('/auth/time-tracking/manual')
            .set('Authorization', `Bearer ${token}`)
            .send({
                customer_id: customerId,
                project_id: projectId,
                task_id: taskId,
                start_time: '2025-02-02T07:00:00.000Z',
                duration_hours: 1,
                duration_minutes: 15,
                note: 'To be updated'
            });

        expect(manual.statusCode).toBe(200);
        const trackingId = manual.body?.data?.id;
        expect(trackingId).toBeDefined();

        const response = await request(app)
            .put(`/auth/time-tracking/${trackingId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                customer_id: customerId,
                project_id: projectId,
                task_id: taskId,
                start_time: '2025-02-02T07:00:00.000Z',
                duration_hours: 2,
                duration_minutes: 5,
                note: 'Updated entry'
            });

        expect(response.statusCode).toBe(200);
        expect(response.body.data.note).toBe('Updated entry');
    });

    it('DELETE /auth/time-tracking/:id - should delete tracking record', async () => {
        const manual = await request(app)
            .post('/auth/time-tracking/manual')
            .set('Authorization', `Bearer ${token}`)
            .send({
                customer_id: customerId,
                project_id: projectId,
                task_id: taskId,
                start_time: new Date().toISOString(),
                duration_hours: 0,
                duration_minutes: 45,
                note: 'Delete me'
            });

        console.log('Manual tracking response:', manual.body);
        expect(manual.statusCode).toBe(200);
        const trackingId = manual.body?.data?.id;
        expect(trackingId).toBeDefined();

        const response = await request(app)
            .delete(`/auth/time-tracking/${trackingId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(response.statusCode).toBe(200);
        //expect(response.body.data.message).toMatch(/deleted/i);
    });

    it('GET /auth/time-tracking/:id/summary - should return customer monthly summary', async () => {
        const result = await request(app)
            .get(`/auth/time-tracking/${customerId}/summary`)
            .set('Authorization', `Bearer ${token}`);

        expect(result.statusCode).toBe(200);
        expect(Array.isArray(result.body.data)).toBe(true);
    });

    it('GET /auth/time-tracking - should return all time tracking records', async () => {
        const result = await request(app)
            .get('/auth/time-tracking')
            .set('Authorization', `Bearer ${token}`);

        expect(result.statusCode).toBe(200);
        expect(Array.isArray(result.body.data)).toBe(true);
    });

    it('GET /auth/time-tracking/entries - should return user time entries', async () => {
        const result = await request(app)
            .get('/auth/time-tracking/entries')
            .set('Authorization', `Bearer ${token}`);

        expect(result.statusCode).toBe(200);
        expect(Array.isArray(result.body.data)).toBe(true);
    });

    it('GET /auth/time-tracking/all-active - should return all active sessions', async () => {
        const result = await request(app)
            .get('/auth/time-tracking/all-active')
            .set('Authorization', `Bearer ${token}`);

        expect(result.statusCode).toBe(200);
        expect(Array.isArray(result.body.data)).toBe(true);
    });

    it('GET /auth/time-tracking/active - should return active session or null', async () => {
        const result = await request(app)
            .get('/auth/time-tracking/active')
            .set('Authorization', `Bearer ${token}`);

        expect(result.statusCode).toBe(200);
    });
});
