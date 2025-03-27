const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const timeTrackingController = require("../controllers/timeTrackingController");

const router = express.Router();

// ✅ Fetch all time tracking
router.get("/", authMiddleware.authenticateJWT, timeTrackingController.getAllTimeTracking);

// ✅ Start tracking
router.post("/start", authMiddleware.authenticateJWT, timeTrackingController.startTracking);

// ✅ Stop tracking and assign details
router.post("/stop", authMiddleware.authenticateJWT, timeTrackingController.stopTracking);

router.post("/manual", authMiddleware.authenticateJWT, timeTrackingController.addManualTracking);

router.delete("/:id", authMiddleware.authenticateJWT, timeTrackingController.deleteTracking);

router.put("/:id", authMiddleware.authenticateJWT, timeTrackingController.updateTracking);

// ✅ Get active tracking session
router.get("/active", authMiddleware.authenticateJWT, timeTrackingController.getActiveTracking);

// ✅ Get active tracking session
router.get("/all-active", authMiddleware.authenticateJWT, timeTrackingController.getAllActiveTracking);

// ✅ Get all time entries for a user
router.get("/entries", authMiddleware.authenticateJWT, timeTrackingController.getUserTimeEntries);

// ✅ Get assigned customers for the user
router.get("/assigned-customers", authMiddleware.authenticateJWT, timeTrackingController.getAssignedCustomers);

router.get("/:id/summary", authMiddleware.authenticateJWT, timeTrackingController.getCustomerMonthlySummary);

module.exports = router;
