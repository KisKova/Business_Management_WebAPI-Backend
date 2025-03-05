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

        // ✅ Include user details in the response
        res.json({
            message: "Login successful",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Server error" });
    }
};


// Change Password
exports.changePassword = async (req, res) => {
    const { oldPassword, newPassword, userId } = req.body;
    const requestingUser = req.user; // Extracted from JWT token (middleware)

    try {
        // Ensure user exists
        const user = await userModel.getUserById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found!" });
        }

        // If the requester is NOT an admin, verify the old password
        if (requestingUser.role !== "admin") {
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
