const { Pool } = require("pg");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Start a new time tracking entry
const startTimeTracking = async (user_id, note) => {
    const result = await pool.query(
        "INSERT INTO time_tracking (user_id, note, start_time) VALUES ($1, $2, NOW()) RETURNING *",
        [user_id, note]
    );
    return result.rows[0];
};

// Stop time tracking and ensure task, project, and customer are selected
const stopTimeTracking = async (id, user_id, project_id, task_id, customer_id) => {
    const result = await pool.query(
        `UPDATE time_tracking 
         SET end_time = NOW(),
             project_id = $2,
             task_id = $3,
             customer_id = $4,
             duration_hours = EXTRACT(HOUR FROM (NOW() - start_time)),
             duration_minutes = EXTRACT(MINUTE FROM (NOW() - start_time))
         WHERE id = $1 AND user_id = $5 RETURNING *`,
        [id, project_id, task_id, customer_id, user_id]
    );

    return result.rows[0];
};

// Get active time tracking session
const getActiveTracking = async (user_id) => {
    const result = await pool.query(
        "SELECT * FROM time_tracking WHERE user_id = $1 AND end_time IS NULL ORDER BY start_time DESC LIMIT 1",
        [user_id]
    );
    return result.rows[0];
};

// Get all tracked time entries
const getUserTimeEntries = async (user_id) => {
    const result = await pool.query(
        "SELECT * FROM time_tracking WHERE user_id = $1 ORDER BY start_time DESC",
        [user_id]
    );
    return result.rows;
};

// Get all assigned customers for a user
const getAssignedCustomers = async (user_id) => {
    const result = await pool.query(
        `SELECT c.id, c.name FROM customers c
         JOIN customer_users cu ON c.id = cu.customer_id
         WHERE cu.user_id = $1`,
        [user_id]
    );
    return result.rows;
};

// Fetch all time tracking (User sees their own, Admin sees all)
const getAllTimeTracking = async (userId, isAdmin) => {
    const query = isAdmin
        ? `SELECT t.*, u.username, c.name AS customer_name, c.billing_type, p.name AS project_name, task.name AS task_name
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

// Fetch active time tracking (User sees own, Admin sees all)
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

// Add manual time tracking (Automatically calculate end time)
const addManualTracking = async (userId, customerId, projectId, taskId, startTime, endTime, durationHours, durationMinutes, note) => {
    const query = `
        INSERT INTO time_tracking (user_id, customer_id, project_id, task_id, start_time, end_time, duration_hours, duration_minutes, note)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *;
    `;

    const values = [userId, customerId, projectId, taskId, startTime, endTime, durationHours, durationMinutes, note];
    const result = await pool.query(query, values);
    return result.rows[0];
};

// Delete tracked time
const deleteTracking = async (trackingId, userId, isAdmin) => {
    const query = isAdmin
        ? `DELETE FROM time_tracking WHERE id = $1 RETURNING *`
        : `DELETE FROM time_tracking WHERE id = $1 AND user_id = $2 RETURNING *`;

    const values = isAdmin ? [trackingId] : [trackingId, userId];

    const result = await pool.query(query, values);
    if (result.rowCount === 0) {
        throw new Error("Delete failed or unauthorized.");
    }

    return result.rows[0];
};

const updateTracking = async (
    trackingId,
    userId,
    isAdmin,
    startTime,
    durationHours,
    durationMinutes,
    customerId,
    projectId,
    taskId,
    note
) => {
    // Only allow update if the user owns the entry or is an admin
    const baseQuery = `
        UPDATE time_tracking SET
            start_time = $1,
            duration_hours = $2,
            duration_minutes = $3,
            customer_id = $4,
            project_id = $5,
            task_id = $6,
            note = $7
        WHERE id = $8 ${isAdmin ? "" : "AND user_id = $9"}
        RETURNING *;
    `;

    const values = isAdmin
        ? [startTime, durationHours, durationMinutes, customerId, projectId, taskId, note, trackingId]
        : [startTime, durationHours, durationMinutes, customerId, projectId, taskId, note, trackingId, userId];

    const result = await pool.query(baseQuery, values);

    if (result.rowCount === 0) {
        throw new Error("Update failed or unauthorized.");
    }

    return result.rows[0];
};

// Get monthly cost for Customer based on the tracked times
const getMonthlyTrackingSummaryForCustomer = async (customerId) => {
    const query = `
        SELECT
            DATE_TRUNC('month', t.start_time) AS month,
            SUM(t.duration_hours + t.duration_minutes / 60.0) AS total_hours,
            c.hourly_fee
        FROM time_tracking t
        JOIN customers c ON t.customer_id = c.id
        WHERE t.customer_id = $1
        GROUP BY month, c.hourly_fee
        ORDER BY month DESC
    `;
    const result = await pool.query(query, [customerId]);
    return result.rows;
};

module.exports = {
    startTimeTracking,
    stopTimeTracking,
    getActiveTracking,
    updateTracking,
    deleteTracking,
    getAllActiveTracking,
    getUserTimeEntries,
    getAllTimeTracking,
    getAssignedCustomers,
    addManualTracking,
    getMonthlyTrackingSummaryForCustomer
};
