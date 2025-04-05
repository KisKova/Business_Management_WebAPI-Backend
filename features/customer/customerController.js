const BaseController = require('../../utils/BaseController');
const customerService = require('./customerModel');
const { checkAdmin } = require('../../utils/roleCheck')

const getAllCustomer = (req, res) =>
    BaseController.handleRequest(res, async () =>
            await customerService.getAllCustomer(), {
            roleCheck: checkAdmin,
            req
        }
    );

const getCustomerById = (req, res) =>
    BaseController.handleRequest(res, async () =>
            await customerService.getCustomerById(req.params.id), {
            roleCheck: checkAdmin,
            req
        }
    );

const createCustomer = (req, res) =>
    BaseController.handleRequest(res, async () =>
        await customerService.createCustomer(req.body), {
            roleCheck: checkAdmin,
            req
        }
    );

const updateCustomer = (req, res) =>
    BaseController.handleRequest(res, async () =>
        await customerService.updateCustomer(req.params.id, req.body), {
            roleCheck: checkAdmin,
            req
        }
    );

const assignUserToCustomer = (req, res) =>
    BaseController.handleRequest(res, async () =>
        await customerService.assignUserToCustomer(req.params.customer_id, req.body.user_id), {
            roleCheck: checkAdmin,
            req
        }
    );

const getUsersByCustomerId = (req, res) =>
    BaseController.handleRequest(res, async () =>
            await customerService.getUsersByCustomerId(req.params.customer_id), {
            roleCheck: checkAdmin,
            req
        }
    );

const removeUserFromCustomer = (req, res) =>
    BaseController.handleRequest(res, async () =>
            await customerService.removeUserFromCustomer(req.params.customer_id, req.params.user_id), {
            roleCheck: checkAdmin,
            req
        }
    );

module.exports = {
    getAllCustomer,
    getCustomerById,
    createCustomer,
    updateCustomer,
    assignUserToCustomer,
    getUsersByCustomerId,
    removeUserFromCustomer
};
