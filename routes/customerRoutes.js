const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const customerController = require("../features/customer/customerController");

const router = express.Router();

// Get all customers (Admin only)
router.get("/", authMiddleware.authenticateJWT, customerController.getAllCustomer);

// Create a new customer (Admin only)
router.post("/", authMiddleware.authenticateJWT, customerController.createCustomer);

// Get a single customer (Admin only)
router.get("/:id", authMiddleware.authenticateJWT, customerController.getCustomerById);

// Update a customer (Admin only)
router.put("/:id", authMiddleware.authenticateJWT, customerController.updateCustomer);

// Assign user to a customer (Admin only)
router.post("/:customer_id/users", authMiddleware.authenticateJWT, customerController.assignUserToCustomer);

// Get all users assigned to a customer (Admin only)
router.get("/:customer_id/users", authMiddleware.authenticateJWT, customerController.getUsersByCustomerId);

// Remove assigned user from a customer (Admin only)
router.delete("/:customer_id/users/:user_id", authMiddleware.authenticateJWT, customerController.removeUserFromCustomer);

module.exports = router;
