const express = require("express");
const customerController = require("../controllers/customerController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

// ✅ Get all customers (Admin Only)
router.get("/", authMiddleware.authenticateJWT, customerController.getAllCustomers);

// ✅ Create a new customer (Admin Only)
router.post("/", authMiddleware.authenticateJWT, customerController.createCustomer);

// ✅ Get a single customer (Admin Only)
router.get("/:id", authMiddleware.authenticateJWT, customerController.getCustomerById);

// ✅ Update a customer (Admin Only)
router.put("/:id", authMiddleware.authenticateJWT, customerController.updateCustomer);

// ✅ Assign user to a customer (Admin Only)
router.post("/:customer_id/users", authMiddleware.authenticateJWT, customerController.assignUserToCustomer);

// ✅ Get all users assigned to a customer (Admin Only)
router.get("/:customer_id/users", authMiddleware.authenticateJWT, customerController.getUsersByCustomerId);

// ✅ Remove assigned user from a customer (Admin Only)
router.delete("/:customer_id/users/:user_id", authMiddleware.authenticateJWT, customerController.removeUserFromCustomer);

module.exports = router;
