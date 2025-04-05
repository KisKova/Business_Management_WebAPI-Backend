const BaseController = require('../../utils/BaseController');
const taskService = require('./taskModel');
const { checkAdmin } = require('../../utils/roleCheck')

const getAllTasks = (req, res) =>
    BaseController.handleRequest(res, () => taskService.getAllTasks());

const getTaskById = (req, res) =>
    BaseController.handleRequest(res, () => taskService.getTaskById(req.params.id));

const createTask = (req, res) =>
    BaseController.handleRequest(res, () =>
            taskService.createTask(req.body.name), {
            roleCheck: checkAdmin,
            req
        }
    );

const updateTask = (req, res) =>
    BaseController.handleRequest(res, () =>
            taskService.updateTask(req.params.id, req.body.name), {
            roleCheck: checkAdmin,
            req
        }
    );

const deleteTask = (req, res) =>
    BaseController.handleRequest(res, () =>
            taskService.deleteTask(req.params.id), {
            roleCheck: checkAdmin,
            req
        }
    );

module.exports = {
    getAllTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask
};
