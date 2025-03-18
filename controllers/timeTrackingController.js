const timeTrackingModel = require("../models/timeTrackingModel");

// ✅ Start a new time tracking session
exports.startTracking = async (req, res) => {
    try {
        const { note } = req.body;
        const user_id = req.user.userId;

        // Check if an active time tracking session already exists
        const activeTracking = await timeTrackingModel.getActiveTracking(user_id);
        if (activeTracking) {
            return res.status(400).json({ message: "You already have an active tracking session." });
        }

        const newTracking = await timeTrackingModel.startTimeTracking(user_id, note);
        res.status(201).json(newTracking);
    } catch (error) {
        res.status(500).json({ message: "Error starting time tracking." });
    }
};

// ✅ Stop an active time tracking session
exports.stopTracking = async (req, res) => {
    try {
        const { id, project_id, task_id, customer_id } = req.body;
        const user_id = req.user.userId;

        console.log(id, user_id, customer_id);

        // Ensure an active tracking session exists
        const activeTracking = await timeTrackingModel.getActiveTracking(user_id);
        console.log(activeTracking);
        if (!activeTracking || activeTracking.id !== id) {
            return res.status(400).json({ message: "No active tracking session found or invalid session ID." });
        }

        const updatedTracking = await timeTrackingModel.stopTimeTracking(id, user_id, project_id, task_id, customer_id);
        res.json(updatedTracking);
    } catch (error) {
        res.status(500).json({ message: error.message || "Error stopping time tracking." });
    }
};

/* ✅ Get active time tracking session for a user
exports.getActiveTracking = async (req, res) => {
    try {
        const user_id = req.user.userId;
        const activeTracking = await timeTrackingModel.getActiveTracking(user_id);
        res.json(activeTracking || {});
    } catch (error) {
        res.status(500).json({ message: "Error fetching active time tracking." });
    }
};*/

// ✅ Get all tracked time entries for a user
exports.getUserTimeEntries = async (req, res) => {
    try {
        const user_id = req.user.userId;
        const timeEntries = await timeTrackingModel.getUserTimeEntries(user_id);
        res.json(timeEntries);
    } catch (error) {
        res.status(500).json({ message: "Error fetching time entries." });
    }
};

// ✅ Get assigned customers for a user
exports.getAssignedCustomers = async (req, res) => {
    try {
        const user_id = req.user.userId;
        const customers = await timeTrackingModel.getAssignedCustomers(user_id);
        res.json(customers);
    } catch (error) {
        res.status(500).json({ message: "Error fetching assigned customers." });
    }
};

// ✅ Fetch all time tracking
exports.getAllTimeTracking = async (req, res) => {
    const userId = req.user.userId;
    const isAdmin = req.user.role === "admin";

    try {
        const tracking = await timeTrackingModel.getAllTimeTracking(userId, isAdmin);
        res.json(tracking);
    } catch (error) {
        console.error("Error fetching time tracking:", error);
        res.status(500).json({ message: "Server error fetching time tracking." });
    }
};

// ✅ Fetch active time tracking
exports.getActiveTracking = async (req, res) => {
    const userId = req.user.userId;
    const isAdmin = req.user.role === "admin";

    try {
        const activeTracking = await timeTrackingModel.getActiveTracking(userId, isAdmin);
        res.json(activeTracking);
    } catch (error) {
        console.error("Error fetching active time tracking:", error);
        res.status(500).json({ message: "Server error fetching active time tracking." });
    }
};

// ✅ Fetch active time tracking
exports.getAllActiveTracking = async (req, res) => {
    const userId = req.user.userId;
    const isAdmin = req.user.role === "admin";

    try {
        const activeTracking = await timeTrackingModel.getAllActiveTracking(userId, isAdmin);
        res.json(activeTracking);
    } catch (error) {
        console.error("Error fetching active time tracking:", error);
        res.status(500).json({ message: "Server error fetching active time tracking." });
    }
};
