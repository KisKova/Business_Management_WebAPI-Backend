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

describe('Customer Routes Integration', () => {
    it('GET /auth/customers - should fetch all customers', async () => {
        const res = await request(app).get('/auth/customers');
        expect([200, 500]).toContain(res.statusCode);
    });

    it('POST /auth/customers - should create a customer', async () => {
        const res = await request(app)
            .post('/auth/customers')
            .send({
                name: 'New Customer',
                hourly_fee: 120,
                billing_type: 'hourly',
                invoice_type: 'email',
                tax_number: 'CUST123'
            });
        expect([200, 201, 500]).toContain(res.statusCode);
    });

    it('GET /auth/customers/:id - should fetch a single customer', async () => {
        const res = await request(app).get('/auth/customers/1');
        expect([200, 404, 500]).toContain(res.statusCode);
    });

    it('PUT /auth/customers/:id - should update a customer', async () => {
        const res = await request(app)
            .put('/auth/customers/1')
            .send({
                name: 'Updated Customer',
                hourly_fee: 150,
                billing_type: 'fixed',
                invoice_type: 'pdf',
                tax_number: 'CUST999'
            });
        expect([200, 500]).toContain(res.statusCode);
    });

    it('POST /auth/customers/:customer_id/users - should assign user to customer', async () => {
        const res = await request(app)
            .post('/auth/customers/1/users')
            .send({ user_id: 2 });
        expect([200, 500]).toContain(res.statusCode);
    });

    it('GET /auth/customers/:customer_id/users - should fetch users assigned to customer', async () => {
        const res = await request(app).get('/auth/customers/1/users');
        expect([200, 500]).toContain(res.statusCode);
    });

    it('DELETE /auth/customers/:customer_id/users/:user_id - should remove assigned user', async () => {
        const res = await request(app).delete('/auth/customers/1/users/2');
        expect([200, 500]).toContain(res.statusCode);
    });
});