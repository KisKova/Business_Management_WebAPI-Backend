const projectModel = require('../../features/project/projectModel');
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

describe('projectModel unit tests (mocked pg)', () => {
    beforeEach(() => {
        __mockQuery.mockReset();
    });

    it('getAllProject should return all projects', async () => {
        const projects = [{ id: 1, name: 'Project A' }];
        __mockQuery.mockResolvedValue({ rows: projects });
        const result = await projectModel.getAllProject();
        expect(__mockQuery).toHaveBeenCalledWith('SELECT * FROM projects ORDER BY id ASC');
        expect(result).toEqual(projects);
    });

    it('getProjectById should return one project', async () => {
        const project = { id: 2, name: 'Project B' };
        __mockQuery.mockResolvedValue({ rows: [project] });
        const result = await projectModel.getProjectById(2);
        expect(__mockQuery).toHaveBeenCalledWith('SELECT * FROM projects WHERE id = $1', [2]);
        expect(result).toEqual(project);
    });

    it('createProject should insert and return new project', async () => {
        __mockQuery.mockResolvedValueOnce({ rows: [] });
        const newProject = { id: 3, name: 'New Project' };
        __mockQuery.mockResolvedValueOnce({ rows: [newProject] });
        const result = await projectModel.createProject('New Project');
        expect(result).toEqual(newProject);
    });

    it('createProject should throw if name exists', async () => {
        __mockQuery.mockResolvedValueOnce({ rows: [{ id: 4 }] });
        await expect(projectModel.createProject('Duplicate')).rejects.toThrow('Project with this name already exists.');
    });

    it('updateProject should update and return project', async () => {
        __mockQuery.mockResolvedValueOnce({ rows: [] });
        const updatedProject = { id: 5, name: 'Updated Project' };
        __mockQuery.mockResolvedValueOnce({ rows: [updatedProject] });
        const result = await projectModel.updateProject(5, 'Updated Project');
        expect(result).toEqual(updatedProject);
    });

    it('updateProject should throw if name exists', async () => {
        __mockQuery.mockResolvedValueOnce({ rows: [{ id: 6 }] });
        await expect(projectModel.updateProject(6, 'Existing')).rejects.toThrow('Project with this name already exists.');
    });

    it('deleteProject should delete if no time_tracking reference exists', async () => {
        __mockQuery.mockResolvedValueOnce({ rows: [] });
        __mockQuery.mockResolvedValueOnce({ rowCount: 1 });
        await expect(projectModel.deleteProject(7)).resolves.toBeUndefined();
    });

    it('deleteProject should throw if project is tracked', async () => {
        __mockQuery.mockResolvedValueOnce({ rows: [{ id: 8 }] });
        await expect(projectModel.deleteProject(8)).rejects.toThrow('Project cannot be deleted, it is assigned to a tracked time.');
    });
});
