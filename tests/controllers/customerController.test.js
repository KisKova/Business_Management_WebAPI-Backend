const customerController = require('../../features/customer/customerController');
const customerService = require('../../features/customer/customerModel');
const BaseController = require('../../utils/BaseController');
const { checkAdmin } = require('../../utils/roleCheck');

jest.mock('../../features/customer/customerModel');
jest.mock('../../utils/roleCheck', () => ({ checkAdmin: jest.fn() }));

describe('Customer Controller (full coverage)', () => {
    let mockRes;

    beforeEach(() => {
        mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn() };

        BaseController.handleRequest = async (res, fn, options) => {
            try {
                const data = await fn();
                res.status(200).json(data);
            } catch (err) {
                res.status(500).json({ error: err.message });
            }
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('getAllCustomer - should return all customers', async () => {
        const customers = [{ id: 1, name: 'Customer A' }];
        customerService.getAllCustomer.mockResolvedValue(customers);
        const req = { user: { role: 'admin' } };

        await customerController.getAllCustomer(req, mockRes);
        expect(mockRes.json).toHaveBeenCalledWith(customers);
    });

    it('getCustomerById - should return customer by id', async () => {
        const customer = { id: 1, name: 'Customer A' };
        customerService.getCustomerById.mockResolvedValue(customer);
        const req = { params: { id: 1 }, user: { role: 'admin' } };

        await customerController.getCustomerById(req, mockRes);
        expect(mockRes.json).toHaveBeenCalledWith(customer);
    });

    it('createCustomer - should create a customer', async () => {
        const newCustomer = { id: 2, name: 'New Customer' };
        customerService.createCustomer.mockResolvedValue(newCustomer);
        const req = { body: { name: 'New Customer', hourly_fee: 50, billing_type: 'hourly', invoice_type: 'email', tax_number: 'TX100' }, user: { role: 'admin' } };

        await customerController.createCustomer(req, mockRes);
        expect(mockRes.json).toHaveBeenCalledWith(newCustomer);
    });

    it('updateCustomer - should update a customer', async () => {
        customerService.updateCustomer.mockResolvedValue();
        const req = { params: { id: 1 }, body: { name: 'Updated Customer', hourly_fee: 100, billing_type: 'fixed', invoice_type: 'pdf', tax_number: 'TX999' }, user: { role: 'admin' } };

        await customerController.updateCustomer(req, mockRes);
        expect(mockRes.json).toHaveBeenCalledWith(undefined);
    });

    it('assignUserToCustomer - should assign user to customer', async () => {
        customerService.assignUserToCustomer.mockResolvedValue();
        const req = { params: { customer_id: 1 }, body: { user_id: 3 }, user: { role: 'admin' } };

        await customerController.assignUserToCustomer(req, mockRes);
        expect(mockRes.json).toHaveBeenCalledWith(undefined);
    });

    it('getUsersByCustomerId - should return users by customer id', async () => {
        const users = [{ id: 1, username: 'user1' }];
        customerService.getUsersByCustomerId.mockResolvedValue(users);
        const req = { params: { customer_id: 1 }, user: { role: 'admin' } };

        await customerController.getUsersByCustomerId(req, mockRes);
        expect(mockRes.json).toHaveBeenCalledWith(users);
    });

    it('removeUserFromCustomer - should remove user from customer', async () => {
        customerService.removeUserFromCustomer.mockResolvedValue(true);
        const req = { params: { customer_id: 1, user_id: 2 }, user: { role: 'admin' } };

        await customerController.removeUserFromCustomer(req, mockRes);
        expect(mockRes.json).toHaveBeenCalledWith(true);
    });
});