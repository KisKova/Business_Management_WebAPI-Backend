const { Pool } = require("pg");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// ✅ Start a new time tracking entry
const startTimeTracking = async (user_id, note) => {
    const result = await pool.query(
        "INSERT INTO time_tracking (user_id, note, start_time) VALUES ($1, $2, NOW()) RETURNING *",
        [user_id, note]
    );
    return result.rows[0];
};

// ✅ Stop time tracking and ensure task, project, and customer are selected
const stopTimeTracking = async (id, user_id, project_id, task_id, customer_id) => {
    // Convert customer_id to number to match the assignedCustomers data type
    const numericCustomerId = Number(customer_id);

    // Fetch assigned customers
    const assignedCustomers = await getAssignedCustomers(user_id);

    // Ensure selected customer exists in assigned customers list
    const customerExists = assignedCustomers.some(customer => Number(customer.id) === numericCustomerId);

    if (!customerExists) {
        throw new Error("Selected customer is not assigned to this user.");
    }

    // Stop tracking and update database
    const result = await pool.query(
        `UPDATE time_tracking 
         SET end_time = NOW(),
             project_id = $2,
             task_id = $3,
             customer_id = $4,
             duration_hours = EXTRACT(HOUR FROM (NOW() - start_time)),
             duration_minutes = EXTRACT(MINUTE FROM (NOW() - start_time))
         WHERE id = $1 AND user_id = $5 RETURNING *`,
        [id, project_id, task_id, numericCustomerId, user_id]
    );

    return result.rows[0];
};

// ✅ Get active time tracking session
const getActiveTracking = async (user_id) => {
    const result = await pool.query(
        "SELECT * FROM time_tracking WHERE user_id = $1 AND end_time IS NULL ORDER BY start_time DESC LIMIT 1",
        [user_id]
    );
    return result.rows[0];
};

// ✅ Get all tracked time entries
const getUserTimeEntries = async (user_id) => {
    const result = await pool.query(
        "SELECT * FROM time_tracking WHERE user_id = $1 ORDER BY start_time DESC",
        [user_id]
    );
    return result.rows;
};

// ✅ Get all assigned customers for a user
const getAssignedCustomers = async (user_id) => {
    const result = await pool.query(
        `SELECT c.id, c.name FROM customers c
         JOIN customer_users cu ON c.id = cu.customer_id
         WHERE cu.user_id = $1`,
        [user_id]
    );
    return result.rows;
};

// ✅ Fetch all time trackings (User sees their own, Admin sees all)
const getAllTimeTracking = async (userId, isAdmin) => {
    const query = isAdmin
        ? `SELECT t.*, u.username, c.name AS customer_name, p.name AS project_name, task.name AS task_name
           FROM time_tracking t
           JOIN users u ON t.user_id = u.id
           JOIN customers c ON t.customer_id = c.id
           JOIN projects p ON t.project_id = p.id
           JOIN tasks task ON t.task_id = task.id
           ORDER BY t.start_time DESC`
        : `SELECT t.*, c.name AS customer_name, p.name AS project_name, task.name AS task_name
           FROM time_tracking t
           JOIN customers c ON t.customer_id = c.id
           JOIN projects p ON t.project_id = p.id
           JOIN tasks task ON t.task_id = task.id
           WHERE t.user_id = $1
           ORDER BY t.start_time DESC`;

    const values = isAdmin ? [] : [userId];
    const result = await pool.query(query, values);
    return result.rows;
};

// ✅ Fetch active time trackings (User sees own, Admin sees all)
const getAllActiveTracking = async (userId, isAdmin) => {
    const query = isAdmin
        ? `SELECT t.id, t.user_id, u.username, t.start_time, t.note
           FROM time_tracking t
           JOIN users u ON t.user_id = u.id
           WHERE t.end_time IS NULL`
        : `SELECT id, start_time, note FROM time_tracking WHERE user_id = $1 AND end_time IS NULL`;

    const values = isAdmin ? [] : [userId];
    const result = await pool.query(query, values);
    return result.rows;
};

module.exports = {
    startTimeTracking,
    stopTimeTracking,
    getActiveTracking,
    getAllActiveTracking,
    getUserTimeEntries,
    getAllTimeTracking,
    getAssignedCustomers
};
