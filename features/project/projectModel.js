const { Pool } = require("pg");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Fetch all projects
const getAllProject = async () => {
    const result = await pool.query("SELECT * FROM projects ORDER BY id ASC");
    return result.rows;
};

// Get project by ID
const getProjectById = async (id) => {
    const result = await pool.query("SELECT * FROM projects WHERE id = $1", [id]);
    return result.rows[0];
};

// Create a new project
const createProject = async (name) => {
    const updateExistingProject = await pool.query("SELECT id FROM projects WHERE name = $1", [name]);
    if(updateExistingProject.rows.length > 0) {
        throw new Error("Project with this name already exists.");
    }
    const result = await pool.query("INSERT INTO projects (name) VALUES ($1) RETURNING *", [name]);
    return result.rows[0];
};

// Update project name
const updateProject = async (id, name) => {
    const updateExistingProject = await pool.query("SELECT id FROM projects WHERE name = $1", [name]);
    if(updateExistingProject.rows.length > 0) {
        throw new Error("Project with this name already exists.");
    }
    const result = await pool.query("UPDATE projects SET name = $1 WHERE id = $2 RETURNING *", [name, id]);
    return result.rows[0];
};

// Delete a project
const deleteProject = async (id) => {
    const deleteExistingProject = await pool.query("SELECT id FROM time_tracking WHERE project_id = $1", [id]);
    if(deleteExistingProject.rows.length > 0) {
        throw new Error("Project cannot be deleted, it is assigned to a tracked time.");
    }
    await pool.query("DELETE FROM projects WHERE id = $1", [id]);
};

module.exports = {
    getAllProject,
    getProjectById,
    createProject,
    updateProject,
    deleteProject
};
