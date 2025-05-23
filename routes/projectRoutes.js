const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const projectController = require("../features/project/projectController");

const router = express.Router();

// Get all projects
router.get("/", authMiddleware.authenticateJWT, projectController.getAllProject);

// Get a single project
router.get("/:id", authMiddleware.authenticateJWT, projectController.getProjectById);

// Create a new project
router.post("/", authMiddleware.authenticateJWT, projectController.createProject);

// Update project name
router.put("/:id", authMiddleware.authenticateJWT, projectController.updateProject);

// Delete a project
router.delete("/:id", authMiddleware.authenticateJWT, projectController.deleteProject);

module.exports = router;
