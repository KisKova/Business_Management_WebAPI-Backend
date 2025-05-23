const BaseController = require('../../utils/BaseController');
const timeTrackingModel = require('./timeTrackingModel');
const {checkAdmin} = require("../../utils/roleCheck");

const startTracking = (req, res) =>
    BaseController.handleRequest(res, async () => {
        const activeTracking = await timeTrackingModel.getActiveTracking(req.user.userId);
        if (activeTracking) {
            throw new Error('You already have an active tracking session.');
        }
        return await timeTrackingModel.startTimeTracking(req.user.userId, req.body.note);
    }, { req });

const stopTracking = (req, res) =>
    BaseController.handleRequest(res, async () => {
        const { id, project_id, task_id, customer_id } = req.body;
        const user_id = req.user.userId;

        const activeTracking = await timeTrackingModel.getActiveTracking(user_id);
        if (!activeTracking || activeTracking.id !== id) {
            throw new Error('No active tracking session found or invalid session ID.');
        }

        // Convert customer_id to number to match the assignedCustomers data type
        const numericCustomerId = Number(customer_id);

        const assignedCustomers = await timeTrackingModel.getAssignedCustomers(user_id);

        // Ensure selected customer exists in assigned customers list
        const customerExists = assignedCustomers.some(customer => Number(customer.id) === numericCustomerId);

        if (!customerExists) {
            throw new Error("Selected customer is not assigned to this user.");
        }
        return timeTrackingModel.stopTimeTracking(id, user_id, project_id, task_id, customer_id);
    }, { req });

const deleteTracking = (req, res) =>
    BaseController.handleRequest(res, () => {
        const trackingId = req.params.id;
        const userId = req.user.userId;
        const isAdmin = req.user.role === 'admin';

        return timeTrackingModel.deleteTracking(trackingId, userId, isAdmin);
    }, { req });

const getActiveTracking = (req, res) =>
    BaseController.handleRequest(res, () => {
        const userId = req.user.userId;
        const isAdmin = req.user.role === 'admin';

        return timeTrackingModel.getActiveTracking(userId, isAdmin);
    }, { req });

const getAllActiveTracking = (req, res) =>
    BaseController.handleRequest(res, () => {
        const userId = req.user.userId;
        const isAdmin = req.user.role === 'admin';

        return timeTrackingModel.getAllActiveTracking(userId, isAdmin);
    }, { req });

const getUserTimeEntries = (req, res) =>
    BaseController.handleRequest(res, async () => {
        const user_id = req.user.userId;
        return await timeTrackingModel.getUserTimeEntries(user_id);
    }, { req });

const getAssignedCustomers = (req, res) =>
    BaseController.handleRequest(res, async () => {
        const user_id = req.user.userId;
        return await timeTrackingModel.getAssignedCustomers(user_id);
    }, { req });

const getAllTimeTracking = (req, res) =>
    BaseController.handleRequest(res, async () => {
        const userId = req.user.userId;
        const isAdmin = req.user.role === 'admin';

        return await timeTrackingModel.getAllTimeTracking(userId, isAdmin);
    }, { req });

const addManualTracking = (req, res) =>
    BaseController.handleRequest(res, async () => {
        const {
            customer_id,
            project_id,
            task_id,
            start_time,
            duration_hours,
            duration_minutes,
            note
        } = req.body;

        const userId = req.user.userId;

        if (customer_id == null || project_id == null || task_id == null || start_time == null || duration_hours == null || duration_minutes == null) {
            throw new Error('All fields are required.');
        }

        const start = new Date(start_time);
        const end = new Date(start);
        end.setHours(end.getHours() + parseInt(duration_hours));
        end.setMinutes(end.getMinutes() + parseInt(duration_minutes));
        const end_time = end.toISOString();

        return await timeTrackingModel.addManualTracking(
            userId,
            customer_id,
            project_id,
            task_id,
            start.toISOString(),
            end_time,
            duration_hours,
            duration_minutes,
            note
        );
    }, { req });

const updateTracking = (req, res) =>
    BaseController.handleRequest(res, async () => {
        const trackingId = req.params.id;
        const userId = req.user.userId;
        const isAdmin = req.user.role === 'admin';

        const {
            start_time,
            duration_hours,
            duration_minutes,
            customer_id,
            project_id,
            task_id,
            note
        } = req.body;

        if (!start_time || !duration_minutes || !customer_id || !project_id || !task_id) {
            throw new Error('Missing required fields.');
        }

        return await timeTrackingModel.updateTracking(
            trackingId,
            userId,
            isAdmin,
            start_time,
            duration_hours,
            duration_minutes,
            customer_id,
            project_id,
            task_id,
            note
        );
    }, { req });

const getCustomerMonthlySummary = (req, res) =>
    BaseController.handleRequest(res, async () => {
        const customerId = req.params.id;
        return await timeTrackingModel.getMonthlyTrackingSummaryForCustomer(customerId);
    }, { roleCheck: checkAdmin, req });

module.exports = {
    startTracking,
    stopTracking,
    deleteTracking,
    getActiveTracking,
    getAllActiveTracking,
    getUserTimeEntries,
    getAssignedCustomers,
    getAllTimeTracking,
    addManualTracking,
    updateTracking,
    getCustomerMonthlySummary
};
