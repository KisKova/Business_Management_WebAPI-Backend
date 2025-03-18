const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel");

// Register User
exports.registerUser = async (req, res) => {
    const { username, email, password, role } = req.body;

    // Check if the username, email, and password are provided
    if (!username || !email || !password || !role) {
        return res.status(400).json({ message: "All fields are required!" });
    }

    // Validate email domain
    if (!email.endsWith("@ppcmedia.hu")) {
        return res.status(400).json({ message: "Only @ppcmedia.hu emails are allowed!" });
    }

    // Validate role
    if (role !== "user" && role !== "admin") {
        return res.status(400).json({ message: "Invalid role!" });
    }

    try {
        // Check if the email already exists
        const existingUserByEmail = await userModel.getUserByEmail(email);
        if (existingUserByEmail) {
            return res.status(400).json({ message: "Email already in use!" });
        }

        // Check if the username already exists
        const existingUserByUsername = await userModel.getUserByUsername(username);
        if (existingUserByUsername) {
            return res.status(400).json({ message: "Username already in use!" });
        }

        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create the user in the database
        const user = await userModel.createUser(username, email, hashedPassword, role);

        // Return a success response with user details
        res.status(201).json({
            message: "User registered successfully!",
            userId: user.id,
            username: user.username,
            email: user.email,
            role: user.role
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Login User
exports.loginUser = async (req, res) => {
    const { identifier, password } = req.body;

    try {
        let user;
        if (identifier.includes("@")) {
            user = await userModel.getUserByEmail(identifier);
        } else {
            user = await userModel.getUserByUsername(identifier);
        }

        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        if (!user.is_active) {
            return res.status(403).json({ message: "Your account has been deactivated. Contact admin." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Generate JWT Token
        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        // Include user details in response
        res.json({
            message: "Login successful",
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Change Personal Data
exports.changePersonalData = async (req, res) => {
    const { email, username } = req.body;
    const userId = req.user.userId; // Extract userId from JWT token
    console.log("Changing personal data for user: " + userId + ", name: " + username + ", email: " + email);

    try {
        // Ensure user exists
        const user = await userModel.getUserById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found!" });
        }

        let updatedFields = [];

        // Update email if changed
        if (user.email !== email) {
            await userModel.updateUserEmail(userId, email);
            updatedFields.push("Email updated successfully!");
        }
        if (user.username !== username) {
            console.log("This is the new name: " + username);
            await userModel.updateUserName(userId, username);
            updatedFields.push("Username updated successfully!");
        }

        // Return success response with updated fields
        res.json({
            message: updatedFields.join(" "),
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            } });

    } catch (err) {
        console.error("Error updating user data:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// Change Password
exports.changePassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.userId; // Extracted from JWT token (middleware)
    const userRole = req.user.role;

    console.log("Changing password for user: " + userId + ", role: " + userRole + ", new pass: " + newPassword);

    try {
        // Ensure user exists
        const user = await userModel.getUserById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found!" });
        }

        // If the requester is NOT an admin, verify the old password
        if (userRole !== "admin") {
            const isMatch = await bcrypt.compare(oldPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({ message: "Old password is incorrect!" });
            }
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password in DB
        await userModel.updateUserPassword(userId, hashedPassword);

        res.json({ message: "Password updated successfully!" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Getting all users for the user list (Admin Only)
exports.getAllUsers = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Access denied" });
        }

        const users = await userModel.getAllUsers();
        res.json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Create New User (Admin Only)
exports.createUser = async (req, res) => {
    const { username, email, password, role } = req.body;
    console.log(req.body);
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Access denied" });
        }

        console.log(username + " email: " + email + " pass: " + password + " role " + role);

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await userModel.createUser(username, email, hashedPassword, role);

        res.status(201).json({ message: "User created successfully", newUser });
    } catch (error) {
        console.error("Error creating user:", error);
        res.status(500).json({ message: error.message || "Server error" });
    }
};

// Update User data (Admin Only)
exports.updateUser = async (req, res) => {
    const { id, email, username, role, is_active } = req.body;
    const userId = req.user.userId; // Extract userId from JWT token

    console.log("AdminId:" + userId + " [ Name: " + username + " email: " + email + " role " + role + " is_active: " + is_active + " ]");

    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Access denied" });
        }

        // Ensure user exists
        const user = await userModel.getUserById(id);
        if (!user) {
            return res.status(404).json({ message: "User not found!" });
        }

        let updatedFields = [];

        // Update email if changed
        if (user.email !== email) {
            await userModel.updateUserEmail(id, email);
            updatedFields.push("Email updated successfully!");
        }

        // Update role if changed
        if (user.role !== role) {
            await userModel.updateUserRole(id, role);
            updatedFields.push("Role updated successfully!");
        }

        // Update username if changed
        if (user.username !== username) {
            console.log("This is the new name: " + username);
            await userModel.updateUserName(id, username);
            updatedFields.push("Username updated successfully!");
        }

        if (user.is_active !== is_active) {
            await userModel.updateUserStatus(id, is_active);
            updatedFields.push("Status updated successfully!");
        }

        if (updatedFields.length === 0) {
            return res.json({ message: "Nothing has changed." });
        }

        // Fetch updated user data after applying changes
        const updatedUser = await userModel.getUserById(id);

        // Return success response with updated fields
        res.json({
            message: updatedFields.join(" "),
            user: {
                id: updatedUser.id,
                username: updatedUser.username,
                email: updatedUser.email,
                role: updatedUser.role
            }
        });

    } catch (err) {
        console.error("Error updating user data:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// Change User password (Admin Only)
exports.updateUserPassword = async (req, res) => {
    const { id, newPassword } = req.body;
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Access denied" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await userModel.updateUserPassword(id, hashedPassword);

        res.json({ message: "Password updated successfully!" });
    } catch (error) {
        console.error("Error updating password:", error);
        res.status(500).json({ message: "Server error" });
    }
};

