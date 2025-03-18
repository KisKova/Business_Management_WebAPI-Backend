const taskModel = require("../models/taskModel");

// ✅ Get all tasks
exports.getAllTasks = async (req, res) => {
    try {
        const tasks = await taskModel.getAllTasks();
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

// ✅ Get a single task by ID
exports.getTaskById = async (req, res) => {
    try {
        const task = await taskModel.getTaskById(req.params.id);
        if (!task) return res.status(404).json({ message: "Task not found" });

        res.json(task);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

// ✅ Create a new task
exports.createTask = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Access denied" });
        }

        const { name } = req.body;
        const newTask = await taskModel.createTask(name);
        res.status(201).json(newTask);
    } catch (error) {
        res.status(500).json({ message: "Error creating task" });
    }
};

// ✅ Update task name
exports.updateTask = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Access denied" });
        }

        const { name } = req.body;
        const updatedTask = await taskModel.updateTask(req.params.id, name);

        if (!updatedTask) return res.status(404).json({ message: "Task not found" });

        res.json(updatedTask);
    } catch (error) {
        res.status(500).json({ message: "Error updating task" });
    }
};

// ✅ Delete a task
exports.deleteTask = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Access denied" });
        }

        await taskModel.deleteTask(req.params.id);
        res.json({ message: "Task deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting task" });
    }
};
