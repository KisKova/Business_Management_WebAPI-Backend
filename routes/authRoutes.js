const express = require("express");
const authController = require("../controllers/authController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

// Public routes
router.post("/register", authController.registerUser);
router.post("/login", authController.loginUser);

// Protected routes
router.get("/profile", authMiddleware.authenticateJWT, (req, res) => {
    res.json({ message: "User profile", user: req.user });
});

router.get("/admin", authMiddleware.authenticateJWT, authMiddleware.isAdmin, (req, res) => {
    res.json({ message: "Welcome Admin", user: req.user });
});

// Route to change password (Authenticated users only)
router.post("/change-password", authMiddleware.authenticateJWT, authController.changePassword);

module.exports = router;
