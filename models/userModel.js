const { Pool } = require("pg");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Get user by email
const getUserByEmail = async (email) => {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    return result.rows[0];
};

// Get user by username
const getUserByUsername = async (username) => {
    const result = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
    return result.rows[0];
};

// Get user by ID
const getUserById = async (id) => {
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
    return result.rows[0];
};

// Update user password
const updateUserPassword = async (id, newPassword) => {
    await pool.query("UPDATE users SET password = $1 WHERE id = $2", [newPassword, id]);
};

// Create user
const createUser = async (username, email, password, role) => {
    const result = await pool.query(
        "INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING *",
        [username, email, password, role]
    );
    return result.rows[0];
};

module.exports = {
    getUserByEmail,
    getUserByUsername,
    getUserById,
    updateUserPassword,
    createUser
};