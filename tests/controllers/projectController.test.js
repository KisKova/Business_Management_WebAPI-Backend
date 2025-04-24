
const projectController = require('../../features/project/projectController');
const projectService = require('../../features/project/projectModel');
const BaseController = require('../../utils/BaseController');
const { checkAdmin } = require('../../utils/roleCheck');

jest.mock('../../features/project/projectModel');
jest.mock('../../utils/roleCheck', () => ({ checkAdmin: jest.fn() }));

describe('Project Controller (full coverage)', () => {
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

    it('getAllProject - should return all projects', async () => {
        const projects = [{ id: 1, name: 'Alpha' }];
        projectService.getAllProject.mockResolvedValue(projects);
        await projectController.getAllProject({}, mockRes);
        expect(mockRes.json).toHaveBeenCalledWith(projects);
    });

    it('getProjectById - should return project by id', async () => {
        const project = { id: 1, name: 'Beta' };
        projectService.getProjectById.mockResolvedValue(project);
        const req = { params: { id: 1 } };
        await projectController.getProjectById(req, mockRes);
        expect(mockRes.json).toHaveBeenCalledWith(project);
    });

    it('createProject - should create a project', async () => {
        const project = { id: 2, name: 'Gamma' };
        projectService.createProject.mockResolvedValue(project);
        const req = { body: { name: 'Gamma' }, user: { role: 'admin' } };
        await projectController.createProject(req, mockRes);
        expect(mockRes.json).toHaveBeenCalledWith(project);
    });

    it('updateProject - should update a project', async () => {
        const updated = { id: 2, name: 'Updated Project' };
        projectService.updateProject.mockResolvedValue(updated);
        const req = { params: { id: 2 }, body: { name: 'Updated Project' }, user: { role: 'admin' } };
        await projectController.updateProject(req, mockRes);
        expect(mockRes.json).toHaveBeenCalledWith(updated);
    });

    it('deleteProject - should delete a project', async () => {
        projectService.deleteProject.mockResolvedValue(true);
        const req = { params: { id: 3 }, user: { role: 'admin' } };
        await projectController.deleteProject(req, mockRes);
        expect(mockRes.json).toHaveBeenCalledWith(true);
    });
});