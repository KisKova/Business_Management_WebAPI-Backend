const express = require("express");
const authController = require("../controllers/authController");
const authMiddleware = require("../middlewares/authMiddleware");
const {getUserById} = require("../models/userModel");

const router = express.Router();

// Public routes
router.post("/register", authController.registerUser);
router.post("/login", authController.loginUser);

// Protected routes
router.get("/profile", authMiddleware.authenticateJWT, async (req, res) => {
    try {
        // Find the user by their ID from the token
        const user = await getUserById(req.user.id)

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json(user); // Send user data
    } catch (error) {
        console.error("Error fetching user profile:", error);
        res.status(500).json({ message: "Server error" });
    }
});

router.get("/admin", authMiddleware.authenticateJWT, authMiddleware.isAdmin, (req, res) => {
    res.json({ message: "Welcome Admin", user: req.user });
});

// Route to change password (Authenticated users only)
router.put("/change-password", authMiddleware.authenticateJWT, authController.changePassword);
router.put("/change-personal-data", authMiddleware.authenticateJWT, authController.changePersonalData)

router.get("/users",authMiddleware.authenticateJWT, authController.getAllUsers);
router.post("/create-user", authMiddleware.authenticateJWT, authController.createUser)

// ✅ Update User Info (Admin Only)
router.put("/users/:id", authMiddleware.authenticateJWT, authController.updateUser);

// ✅ Update User Password (Admin Only)
router.put("/users/:id/password", authMiddleware.authenticateJWT, authController.updateUserPassword);

module.exports = router;
