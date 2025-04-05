const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const taskController = require("../features/task/taskController");

const router = express.Router();

// Get all tasks
router.get("/", authMiddleware.authenticateJWT, taskController.getAllTasks);

// Get a single task
router.get("/:id", authMiddleware.authenticateJWT, taskController.getTaskById);

// Create a new task
router.post("/", authMiddleware.authenticateJWT, taskController.createTask);

// Update task name
router.put("/:id", authMiddleware.authenticateJWT, taskController.updateTask);

// Delete a task
router.delete("/:id", authMiddleware.authenticateJWT, taskController.deleteTask);

module.exports = router;
