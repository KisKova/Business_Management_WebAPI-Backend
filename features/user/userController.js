const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userModel = require("./userModel");
const BaseController = require("../../utils/BaseController");
const {checkAdmin} = require("../../utils/roleCheck");

const loginUser = (req, res) =>
    BaseController.handleRequest(res, async () => {
        const { identifier, password } = req.body;
        let user = identifier.includes("@") ? await userModel.getUserByEmail(identifier) : await userModel.getUserByUsername(identifier);

        if (!user) throw new Error("Invalid credentials");
        if (!user.is_active) throw new Error("Your account has been deactivated. Contact admin.");

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) throw new Error("Invalid credentials");

        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });

        return {
            message: "Login successful",
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        };
    }, { req });

const getProfileInfo = (req, res) =>
    BaseController.handleRequest(res, async () => {
        return await userModel.getUserById(req.user.userId);
    }, { req });

const changePersonalData = (req, res) =>
    BaseController.handleRequest(res, async () => {
        const { email, username } = req.body;
        const userId = req.user.userId;

        const user = await userModel.getUserById(userId);
        if (!user) throw new Error("User not found!");

        const updatedFields = [];

        if (user.email !== email) {
            await userModel.updateUserEmail(userId, email);
            user.email = email; // keep response in sync
            updatedFields.push("Email updated successfully!");
        }

        if (user.username !== username) {
            await userModel.updateUserName(userId, username);
            user.username = username;
            updatedFields.push("Username updated successfully!");
        }

        return {
            message: updatedFields.join(" "),
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        };
    }, { req });

const changePassword = (req, res) =>
    BaseController.handleRequest(res, async () => {
        const { oldPassword, newPassword } = req.body;
        const userId = req.user.userId;
        const userRole = req.user.role;
        const user = await userModel.getUserById(userId);
        if (!user) throw new Error("User not found!");

        if (userRole !== "admin") {
            const isMatch = await bcrypt.compare(oldPassword, user.password);
            if (!isMatch) throw new Error("Old password is incorrect!");
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await userModel.updateUserPassword(userId, hashedPassword);

        return { message: "Password updated successfully!" };
    }, { req });

const getAllUsers = (req, res) =>
    BaseController.handleRequest(res, async () => {
        return await userModel.getAllUsers();
    }, { roleCheck: checkAdmin, req });

const createUser = (req, res) =>
    BaseController.handleRequest(res, async () => {
        const { username, email, password, role } = req.body;

        const existingUserEmail = await userModel.getUserByEmail(email);
        if (existingUserEmail) {
            throw new Error("Email already in use.");
        }

        const existingUserName = await userModel.getUserByUsername(username);
        if (existingUserName) {
            throw new Error("Username already in use.");
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await userModel.createUser(username, email, hashedPassword, role);
        return { message: "User created successfully", newUser };
    }, { roleCheck: checkAdmin, req });

const updateUser = (req, res) =>
    BaseController.handleRequest(res, async () => {
        const { id, email, username, role, is_active } = req.body;

        const user = await userModel.getUserById(id);
        if (!user) throw new Error("User not found!");

        let updatedFields = [];
        if (user.email !== email) {
            await userModel.updateUserEmail(id, email);
            updatedFields.push("Email updated successfully!");
        }
        if (user.role !== role) {
            await userModel.updateUserRole(id, role);
            updatedFields.push("Role updated successfully!");
        }
        if (user.username !== username) {
            await userModel.updateUserName(id, username);
            updatedFields.push("Username updated successfully!");
        }
        if (user.is_active !== is_active) {
            await userModel.updateUserStatus(id, is_active);
            updatedFields.push("Status updated successfully!");
        }

        if (updatedFields.length === 0) return { message: "Nothing has changed." };

        const updatedUser = await userModel.getUserById(id);
        return {
            message: updatedFields.join(" "),
            user: {
                id: updatedUser.id,
                username: updatedUser.username,
                email: updatedUser.email,
                role: updatedUser.role
            }
        };
    }, { roleCheck: checkAdmin, req });

const updateUserPassword = (req, res) =>
    BaseController.handleRequest(res, async () => {
        const { id, newPassword } = req.body;

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await userModel.updateUserPassword(id, hashedPassword);
        return { message: "Password updated successfully!" };
    }, { roleCheck: checkAdmin, req });

module.exports = {
    loginUser,
    getProfileInfo,
    changePersonalData,
    changePassword,
    getAllUsers,
    createUser,
    updateUser,
    updateUserPassword
};