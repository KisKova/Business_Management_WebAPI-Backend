const request = require('supertest');
const app = require('../../server');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

describe('Customer Routes Integration (Isolated)', () => {
    let token;
    let customerId;
    let userId;
    const unique = Date.now();

    beforeAll(async () => {
        const email = `adminseed_${unique}@ppcmedia.hu`;
        const username = `adminseed_${unique}`;

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
        await pool.query(`DELETE FROM customer_users WHERE user_id = $1`, [userId]);
        await pool.query(`DELETE FROM customers WHERE tax_number LIKE $1`, [`${unique}%`]);
        await pool.query(`DELETE FROM users WHERE email = $1`, [`adminseed_${unique}@ppcmedia.hu`]);
        await pool.end();
    });

    it('POST /auth/customers - should create a new customer', async () => {
        const response = await request(app)
            .post('/auth/customers')
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: `Customer X ${unique}`,
                hourly_fee: 100,
                billing_type: 'hourly',
                invoice_type: 'monthly',
                tax_number: `${unique}`
            });

        expect(response.statusCode).toBe(200);
        expect(response.body.data.name).toContain('Customer X');
        customerId = response.body.data.id;
    });

    it('GET /auth/customers - should fetch all customers', async () => {
        await pool.query(`
            INSERT INTO customers (name, hourly_fee, billing_type, invoice_type, tax_number)
            VALUES ('Alpha Co ${unique}', 80, 'hourly', 'monthly', '${unique + 1}')
        `);

        const response = await request(app)
            .get('/auth/customers')
            .set('Authorization', `Bearer ${token}`);

        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('GET /auth/customers/:id - should fetch a single customer by ID', async () => {
        const inserted = await pool.query(`
            INSERT INTO customers (name, hourly_fee, billing_type, invoice_type, tax_number)
            VALUES ('Beta Co ${unique}', 120, 'hourly', 'monthly', '${unique + 2}') RETURNING id
        `);
        customerId = inserted.rows[0].id;

        const response = await request(app)
            .get(`/auth/customers/${customerId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.data.name).toContain('Beta Co');
    });

    it('PUT /auth/customers/:id - should update a customer', async () => {
        const inserted = await pool.query(`
            INSERT INTO customers (name, hourly_fee, billing_type, invoice_type, tax_number)
            VALUES ('Gamma Co ${unique}', 90, 'hourly', 'monthly', '${unique + 3}') RETURNING id
        `);
        customerId = inserted.rows[0].id;

        const response = await request(app)
            .put(`/auth/customers/${customerId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: `Gamma Updated ${unique}`,
                hourly_fee: 95,
                billing_type: 'hourly',
                invoice_type: 'monthly',
                tax_number: `${unique + 3}`
            });

        expect(response.statusCode).toBe(200);
    });

    it('POST /auth/customers/:customer_id/users - should assign user to customer', async () => {
        const inserted = await pool.query(`
            INSERT INTO customers (name, hourly_fee, billing_type, invoice_type, tax_number)
            VALUES ('Delta Co ${unique}', 110, 'hourly', 'monthly', '${unique + 4}') RETURNING id
        `);
        customerId = inserted.rows[0].id;

        const response = await request(app)
            .post(`/auth/customers/${customerId}/users`)
            .set('Authorization', `Bearer ${token}`)
            .send({ user_id: userId });

        expect(response.statusCode).toBe(200);
    });

    it('GET /auth/customers/:customer_id/users - should return assigned users', async () => {
        const inserted = await pool.query(`
            INSERT INTO customers (name, hourly_fee, billing_type, invoice_type, tax_number)
            VALUES ('Epsilon Co ${unique}', 130, 'hourly', 'monthly', '${unique + 5}') RETURNING id
        `);
        customerId = inserted.rows[0].id;

        await pool.query(`
            INSERT INTO customer_users (customer_id, user_id) VALUES ($1, $2)
        `, [customerId, userId]);

        const response = await request(app)
            .get(`/auth/customers/${customerId}/users`)
            .set('Authorization', `Bearer ${token}`);

        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.some(u => u.id === userId)).toBe(true);
    });
});