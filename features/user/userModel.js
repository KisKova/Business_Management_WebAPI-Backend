const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Get all users (Excluding password)
const getAllUsers = async () => {
    const result = await pool.query("SELECT id, username, email, role, is_active, created_at FROM users ORDER BY id ASC");
    return result.rows;
};

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

// Update user email
const updateUserEmail = async (id, newEmail) => {
    const existingUser = await getUserByEmail(newEmail);
    if (existingUser) {
        throw new Error("Email already in use.");
    }
    await pool.query("UPDATE users SET email = $1 WHERE id = $2", [newEmail, id]);
}

// Update user username
const updateUserName = async (id, newName) => {
    const existingUser = await getUserByUsername(newName);
    if (existingUser) {
        throw new Error("Username already in use.");
    }
    await pool.query("UPDATE users SET username = $1 WHERE id = $2", [newName, id]);
}

// Update user role
const updateUserRole = async (id, newRole) => {
    await pool.query("UPDATE users SET role = $1 WHERE id = $2", [newRole, id]);
}

const updateUserStatus = async (id, is_active) => {
    await pool.query("UPDATE users SET is_active = $1 WHERE id = $2", [is_active, id]);
}

// Create user (Check for duplicate email)
const createUser = async (username, email, password, role) => {
    const result = await pool.query(
        "INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role, created_at",
        [username, email, password, role]
    );
    return result.rows[0];
};

// Exporting all function
module.exports = {
    getAllUsers,
    getUserByEmail,
    getUserByUsername,
    getUserById,
    updateUserPassword,
    updateUserEmail,
    updateUserName,
    updateUserRole,
    updateUserStatus,
    createUser
};