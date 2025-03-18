const projectModel = require("../models/projectModel");

// ✅ Get all projects
exports.getAllProjects = async (req, res) => {
    try {
        const projects = await projectModel.getAllProjects();
        res.json(projects);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

// ✅ Get a single project by ID
exports.getProjectById = async (req, res) => {
    try {
        const project = await projectModel.getProjectById(req.params.id);
        if (!project) return res.status(404).json({ message: "Project not found" });

        res.json(project);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

// ✅ Create a new project
exports.createProject = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Access denied" });
        }

        const { name } = req.body;
        const newProject = await projectModel.createProject(name);
        res.status(201).json(newProject);
    } catch (error) {
        res.status(500).json({ message: "Error creating project" });
    }
};

// ✅ Update project name
exports.updateProject = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Access denied" });
        }

        const { name } = req.body;
        const updatedProject = await projectModel.updateProject(req.params.id, name);

        if (!updatedProject) return res.status(404).json({ message: "Project not found" });

        res.json(updatedProject);
    } catch (error) {
        res.status(500).json({ message: "Error updating project" });
    }
};

// ✅ Delete a project
exports.deleteProject = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Access denied" });
        }

        await projectModel.deleteProject(req.params.id);
        res.json({ message: "Project deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting project" });
    }
};
