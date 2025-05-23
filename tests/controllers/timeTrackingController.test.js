const timeTrackingController = require('../../features/time-tracking/timeTrackingController');
const timeTrackingModel = require('../../features/time-tracking/timeTrackingModel');
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
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should start tracking if no active session exists', async () => {
        timeTrackingModel.getActiveTracking.mockResolvedValue(null);
        timeTrackingModel.startTimeTracking.mockResolvedValue('started');

        const req = { user: { userId: 1 }, body: { note: 'Note' } };
        await timeTrackingController.startTracking(req, mockRes);
        expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: 'started' });
    });

    it('should return error if tracking already active', async () => {
        timeTrackingModel.getActiveTracking.mockResolvedValue({ id: 99 });

        const req = { user: { userId: 1 }, body: { note: 'Conflict' } };
        await timeTrackingController.startTracking(req, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith({
            success: false,
            message: expect.stringContaining('already have an active') });
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
        expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: 'stopped' });
    });

    it('should fail to stop tracking if customer not assigned', async () => {
        timeTrackingModel.getActiveTracking.mockResolvedValue({ id: 5 });
        timeTrackingModel.getAssignedCustomers.mockResolvedValue([{ id: 99 }]);

        const req = {
            user: { userId: 1 },
            body: { id: 5, project_id: 10, task_id: 20, customer_id: 2 }
        };

        await timeTrackingController.stopTracking(req, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: expect.stringContaining('not assigned') });
    });

    it('should delete a tracking record', async () => {
        timeTrackingModel.deleteTracking.mockResolvedValue(true);

        const req = { params: { id: '12' }, user: { userId: 1, role: 'admin' } };
        await timeTrackingController.deleteTracking(req, mockRes);

        expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: true });
    });

    it('should get active tracking for a user', async () => {
        const mockData = { id: 1, note: 'tracking' };
        timeTrackingModel.getActiveTracking.mockResolvedValue(mockData);

        const req = { user: { userId: 1, role: 'user' } };
        await timeTrackingController.getActiveTracking(req, mockRes);

        expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: mockData });
    });

    it('should get all active trackings', async () => {
        const data = [{ id: 1 }, { id: 2 }];
        timeTrackingModel.getAllActiveTracking.mockResolvedValue(data);
        checkAdmin.mockReturnValue({ allowed: true });

        const req = { user: { userId: 1, role: 'admin' } };
        await timeTrackingController.getAllActiveTracking(req, mockRes);

        expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: data });
    });

    it('should return user time entries', async () => {
        const data = [{ id: 1 }];
        timeTrackingModel.getUserTimeEntries.mockResolvedValue(data);

        const req = { user: { userId: 1 } };
        await timeTrackingController.getUserTimeEntries(req, mockRes);

        expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: data });
    });

    it('should return assigned customers for user', async () => {
        const data = [{ id: 10 }];
        timeTrackingModel.getAssignedCustomers.mockResolvedValue(data);

        const req = { user: { userId: 1 } };
        await timeTrackingController.getAssignedCustomers(req, mockRes);

        expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: data });
    });

    it('should return all time tracking for user', async () => {
        const data = [{ id: 3 }];
        timeTrackingModel.getAllTimeTracking.mockResolvedValue(data);

        const req = { user: { userId: 1, role: 'user' } };
        await timeTrackingController.getAllTimeTracking(req, mockRes);

        expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: data });
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
        expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: 'added' });
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
        expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: 'updated' });
    });

    it('should get monthly tracking summary for customer', async () => {
        timeTrackingModel.getMonthlyTrackingSummaryForCustomer.mockResolvedValue({ total: 40 });
        checkAdmin.mockReturnValue({ allowed: true });

        const req = { params: { id: 5 }, user: { role: 'admin' } };
        await timeTrackingController.getCustomerMonthlySummary(req, mockRes);

        expect(mockRes.json).toHaveBeenCalledWith({ success: true, data: { total: 40 } });
    });

    it('should return error if required fields are missing for manual tracking', async () => {
        const req = {
            user: { userId: 1 },
            body: {
                customer_id: 1, // missing project_id, task_id, etc.
                note: 'Incomplete entry'
            }
        };

        await timeTrackingController.addManualTracking(req, mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'All fields are required.' });
    });

    it('should return error when updating with missing fields', async () => {
        const req = {
            params: { id: 123 },
            user: { userId: 1, role: 'admin' },
            body: {
                // missing required fields
                note: 'Invalid update'
            }
        };

        await timeTrackingController.updateTracking(req, mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: 'Missing required fields.' });
    });

    it('should return error if no active session exists when stopping', async () => {
        timeTrackingModel.getActiveTracking.mockResolvedValue(null);

        const req = {
            user: { userId: 1 },
            body: { id: 1, project_id: 2, task_id: 3, customer_id: 4 }
        };

        await timeTrackingController.stopTracking(req, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith({ success: false, message: expect.stringContaining('No active tracking') });
    });
});
