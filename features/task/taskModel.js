const { Pool } = require("pg");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Fetch all tasks
const getAllTasks = async () => {
    const result = await pool.query("SELECT * FROM tasks ORDER BY id ASC");
    return result.rows;
};

// Get task by ID
const getTaskById = async (id) => {
    const result = await pool.query("SELECT * FROM tasks WHERE id = $1", [id]);
    return result.rows[0];
};

// Create a new task
const createTask = async (name) => {
    const existingTask = await pool.query("SELECT id FROM tasks WHERE name = $1", [name]);
    if(existingTask.rows.length > 0) {
        throw new Error("Task with this name already exists.");
    }
    const result = await pool.query("INSERT INTO tasks (name) VALUES ($1) RETURNING *", [name]);
    return result.rows[0];
};

// Update task name
const updateTask = async (id, name) => {
    const existingTask = await pool.query("SELECT id FROM tasks WHERE name = $1", [name]);
    if(existingTask.rows.length > 0) {
        throw new Error("Task with this name already exists.");
    }
    const result = await pool.query("UPDATE tasks SET name = $1 WHERE id = $2 RETURNING *", [name, id]);
    return result.rows[0];
};

// Delete a task
const deleteTask = async (id) => {
    const trackedTask = await pool.query("SELECT id FROM time_tracking WHERE task_id = $1", [id]);
    if(trackedTask.rows.length > 0) {
        throw new Error("Task cannot be deleted, it is assigned to a tracked time.");
    }
    await pool.query("DELETE FROM tasks WHERE id = $1", [id]);
};

module.exports = {
    getAllTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask
};