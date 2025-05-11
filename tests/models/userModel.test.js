const userModel = require('../../features/user/userModel');
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

describe('userModel unit tests (mocked pg)', () => {
    beforeEach(() => {
        __mockQuery.mockReset();
    });

    it('getUserByEmail should return a user row', async () => {
        __mockQuery.mockResolvedValue({ rows: [{ id: 1, email: 'test@ppcmedia.hu' }] });

        const user = await userModel.getUserByEmail('test@ppcmedia.hu');
        expect(__mockQuery).toHaveBeenCalledWith('SELECT * FROM users WHERE email = $1', ['test@ppcmedia.hu']);
        expect(user).toEqual({ id: 1, email: 'test@ppcmedia.hu' });
    });

    it('createUser should insert and return the new user', async () => {
        const resultRow = { id: 2, username: 'tester', email: 'tester@ppcmedia.hu', role: 'user' };
        __mockQuery.mockResolvedValue({ rows: [resultRow] });

        const newUser = await userModel.createUser('tester', 'tester@ppcmedia.hu', 'hashedpass', 'user');
        expect(__mockQuery).toHaveBeenCalled();
        expect(newUser).toEqual(resultRow);
    });

    it('createUser should throw if DB fails', async () => {
        __mockQuery.mockImplementation(() => { throw new Error('DB error') });
        await expect(
            userModel.createUser('fail', 'fail@ppcmedia.hu', 'secret', 'user')
        ).rejects.toThrow('DB error');
    });

    it('updateUserEmail should throw if email already exists', async () => {
        __mockQuery.mockResolvedValueOnce({ rows: [{ id: 3 }] });
        await expect(userModel.updateUserEmail(1, 'duplicate@ppcmedia.hu')).rejects.toThrow('Email already in use.');
    });

    it('updateUserEmail should update if no conflict', async () => {
        __mockQuery.mockResolvedValueOnce({ rows: [] });
        __mockQuery.mockResolvedValueOnce({ rowCount: 1 });
        await expect(userModel.updateUserEmail(1, 'new@ppcmedia.hu')).resolves.toBeUndefined();
    });

    it('updateUserName should throw if username already exists', async () => {
        __mockQuery.mockResolvedValueOnce({ rows: [{ id: 4 }] });
        await expect(userModel.updateUserName(1, 'takenname')).rejects.toThrow('Username already in use.');
    });

    it('updateUserName should update if no conflict', async () => {
        __mockQuery.mockResolvedValueOnce({ rows: [] });
        __mockQuery.mockResolvedValueOnce({ rowCount: 1 });
        await expect(userModel.updateUserName(1, 'newname')).resolves.toBeUndefined();
    });

    it('updateUserRole should update the user role', async () => {
        __mockQuery.mockResolvedValue({ rowCount: 1 });
        await userModel.updateUserRole(1, 'admin');
        expect(__mockQuery).toHaveBeenCalledWith('UPDATE users SET role = $1 WHERE id = $2', ['admin', 1]);
    });

    it('updateUserStatus should update is_active', async () => {
        __mockQuery.mockResolvedValue({ rowCount: 1 });
        await userModel.updateUserStatus(1, true);
        expect(__mockQuery).toHaveBeenCalledWith('UPDATE users SET is_active = $1 WHERE id = $2', [true, 1]);
    });

    it('getAllUsers should return all users without passwords', async () => {
        const users = [
            { id: 1, username: 'a', email: 'a@ppcmedia.hu', role: 'user' },
            { id: 2, username: 'b', email: 'b@ppcmedia.hu', role: 'admin' }
        ];
        __mockQuery.mockResolvedValue({ rows: users });

        const result = await userModel.getAllUsers();
        expect(__mockQuery).toHaveBeenCalled();
        expect(result).toEqual(users);
    });
});
