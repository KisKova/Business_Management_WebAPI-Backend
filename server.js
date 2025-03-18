require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const authRoutes = require("./routes/authRoutes");
const customerRoutes = require("./routes/customerRoutes");
const projectRoutes = require("./routes/projectRoutes");
const taskRoutes = require("./routes/taskRoutes");
const timeTrackingRoutes = require("./routes/timeTrackingRoutes");
//const userRoutes = require("./routes/userRoutes")

const app = express();

// Middlewares
app.use(express.json());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use("/auth", authRoutes);
app.use("/auth/customers", customerRoutes);
app.use("/auth/projects", projectRoutes);
app.use("/auth/tasks", taskRoutes);
app.use("/auth/time-tracking", timeTrackingRoutes);

// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
