const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userController = require('../../features/user/userController');
const userModel = require('../../features/user/userModel');
const { checkAdmin } = require('../../utils/roleCheck');

jest.mock('../../features/user/userModel');
jest.mock('../../utils/roleCheck', () => ({ checkAdmin: jest.fn() }));
jest.mock("bcryptjs");
jest.mock("jsonwebtoken");

describe('User Controller (Full Coverage)', () => {
    let mockRes;

    beforeEach(() => {
        mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // --- Login ---
    it('loginUser - should login with email', async () => {
        const user = { id: 1, username: 'test', email: 'test@e.com', role: 'user', is_active: true, password: 'hash' };
        userModel.getUserByEmail.mockResolvedValue(user);
        bcrypt.compare.mockResolvedValue(true);
        jwt.sign.mockReturnValue('token123');

        const req = { body: { identifier: 'test@e.com', password: 'secret' } };
        await userController.loginUser(req, mockRes);

        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            data: expect.objectContaining({ token: 'token123' })
        }));
    });

    it('loginUser - should login with username', async () => {
        const user = { id: 1, username: 'test', email: 'test@e.com', role: 'user', is_active: true, password: 'hash' };
        userModel.getUserByUsername.mockResolvedValue(user);
        bcrypt.compare.mockResolvedValue(true);
        jwt.sign.mockReturnValue('token456');

        const req = { body: { identifier: 'test', password: 'secret' } };
        await userController.loginUser(req, mockRes);

        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            data: expect.objectContaining({ token: 'token456' })
        }));
    });

    it('loginUser - fails if user not found', async () => {
        userModel.getUserByEmail.mockResolvedValue(null);

        const req = { body: { identifier: 'x@e.com', password: 'any' } };
        await userController.loginUser(req, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    it('loginUser - fails if inactive', async () => {
        userModel.getUserByEmail.mockResolvedValue({ is_active: false });

        const req = { body: { identifier: 'inactive@e.com', password: 'any' } };
        await userController.loginUser(req, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    it('loginUser - fails with wrong password', async () => {
        userModel.getUserByEmail.mockResolvedValue({ is_active: true, password: 'stored' });
        bcrypt.compare.mockResolvedValue(false);

        const req = { body: { identifier: 'email', password: 'wrong' } };
        await userController.loginUser(req, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    // --- Profile ---
    it('getProfileInfo - returns user', async () => {
        const user = { id: 1, username: 'u' };
        userModel.getUserById.mockResolvedValue(user);

        const req = { user: { userId: 1 } };
        await userController.getProfileInfo(req, mockRes);

        expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: user });
    });

    // --- Personal Data ---
    it('changePersonalData - updates email & username', async () => {
        const user = { id: 1, username: 'old', email: 'old@e.com' };
        userModel.getUserById.mockResolvedValue({ ...user });
        userModel.updateUserEmail.mockResolvedValue();
        userModel.updateUserName.mockResolvedValue();

        const req = { user: { userId: 1 }, body: { username: 'new', email: 'new@e.com' } };
        await userController.changePersonalData(req, mockRes);

        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            data: expect.objectContaining({ message: expect.stringContaining('Email updated') })
        }));
    });

    it('changePersonalData - returns empty message if nothing changed', async () => {
        const user = { id: 1, username: 'same', email: 'same@e.com' };
        userModel.getUserById.mockResolvedValue(user);

        const req = { user: { userId: 1 }, body: { username: 'same', email: 'same@e.com' } };
        await userController.changePersonalData(req, mockRes);

        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            data: expect.objectContaining({ message: '' })
        }));
    });

    it('changePersonalData - username conflict', async () => {
        userModel.getUserById.mockResolvedValue({ id: 1, username: 'old', email: 'old@e.com' });
        userModel.updateUserEmail.mockResolvedValue();
        userModel.updateUserName.mockImplementation(() => { throw new Error('Username already in use.') });

        const req = { user: { userId: 1 }, body: { username: 'conflict', email: 'new@e.com' } };
        await userController.changePersonalData(req, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    // --- Password ---
    it('changePassword - for user with old check', async () => {
        userModel.getUserById.mockResolvedValue({ password: 'hash', role: 'user' });
        bcrypt.compare.mockResolvedValue(true);
        bcrypt.hash.mockResolvedValue('newhash');
        userModel.updateUserPassword.mockResolvedValue();

        const req = { user: { userId: 1, role: 'user' }, body: { oldPassword: 'old', newPassword: 'new' } };
        await userController.changePassword(req, mockRes);

        expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: { message: 'Password updated successfully!' } });
    });

    it('changePassword - admin skips old password check', async () => {
        userModel.getUserById.mockResolvedValue({ password: 'irrelevant', role: 'admin' });
        bcrypt.hash.mockResolvedValue('newhash');
        userModel.updateUserPassword.mockResolvedValue();

        const req = { user: { userId: 1, role: 'admin' }, body: { oldPassword: 'any', newPassword: 'new' } };
        await userController.changePassword(req, mockRes);

        expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: { message: 'Password updated successfully!' } });
    });

    it('changePassword - fails if old password is incorrect', async () => {
        userModel.getUserById.mockResolvedValue({ password: 'stored', role: 'user' });
        bcrypt.compare.mockResolvedValue(false);

        const req = {
            user: { userId: 1, role: 'user' },
            body: { oldPassword: 'wrong', newPassword: 'newpass' }
        };

        await userController.changePassword(req, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith({
            success: false,
            message: 'Old password is incorrect!'
        });
    });

    // --- Get Users ---
    it('getAllUsers - returns users', async () => {
        const users = [{ id: 1, username: 'admin' }];
        userModel.getAllUsers.mockResolvedValue(users);
        checkAdmin.mockReturnValue({ allowed: true });

        const req = { user: { role: 'admin' } };
        await userController.getAllUsers(req, mockRes);

        expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: users });
    });

    // --- Create User ---
    it('createUser - successful', async () => {
        userModel.getUserByEmail.mockResolvedValue(null);
        userModel.getUserByUsername.mockResolvedValue(null);
        bcrypt.hash.mockResolvedValue('hash');
        userModel.createUser.mockResolvedValue({ id: 1, username: 'new' });
        checkAdmin.mockReturnValue({ allowed: true });

        const req = { user: { role: 'admin' }, body: { username: 'new', email: 'new@e.com', password: 'pass', role: 'user' } };
        await userController.createUser(req, mockRes);

        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true, data: expect.objectContaining({ message: 'User created successfully' })
        }));
    });

    it('createUser - email conflict', async () => {
        userModel.getUserByEmail.mockResolvedValue({ id: 1 });
        checkAdmin.mockReturnValue({ allowed: true });

        const req = { user: { role: 'admin' }, body: { username: 'new', email: 'taken@e.com', password: 'pass', role: 'user' } };
        await userController.createUser(req, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    it('createUser - username conflict', async () => {
        userModel.getUserByEmail.mockResolvedValue(null);
        userModel.getUserByUsername.mockResolvedValue({ id: 2 });
        checkAdmin.mockReturnValue({ allowed: true });

        const req = { user: { role: 'admin' }, body: { username: 'taken', email: 'new@e.com', password: 'pass', role: 'user' } };
        await userController.createUser(req, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    it('createUser - not admin', async () => {
        checkAdmin.mockReturnValue({ allowed: false, message: 'Forbidden' });

        const req = { user: { role: 'user' }, body: { username: 'x', email: 'x@e.com', password: 'pass', role: 'user' } };
        await userController.createUser(req, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(403);
    });

    // --- Update User ---
    it('updateUser - updates all fields', async () => {
        const user = { id: 1, username: 'old', email: 'old@e.com', role: 'user', is_active: true };
        userModel.getUserById.mockResolvedValueOnce(user);
        userModel.updateUserEmail.mockResolvedValue();
        userModel.updateUserName.mockResolvedValue();
        userModel.updateUserRole.mockResolvedValue();
        userModel.updateUserStatus.mockResolvedValue();
        userModel.getUserById.mockResolvedValueOnce({ ...user, username: 'new', email: 'new@e.com', role: 'admin', is_active: false });
        checkAdmin.mockReturnValue({ allowed: true });

        const req = { user: { role: 'admin' }, body: { id: 1, username: 'new', email: 'new@e.com', role: 'admin', is_active: false } };
        await userController.updateUser(req, mockRes);

        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            data: expect.objectContaining({
                message: expect.stringContaining('updated'),
                user: expect.objectContaining({ username: 'new' })
            })
        }));
    });

    it('updateUser - returns "Nothing has changed."', async () => {
        const user = { id: 1, username: 'same', email: 'same@e.com', role: 'user', is_active: true };
        userModel.getUserById.mockResolvedValue(user);
        checkAdmin.mockReturnValue({ allowed: true });

        const req = {
            user: { role: 'admin' },
            body: { id: 1, username: 'same', email: 'same@e.com', role: 'user', is_active: true }
        };
        await userController.updateUser(req, mockRes);

        expect(mockRes.json).toHaveBeenCalledWith({
            success: true,
            data: { message: 'Nothing has changed.' }
        });
    });

    it('updateUserPassword - updates password', async () => {
        bcrypt.hash.mockResolvedValue('hashed');
        userModel.updateUserPassword.mockResolvedValue();
        checkAdmin.mockReturnValue({ allowed: true });

        const req = { user: { role: 'admin' }, body: { id: 1, newPassword: 'new' } };
        await userController.updateUserPassword(req, mockRes);

        expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: { message: 'Password updated successfully!' } });
    });
});
