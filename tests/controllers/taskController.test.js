
const taskController = require('../../features/task/taskController');
const taskService = require('../../features/task/taskModel');
const BaseController = require('../../utils/BaseController');
const { checkAdmin } = require('../../utils/roleCheck');

jest.mock('../../features/task/taskModel');
jest.mock('../../utils/roleCheck', () => ({ checkAdmin: jest.fn() }));

describe('Task Controller (full coverage)', () => {
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

    it('getAllTasks - should return all tasks', async () => {
        const tasks = [{ id: 1, name: 'Design' }];
        taskService.getAllTasks.mockResolvedValue(tasks);
        await taskController.getAllTasks({}, mockRes);
        expect(mockRes.json).toHaveBeenCalledWith(tasks);
    });

    it('getTaskById - should return task by id', async () => {
        const task = { id: 1, name: 'Fix Bug' };
        taskService.getTaskById.mockResolvedValue(task);
        const req = { params: { id: 1 } };
        await taskController.getTaskById(req, mockRes);
        expect(mockRes.json).toHaveBeenCalledWith(task);
    });

    it('createTask - should create a task', async () => {
        const task = { id: 2, name: 'Code Review' };
        taskService.createTask.mockResolvedValue(task);
        const req = { body: { name: 'Code Review' }, user: { role: 'admin' } };
        await taskController.createTask(req, mockRes);
        expect(mockRes.json).toHaveBeenCalledWith(task);
    });

    it('updateTask - should update a task', async () => {
        const updatedTask = { id: 1, name: 'Updated Task' };
        taskService.updateTask.mockResolvedValue(updatedTask);
        const req = { params: { id: 1 }, body: { name: 'Updated Task' }, user: { role: 'admin' } };
        await taskController.updateTask(req, mockRes);
        expect(mockRes.json).toHaveBeenCalledWith(updatedTask);
    });

    it('deleteTask - should delete a task', async () => {
        taskService.deleteTask.mockResolvedValue(true);
        const req = { params: { id: 3 }, user: { role: 'admin' } };
        await taskController.deleteTask(req, mockRes);
        expect(mockRes.json).toHaveBeenCalledWith(true);
    });
});