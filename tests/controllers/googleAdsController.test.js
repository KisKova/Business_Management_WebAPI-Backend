const googleAdsController = require('../../features/google-ads/googleAdsController');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

jest.mock('fs');
jest.mock('path');
jest.mock('pdfkit');

jest.mock('google-ads-api', () => {
    const queryMockFn = jest.fn();
    return {
        GoogleAdsApi: jest.fn().mockImplementation(() => ({
            Customer: jest.fn(() => ({
                query: queryMockFn
            }))
        })),
        __esModule: true,
        __queryMock: queryMockFn // expose for access in tests
    };
});

const { __queryMock: queryMock } = require('google-ads-api');

global.rootCustomerId = 'test-root-id';
global.refreshToken = 'test-refresh-token';

describe('Google Ads Controller', () => {
    let mockRes;

    beforeEach(() => {
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            download: jest.fn((filePath, fileName, cb) => cb())
        };
        fs.createWriteStream.mockReturnValue({
            on: jest.fn((event, cb) => event === 'finish' && cb()),
            write: jest.fn(),
            end: jest.fn(),
            pipe: jest.fn()
        });
        fs.unlinkSync.mockReturnValue();
        path.join.mockImplementation((...args) => args.join('/'));
        PDFDocument.mockImplementation(() => ({
            pipe: jest.fn(),
            end: jest.fn(),
            image: jest.fn(),
            moveDown: jest.fn().mockReturnThis(),
            font: jest.fn().mockReturnThis(),
            fontSize: jest.fn().mockReturnThis(),
            fillColor: jest.fn().mockReturnThis(),
            text: jest.fn().mockReturnThis(),
            table: jest.fn()
        }));
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should return 400 if customerId or month is missing', async () => {
        const req = { body: { customerName: 'TestCustomer' } };
        await googleAdsController.createReport(req, mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'Missing customerId' });
    });

    it('should generate and send a report when valid data is provided', async () => {
        const fakeResults = [
            {
                campaign: { name: 'Campaign 1' },
                metrics: {
                    clicks: 100,
                    impressions: 1000,
                    ctr: 0.1,
                    average_cpc: 1000000,
                    cost_micros: 2000000,
                    conversions: 5,
                    cost_per_conversion: 400000,
                    conversions_from_interactions_rate: 0.05
                }
            }
        ];

        queryMock.mockResolvedValue(fakeResults);

        const req = {
            body: {
                customerId: '123-456-7890',
                customerName: 'TestCustomer',
                month: '2024-05'
            }
        };

        await googleAdsController.createReport(req, mockRes);

        expect(mockRes.download).toHaveBeenCalled();
        expect(fs.unlinkSync).toHaveBeenCalled();
    });

    it('should return 500 if res.download fails', async () => {
        const results = [
            {
                campaign: { name: 'Campaign 1' },
                metrics: {
                    clicks: 10,
                    impressions: 100,
                    ctr: 0.1,
                    average_cpc: 1000000,
                    cost_micros: 2000000,
                    conversions: 1,
                    cost_per_conversion: 2000000,
                    conversions_from_interactions_rate: 0.01
                }
            }
        ];

        queryMock.mockResolvedValue(results);

        mockRes.download = jest.fn((filePath, fileName, cb) => cb(new Error('fail')));

        const req = {
            body: {
                customerId: '456',
                customerName: 'FailingCustomer',
                month: '2024-06'
            }
        };

        await googleAdsController.createReport(req, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'Failed to send PDF' });
    });

    it('should handle errors and return 500', async () => {
        queryMock.mockImplementation(() => { throw new Error('Broken query'); });

        const req = {
            body: {
                customerId: '123',
                customerName: 'BrokenCustomer',
                month: '2024-05'
            }
        };

        await googleAdsController.createReport(req, mockRes);
        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'Failed to generate report' });
    });

    it('should return account list from Google Ads', async () => {
        queryMock.mockResolvedValue([
            {
                customer_client: {
                    client_customer: 'customers/1234567890',
                    descriptive_name: 'Test Account',
                    manager: false,
                    level: 1
                }
            }
        ]);

        const req = { user: {} };
        await googleAdsController.getAllAccounts(req, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
            success: true,
            data: [{ id: '1234567890', name: 'Test Account' }]
        });
    });

    it('should use all format helpers in PDF generation (cover formatNumber/Percent/Ft)', async () => {
        const results = [
            {
                campaign: { name: 'Campaign A' },
                metrics: {
                    clicks: 200,
                    impressions: 4000,
                    ctr: 0.05,
                    average_cpc: 1234567,
                    cost_micros: 7890000,
                    conversions: 0, // triggers fallback
                    cost_per_conversion: null,
                    conversions_from_interactions_rate: 0.005
                }
            },
            {
                campaign: { name: 'Campaign B' },
                metrics: {
                    clicks: 75,
                    impressions: 1500,
                    ctr: 0.075,
                    average_cpc: 654321,
                    cost_micros: 1234000,
                    conversions: 3,
                    cost_per_conversion: 411111,
                    conversions_from_interactions_rate: 0.09
                }
            }
        ];

        queryMock.mockResolvedValue(results);

        const req = {
            body: {
                customerId: '999',
                customerName: 'CoverageCustomer',
                month: '2024-04'
            }
        };

        await googleAdsController.createReport(req, mockRes);

        expect(mockRes.download).toHaveBeenCalled();
        expect(fs.unlinkSync).toHaveBeenCalled();
    });

});
