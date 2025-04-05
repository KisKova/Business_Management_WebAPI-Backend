const BaseController = require('../../utils/BaseController');
const projectService = require('./projectModel');
const { checkAdmin } = require('../../utils/roleCheck')

const getAllProject = (req, res) =>
    BaseController.handleRequest(res, () => projectService.getAllProject());

const getProjectById = (req, res) =>
    BaseController.handleRequest(res, () => projectService.getProjectById(req.params.id));

const createProject = (req, res) =>
    BaseController.handleRequest(res, () =>
        projectService.createProject(req.body.name), {
            roleCheck: checkAdmin,
            req
        }
    );

const updateProject = (req, res) =>
    BaseController.handleRequest(res, () =>
        projectService.updateProject(req.params.id, req.body.name), {
            roleCheck: checkAdmin,
            req
        }
    );

const deleteProject = (req, res) =>
    BaseController.handleRequest(res, () =>
        projectService.deleteProject(req.params.id), {
            roleCheck: checkAdmin,
            req
        }
    );

module.exports = {
    getAllProject,
    getProjectById,
    createProject,
    updateProject,
    deleteProject
};
