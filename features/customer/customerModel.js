const { Pool } = require("pg");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const getAllCustomer = async () => {
    const result = await pool.query("SELECT * FROM customers ORDER BY id ASC");
    return result.rows;
};

// Fetch a single customer by ID
const getCustomerById = async (id) => {
    const result = await pool.query("SELECT * FROM customers WHERE id = $1", [id]);
    return result.rows[0];
};

// Create a new customer
const createCustomer = async ({ name, hourly_fee, billing_type, invoice_type, tax_number }) => {
    const result = await pool.query(
        "INSERT INTO customers (name, hourly_fee, billing_type, invoice_type, tax_number) VALUES ($1, $2, $3, $4, $5) RETURNING *",
        [name, hourly_fee, billing_type, invoice_type, tax_number]
    );
    return result.rows[0];
};

// Update customer details
const updateCustomer = async (id, { name, hourly_fee, billing_type, invoice_type, tax_number }) => {
    await pool.query(
        "UPDATE customers SET name = $1, hourly_fee = $2, billing_type = $3, invoice_type = $4, tax_number = $5, updated_at = NOW() WHERE id = $6",
        [name, hourly_fee, billing_type, invoice_type, tax_number, id]
    );
};

// Assign a user to a customer
const assignUserToCustomer = async (customer_id, user_id) => {
    await pool.query("INSERT INTO customer_users (customer_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [customer_id, user_id]);
};

// Get all users assigned to a customer
const getUsersByCustomerId = async (customer_id) => {
    const result = await pool.query(
        "SELECT u.id, u.username, u.email, u.role FROM customer_users cu JOIN users u ON cu.user_id = u.id WHERE cu.customer_id = $1",
        [customer_id]
    );
    return result.rows;
};

// Remove an assigned user from a customer
const removeUserFromCustomer = async (customer_id, user_id) => {
    const result = await pool.query(
        "DELETE FROM customer_users WHERE customer_id = $1 AND user_id = $2 RETURNING *",
        [customer_id, user_id]
    );
    return result.rowCount > 0; // Returns true if a row was deleted, false otherwise
};

module.exports = {
    getAllCustomer,
    getCustomerById,
    createCustomer,
    updateCustomer,
    assignUserToCustomer,
    getUsersByCustomerId,
    removeUserFromCustomer
};
