const express = require("express");
const authController = require("../features/user/userController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

// Login
router.post("/login", authController.loginUser);

// Profile
//router.get("/profile", authMiddleware.authenticateJWT, authController.getProfileInfo);

router.get("/admin", authMiddleware.authenticateJWT, authMiddleware.isAdmin, (req, res) => {
    res.json({ message: "Welcome Admin", user: req.user });
});

// Change password
router.put("/change-password", authMiddleware.authenticateJWT, authController.changePassword);
// Change personal data
router.put("/change-personal-data", authMiddleware.authenticateJWT, authController.changePersonalData)

// Get all users (Admin only)
router.get("/users",authMiddleware.authenticateJWT, authController.getAllUsers);

// Create user (Admin only)
router.post("/create-user", authMiddleware.authenticateJWT, authController.createUser)

// Update user data (Admin only)
router.put("/users/:id", authMiddleware.authenticateJWT, authController.updateUser);

// Update user password (Admin only)
router.put("/users/:id/password", authMiddleware.authenticateJWT, authController.updateUserPassword);

module.exports = router;
