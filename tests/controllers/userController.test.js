
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userController = require('../../features/user/userController');
const userModel = require('../../features/user/userModel');
const BaseController = require('../../utils/BaseController');
const { checkAdmin } = require('../../utils/roleCheck');

jest.mock('../../features/user/userModel');
jest.mock('../../utils/roleCheck', () => ({ checkAdmin: jest.fn() }));
jest.mock("bcryptjs");
jest.mock("jsonwebtoken");

describe('User Controller (full coverage)', () => {
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

    it('loginUser - should login with valid credentials', async () => {
        const user = { id: 1, username: 'test', email: 'test@ppcmedia.hu', role: 'user', is_active: true, password: 'hash' };
        userModel.getUserByEmail.mockResolvedValue(user);
        bcrypt.compare.mockResolvedValue(true);
        jwt.sign.mockReturnValue('token123');

        const req = { body: { identifier: 'test@ppcmedia.hu', password: 'secret' }, user: {} };
        await userController.loginUser(req, mockRes);

        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Login successful', token: 'token123' }));
    });

    it('getProfileInfo - should return user profile info', async () => {
        const user = { id: 1, username: 'test', email: 'test@example.com' };
        userModel.getUserById.mockResolvedValue(user);

        const req = { user: { userId: 1 } };
        await userController.getProfileInfo(req, mockRes);

        expect(mockRes.json).toHaveBeenCalledWith(user);
    });

    it('changePersonalData - should update email and username', async () => {
        const user = { id: 1, username: 'old', email: 'old@example.com', role: 'user' };
        userModel.getUserById.mockResolvedValue({ ...user });
        userModel.updateUserEmail.mockResolvedValue();
        userModel.updateUserName.mockResolvedValue();

        const req = { user: { userId: 1 }, body: { username: 'new', email: 'new@example.com' } };
        await userController.changePersonalData(req, mockRes);

        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('Email updated') }));
    });

    it('changePassword - should change password if old is valid', async () => {
        const user = { id: 1, password: 'hashed', role: 'user' };
        userModel.getUserById.mockResolvedValue(user);
        bcrypt.compare.mockResolvedValue(true);
        bcrypt.hash.mockResolvedValue('newhashed');
        userModel.updateUserPassword.mockResolvedValue();

        const req = { user: { userId: 1, role: 'user' }, body: { oldPassword: 'old', newPassword: 'new' } };
        await userController.changePassword(req, mockRes);

        expect(mockRes.json).toHaveBeenCalledWith({ message: 'Password updated successfully!' });
    });

    it('getAllUsers - should return all users', async () => {
        const users = [{ id: 1, username: 'admin' }];
        userModel.getAllUsers.mockResolvedValue(users);

        const req = { user: { role: 'admin' } };
        await userController.getAllUsers(req, mockRes);

        expect(mockRes.json).toHaveBeenCalledWith(users);
    });

    it('createUser - should create user if email and username not taken', async () => {
        userModel.getUserByEmail.mockResolvedValue(null);
        userModel.getUserByUsername.mockResolvedValue(null);
        bcrypt.hash.mockResolvedValue('hashed');
        userModel.createUser.mockResolvedValue({ id: 1, username: 'new' });

        const req = {
            body: { username: 'new', email: 'new@ppcmedia.hu', password: 'pass', role: 'user' },
            user: { role: 'admin' }
        };
        await userController.createUser(req, mockRes);

        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'User created successfully' }));
    });

    it('updateUser - should update user fields', async () => {
        const user = { id: 1, username: 'old', email: 'old@e.com', role: 'user', is_active: true };
        userModel.getUserById.mockResolvedValue(user);
        userModel.updateUserEmail.mockResolvedValue();
        userModel.updateUserName.mockResolvedValue();
        userModel.updateUserRole.mockResolvedValue();
        userModel.updateUserStatus.mockResolvedValue();
        userModel.getUserById.mockResolvedValue({ id: 1, username: 'new', email: 'new@e.com', role: 'admin' });

        const req = {
            body: { id: 1, username: 'new', email: 'new@e.com', role: 'admin', is_active: false },
            user: { role: 'admin' }
        };

        await userController.updateUser(req, mockRes);

        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
            message: expect.stringContaining('updated'),
            user: expect.objectContaining({ username: 'new' })
        }));
    });

    it('updateUserPassword - should hash and update password', async () => {
        bcrypt.hash.mockResolvedValue('hashedpw');
        userModel.updateUserPassword.mockResolvedValue();

        const req = { body: { id: 1, newPassword: 'newpass' }, user: { role: 'admin' } };
        await userController.updateUserPassword(req, mockRes);

        expect(mockRes.json).toHaveBeenCalledWith({ message: 'Password updated successfully!' });
    });
});