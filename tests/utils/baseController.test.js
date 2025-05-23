const BaseController = require('../../utils/BaseController');

describe('BaseController.handleRequest (full branch)', () => {
    let mockRes;

    beforeEach(() => {
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
    });

    it('returns 403 if roleCheck exists and returns false', async () => {
        const req = { user: { role: 'user' } };
        const roleCheck = () => ({ allowed: false, message: 'Denied' });

        await BaseController.handleRequest(mockRes, jest.fn(), { roleCheck, req });

        expect(mockRes.status).toHaveBeenCalledWith(403);
        expect(mockRes.json).toHaveBeenCalledWith({ message: 'Denied' });
    });

    it('calls serviceMethod if roleCheck allows access', async () => {
        const serviceMethod = jest.fn().mockResolvedValue('OK');
        const roleCheck = () => ({ allowed: true });

        await BaseController.handleRequest(mockRes, serviceMethod, {
            roleCheck,
            req: { user: { role: 'admin' } }
        });

        expect(serviceMethod).toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: 'OK' });
    });

    it('skips roleCheck block if roleCheck is null', async () => {
        const serviceMethod = jest.fn().mockResolvedValue('SKIPPED');

        await BaseController.handleRequest(mockRes, serviceMethod, {
            roleCheck: null,
            req: null
        });

        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: 'SKIPPED' });
    });
});
