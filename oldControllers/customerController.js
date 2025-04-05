const customerModel = require("../oldModels/customerModel");

// Getting all customers for customer list
exports.getAllCustomers = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Access denied" });
        }
        const customers = await customerModel.getAllCustomers();
        res.json(customers);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

// Create a new customer (Admin Only)
exports.createCustomer = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Access denied" });
        }
        const customer = await customerModel.createCustomer(req.body);
        res.status(201).json(customer);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

// Update customer details (Admin Only)
exports.updateCustomer = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Access denied" });
        }
        await customerModel.updateCustomer(req.params.id, req.body);
        res.json({ message: "Customer updated successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

// Get Customer by id
exports.getCustomerById = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Access denied" });
        }
        const customer = await customerModel.getCustomerById(req.params.id);
        if (!customer) {
            return res.status(404).json({ message: "Customer not found" });
        }
        res.json(customer);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

// Assign user to a customer (Admin Only)
exports.assignUserToCustomer = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Access denied" });
        }
        await customerModel.assignUserToCustomer(req.params.customer_id, req.body.user_id);
        res.json({ message: "User assigned to customer successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

// Get all users assigned to a customer (Admin Only)
exports.getUsersByCustomerId = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Access denied" });
        }
        const users = await customerModel.getUsersByCustomerId(req.params.customer_id);
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

// ✅ Remove assigned user from a customer (Admin Only)
exports.removeUserFromCustomer = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Access denied" });
        }
        const { customer_id, user_id } = req.params;

        const success = await customerModel.removeUserFromCustomer(customer_id, user_id);
        if (success) {
            res.json({ message: "User removed from customer successfully" });
        } else {
            res.status(404).json({ message: "User not found for this customer" });
        }
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};
