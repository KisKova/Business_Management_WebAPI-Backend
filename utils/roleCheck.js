const checkAdmin = (req) => {
    if (req.user.role !== 'admin') {
        return { allowed: false, message: 'Admin access required' };
    }
    return { allowed: true };
};

module.exports = { checkAdmin };
