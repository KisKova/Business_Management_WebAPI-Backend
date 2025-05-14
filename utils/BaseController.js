class BaseController {
    async handleRequest(res, serviceMethod, { roleCheck = null, req = null } = {}) {
        try {
            if (roleCheck && req) {
                const authorized = roleCheck(req);
                if (!authorized.allowed) {
                    /* istanbul ignore next */
                    return res.status(403).json({ message: authorized.message || "Access denied" });
                }
            }

            const result = await serviceMethod();
            //console.log(result);
            res.status(200).json({ success: true, data: result });
        } catch (error) {
            //console.error(error);
            /* istanbul ignore next */
            res.status(500).json({ success: false, message: error.message || 'Server error' });
        }
    }
}

module.exports = new BaseController();
