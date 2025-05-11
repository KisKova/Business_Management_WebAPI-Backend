const taskModel = require('../../features/task/taskModel');
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

describe('taskModel unit tests (mocked pg)', () => {
    beforeEach(() => {
        __mockQuery.mockReset();
    });

    it('getAllTasks should return all tasks', async () => {
        const tasks = [{ id: 1, name: 'Task A' }];
        __mockQuery.mockResolvedValue({ rows: tasks });
        const result = await taskModel.getAllTasks();
        expect(__mockQuery).toHaveBeenCalledWith('SELECT * FROM tasks ORDER BY id ASC');
        expect(result).toEqual(tasks);
    });

    it('getTaskById should return one task', async () => {
        const task = { id: 2, name: 'Task B' };
        __mockQuery.mockResolvedValue({ rows: [task] });
        const result = await taskModel.getTaskById(2);
        expect(__mockQuery).toHaveBeenCalledWith('SELECT * FROM tasks WHERE id = $1', [2]);
        expect(result).toEqual(task);
    });

    it('createTask should insert task and return it', async () => {
        __mockQuery.mockResolvedValueOnce({ rows: [] }); // No conflict
        const newTask = { id: 3, name: 'New Task' };
        __mockQuery.mockResolvedValueOnce({ rows: [newTask] });
        const result = await taskModel.createTask('New Task');
        expect(result).toEqual(newTask);
    });

    it('createTask should throw if name exists', async () => {
        __mockQuery.mockResolvedValueOnce({ rows: [{ id: 4 }] });
        await expect(taskModel.createTask('Duplicate')).rejects.toThrow('Task with this name already exists.');
    });

    it('updateTask should update and return task', async () => {
        __mockQuery.mockResolvedValueOnce({ rows: [] }); // No conflict
        const updatedTask = { id: 5, name: 'Updated Task' };
        __mockQuery.mockResolvedValueOnce({ rows: [updatedTask] });
        const result = await taskModel.updateTask(5, 'Updated Task');
        expect(result).toEqual(updatedTask);
    });

    it('updateTask should throw if name exists', async () => {
        __mockQuery.mockResolvedValueOnce({ rows: [{ id: 6 }] });
        await expect(taskModel.updateTask(6, 'Existing')).rejects.toThrow('Task with this name already exists.');
    });

    it('deleteTask should delete if no time_tracking reference exists', async () => {
        __mockQuery.mockResolvedValueOnce({ rows: [] });
        __mockQuery.mockResolvedValueOnce({ rowCount: 1 });
        await expect(taskModel.deleteTask(7)).resolves.toBeUndefined();
    });

    it('deleteTask should throw if task is tracked', async () => {
        __mockQuery.mockResolvedValueOnce({ rows: [{ id: 8 }] });
        await expect(taskModel.deleteTask(8)).rejects.toThrow('Task cannot be deleted, it is assigned to a tracked time.');
    });
});
