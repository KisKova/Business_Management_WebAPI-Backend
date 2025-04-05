const { Pool } = require("pg");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// ✅ Fetch all projects
const getAllProjects = async () => {
    const result = await pool.query("SELECT * FROM projects ORDER BY id ASC");
    return result.rows;
};

// ✅ Get project by ID
const getProjectById = async (id) => {
    const result = await pool.query("SELECT * FROM projects WHERE id = $1", [id]);
    return result.rows[0];
};

// ✅ Create a new project
const createProject = async (name) => {
    const result = await pool.query("INSERT INTO projects (name) VALUES ($1) RETURNING *", [name]);
    return result.rows[0];
};

// ✅ Update project name
const updateProject = async (id, name) => {
    const result = await pool.query("UPDATE projects SET name = $1 WHERE id = $2 RETURNING *", [name, id]);
    return result.rows[0];
};

// ✅ Delete a project
const deleteProject = async (id) => {
    await pool.query("DELETE FROM projects WHERE id = $1", [id]);
};

module.exports = {
    getAllProjects,
    getProjectById,
    createProject,
    updateProject,
    deleteProject
};
