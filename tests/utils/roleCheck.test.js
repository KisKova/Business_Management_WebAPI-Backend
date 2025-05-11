const { checkAdmin } = require('../../utils/roleCheck');

describe('roleCheck utility', () => {
    it('should allow access for admin users', () => {
        const req = { user: { role: 'admin' } };
        const result = checkAdmin(req);
        expect(result).toEqual({ allowed: true });
    });

    it('should deny access for non-admin users', () => {
        const req = { user: { role: 'user' } };
        const result = checkAdmin(req);
        expect(result).toEqual({ allowed: false, message: 'Admin access required' });
    });

    it('should deny access if role is missing', () => {
        const req = { user: {} };
        const result = checkAdmin(req);
        expect(result).toEqual({ allowed: false, message: 'Admin access required' });
    });
});
