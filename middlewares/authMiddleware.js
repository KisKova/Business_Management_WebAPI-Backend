const jwt = require("jsonwebtoken");

exports.authenticateJWT = (req, res, next) => {
    const authHeader = req.header("Authorization");

    console.log("Authorization Header:", authHeader); // Debugging

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(403).json({ message: "Access denied. No token provided." });
    }

    const token = authHeader.split(" ")[1]; // Extract token

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            console.log("JWT Verification Error:", err); // Debugging
            return res.status(403).json({ message: "Invalid token" });
        }

        console.log("Decoded Token:", decoded); // Debugging

        // Fix: Assign the correct properties based on the JWT structure
        req.user = {
            userId: decoded.id, // Map `id` from token to `userId`
            username: decoded.username,
            email: decoded.email,
            role: decoded.role
        };

        next();
    });
};

exports.isAdmin = (req, res, next) => {
    if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied, admin only" });
    }
    next();
};
