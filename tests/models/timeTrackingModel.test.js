const model = require('../../features/time-tracking/timeTrackingModel');
const { Pool } = require('pg');

jest.mock('pg', () => {
    const mockQuery = jest.fn();
    return {
        Pool: jest.fn(() => ({
            query: mockQuery
        })),
        __mockQuery: mockQuery
    };
});

const { __mockQuery } = require('pg');

describe('timeTrackingModel unit tests (mocked pg)', () => {
    beforeEach(() => {
        __mockQuery.mockReset();
    });

    it('startTimeTracking inserts a new entry', async () => {
        const mockResult = { id: 1, user_id: 1, note: 'work' };
        __mockQuery.mockResolvedValue({ rows: [mockResult] });
        const result = await model.startTimeTracking(1, 'work');
        expect(result).toEqual(mockResult);
    });

    it('stopTimeTracking updates and returns a session', async () => {
        const mockResult = { id: 2, end_time: 'now' };
        __mockQuery.mockResolvedValue({ rows: [mockResult] });
        const result = await model.stopTimeTracking(2, 1, 3, 4, 5);
        expect(result).toEqual(mockResult);
    });

    it('getActiveTracking fetches the latest active session', async () => {
        const active = { id: 3, user_id: 1 };
        __mockQuery.mockResolvedValue({ rows: [active] });
        const result = await model.getActiveTracking(1);
        expect(result).toEqual(active);
    });

    it('getUserTimeEntries returns entries for a user', async () => {
        const entries = [{ id: 1 }, { id: 2 }];
        __mockQuery.mockResolvedValue({ rows: entries });
        const result = await model.getUserTimeEntries(1);
        expect(result).toEqual(entries);
    });

    it('getAssignedCustomers returns customer list', async () => {
        const customers = [{ id: 1, name: 'Client A' }];
        __mockQuery.mockResolvedValue({ rows: customers });
        const result = await model.getAssignedCustomers(1);
        expect(result).toEqual(customers);
    });

    it('getAllTimeTracking returns rows based on isAdmin', async () => {
        const rows = [{ id: 1 }];
        __mockQuery.mockResolvedValue({ rows });
        const resultAdmin = await model.getAllTimeTracking(1, true);
        const resultUser = await model.getAllTimeTracking(1, false);
        expect(resultAdmin).toEqual(rows);
        expect(resultUser).toEqual(rows);
    });

    it('getAllActiveTracking returns sessions for admin/user', async () => {
        const rows = [{ id: 1 }];
        __mockQuery.mockResolvedValue({ rows });
        const resultAdmin = await model.getAllActiveTracking(1, true);
        const resultUser = await model.getAllActiveTracking(1, false);
        expect(resultAdmin).toEqual(rows);
        expect(resultUser).toEqual(rows);
    });

    it('addManualTracking inserts and returns tracking row', async () => {
        const tracking = { id: 9 };
        __mockQuery.mockResolvedValue({ rows: [tracking] });
        const result = await model.addManualTracking(1, 2, 3, 4, '2024-01-01T00:00', '2024-01-01T01:00', 1, 0, 'note');
        expect(result).toEqual(tracking);
    });

    it('deleteTracking removes row for admin', async () => {
        const deleted = { id: 7 };
        __mockQuery.mockResolvedValue({ rows: [deleted], rowCount: 1 });
        const result = await model.deleteTracking(7, 1, true);
        expect(result).toEqual(deleted);
    });

    it('deleteTracking fails if nothing deleted', async () => {
        __mockQuery.mockResolvedValue({ rows: [], rowCount: 0 });
        await expect(model.deleteTracking(7, 1, false)).rejects.toThrow('Delete failed or unauthorized.');
    });

    it('updateTracking updates if allowed', async () => {
        const updated = { id: 10 };
        __mockQuery.mockResolvedValue({ rows: [updated], rowCount: 1 });
        const result = await model.updateTracking(10, 1, false, 'start', 1, 30, 2, 3, 4, 'note');
        expect(result).toEqual(updated);
    });

    it('updateTracking throws if no row updated', async () => {
        __mockQuery.mockResolvedValue({ rows: [], rowCount: 0 });
        await expect(model.updateTracking(10, 1, false, 'start', 1, 30, 2, 3, 4, 'note')).rejects.toThrow('Update failed or unauthorized.');
    });

    it('getMonthlyTrackingSummaryForCustomer returns summary', async () => {
        const summary = [{ month: '2024-01-01', total_hours: 10, hourly_fee: 100 }];
        __mockQuery.mockResolvedValue({ rows: summary });
        const result = await model.getMonthlyTrackingSummaryForCustomer(1);
        expect(result).toEqual(summary);
    });
});
