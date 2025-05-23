const customerModel = require('../../features/customer/customerModel');
const { Pool } = require('pg');

jest.mock('pg', () => {
    const mockQuery = jest.fn();
    return {
        Pool: jest.fn(() => ({
            query: mockQuery
        })),
        __mockQuery: mockQuery
    };
});

const { __mockQuery } = require('pg');

describe('customerModel unit tests (mocked pg)', () => {
    beforeEach(() => {
        __mockQuery.mockReset();
    });

    it('getAllCustomer should return all customers', async () => {
        const customers = [{ id: 1, name: 'Customer A' }];
        __mockQuery.mockResolvedValue({ rows: customers });
        const result = await customerModel.getAllCustomer();
        expect(__mockQuery).toHaveBeenCalledWith('SELECT * FROM customers ORDER BY id ASC');
        expect(result).toEqual(customers);
    });

    it('getCustomerById should return a customer', async () => {
        const customer = { id: 1, name: 'Customer B' };
        __mockQuery.mockResolvedValue({ rows: [customer] });
        const result = await customerModel.getCustomerById(1);
        expect(__mockQuery).toHaveBeenCalledWith('SELECT * FROM customers WHERE id = $1', [1]);
        expect(result).toEqual(customer);
    });

    it('createCustomer should insert and return a new customer', async () => {
        const input = { name: 'New C', hourly_fee: 100, billing_type: 'hourly', invoice_type: 'monthly', tax_number: '1234' };
        const created = { id: 2, ...input };
        __mockQuery.mockResolvedValue({ rows: [created] });
        const result = await customerModel.createCustomer(input);
        expect(result).toEqual(created);
    });

    it('updateCustomer should update customer fields', async () => {
        const input = { name: 'Updated', hourly_fee: 150, billing_type: 'fixed', invoice_type: 'quarterly', tax_number: '5678' };
        await customerModel.updateCustomer(1, input);
        expect(__mockQuery).toHaveBeenCalledWith(
            expect.stringContaining('UPDATE customers SET'),
            [...Object.values(input), 1]
        );
    });

    it('assignUserToCustomer should insert a record', async () => {
        await customerModel.assignUserToCustomer(2, 3);
        expect(__mockQuery).toHaveBeenCalledWith(
            'INSERT INTO customer_users (customer_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [2, 3]
        );
    });

    it('getUsersByCustomerId should return assigned users', async () => {
        const users = [{ id: 1, username: 'admin' }];
        __mockQuery.mockResolvedValue({ rows: users });
        const result = await customerModel.getUsersByCustomerId(2);
        expect(result).toEqual(users);
    });

    it('removeUserFromCustomer should return true if row deleted', async () => {
        __mockQuery.mockResolvedValue({ rowCount: 1 });
        const result = await customerModel.removeUserFromCustomer(2, 3);
        expect(result).toBe(true);
    });

    it('removeUserFromCustomer should return false if nothing deleted', async () => {
        __mockQuery.mockResolvedValue({ rowCount: 0 });
        const result = await customerModel.removeUserFromCustomer(2, 3);
        expect(result).toBe(false);
    });
});
