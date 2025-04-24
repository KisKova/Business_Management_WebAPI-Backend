
const timeTrackingController = require('../../features/time-tracking/timeTrackingController');
const timeTrackingModel = require('../../features/time-tracking/timeTrackingModel');
const BaseController = require('../../utils/BaseController');
const { checkAdmin } = require('../../utils/roleCheck');

jest.mock('../../features/time-tracking/timeTrackingModel');
jest.mock('../../utils/roleCheck', () => ({ checkAdmin: jest.fn() }));

describe('TimeTracking Controller (full coverage)', () => {
    let mockRes;

    beforeEach(() => {
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        BaseController.handleRequest = async (res, fn, options) => {
            try {
                const data = await fn();
                res.status(200).json(data);
            } catch (err) {
                res.status(500).json({ error: err.message });
            }
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should start tracking if no active session exists', async () => {
        timeTrackingModel.getActiveTracking.mockResolvedValue(null);
        timeTrackingModel.startTimeTracking.mockResolvedValue();

        const req = { user: { userId: 1 }, body: { note: 'Note' } };
        await timeTrackingController.startTracking(req, mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should stop tracking with valid session and customer', async () => {
        timeTrackingModel.getActiveTracking.mockResolvedValue({ id: 5 });
        timeTrackingModel.getAssignedCustomers.mockResolvedValue([{ id: 2 }]);
        timeTrackingModel.stopTimeTracking.mockResolvedValue('stopped');

        const req = {
            user: { userId: 1 },
            body: { id: 5, project_id: 10, task_id: 20, customer_id: 2 }
        };

        await timeTrackingController.stopTracking(req, mockRes);
        expect(mockRes.json).toHaveBeenCalledWith('stopped');
    });

    it('should delete a tracking record', async () => {
        timeTrackingModel.deleteTracking.mockResolvedValue(true);

        const req = { params: { id: '12' }, user: { userId: 1, role: 'admin' } };
        await timeTrackingController.deleteTracking(req, mockRes);

        expect(mockRes.json).toHaveBeenCalledWith(true);
    });

    it('should get active tracking for a user', async () => {
        const mockData = { id: 1, note: 'tracking' };
        timeTrackingModel.getActiveTracking.mockResolvedValue(mockData);

        const req = { user: { userId: 1, role: 'user' } };
        await timeTrackingController.getActiveTracking(req, mockRes);

        expect(mockRes.json).toHaveBeenCalledWith(mockData);
    });

    it('should get all active trackings', async () => {
        const data = [{ id: 1 }, { id: 2 }];
        timeTrackingModel.getAllActiveTracking.mockResolvedValue(data);

        const req = { user: { userId: 1, role: 'admin' } };
        await timeTrackingController.getAllActiveTracking(req, mockRes);

        expect(mockRes.json).toHaveBeenCalledWith(data);
    });

    it('should return user time entries', async () => {
        const data = [{ id: 1 }];
        timeTrackingModel.getUserTimeEntries.mockResolvedValue(data);

        const req = { user: { userId: 1 } };
        await timeTrackingController.getUserTimeEntries(req, mockRes);

        expect(mockRes.json).toHaveBeenCalledWith(data);
    });

    it('should return assigned customers for user', async () => {
        const data = [{ id: 10 }];
        timeTrackingModel.getAssignedCustomers.mockResolvedValue(data);

        const req = { user: { userId: 1 } };
        await timeTrackingController.getAssignedCustomers(req, mockRes);

        expect(mockRes.json).toHaveBeenCalledWith(data);
    });

    it('should return all time tracking for user', async () => {
        const data = [{ id: 3 }];
        timeTrackingModel.getAllTimeTracking.mockResolvedValue(data);

        const req = { user: { userId: 1, role: 'user' } };
        await timeTrackingController.getAllTimeTracking(req, mockRes);

        expect(mockRes.json).toHaveBeenCalledWith(data);
    });

    it('should add manual tracking when fields are valid', async () => {
        timeTrackingModel.addManualTracking.mockResolvedValue('added');

        const req = {
            user: { userId: 1 },
            body: {
                customer_id: 1,
                project_id: 2,
                task_id: 3,
                start_time: new Date().toISOString(),
                duration_hours: 1,
                duration_minutes: 30,
                note: 'Manual entry'
            }
        };

        await timeTrackingController.addManualTracking(req, mockRes);
        expect(mockRes.json).toHaveBeenCalledWith('added');
    });

    it('should update tracking when all required fields are present', async () => {
        timeTrackingModel.updateTracking.mockResolvedValue('updated');

        const req = {
            params: { id: 123 },
            user: { userId: 1, role: 'admin' },
            body: {
                start_time: new Date().toISOString(),
                duration_hours: 1,
                duration_minutes: 30,
                customer_id: 1,
                project_id: 2,
                task_id: 3,
                note: 'Updated task'
            }
        };

        await timeTrackingController.updateTracking(req, mockRes);
        expect(mockRes.json).toHaveBeenCalledWith('updated');
    });

    it('should get monthly tracking summary for customer', async () => {
        timeTrackingModel.getMonthlyTrackingSummaryForCustomer.mockResolvedValue({ total: 40 });

        const req = { params: { id: 5 }, user: { role: 'admin' } };
        await timeTrackingController.getCustomerMonthlySummary(req, mockRes);

        expect(mockRes.json).toHaveBeenCalledWith({ total: 40 });
    });
});