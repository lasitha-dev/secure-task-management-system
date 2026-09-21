const NotificationController = require('../../src/controllers/notificationController');

/**
 * Unit tests for NotificationController.
 * Tests request/response handling with a mocked service layer.
 */

// --- Mock Helpers ---
const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

const mockNext = jest.fn();

describe('NotificationController', () => {
    let controller;
    let service;

    beforeEach(() => {
        service = {
            getAllNotifications: jest.fn(),
            getNotificationById: jest.fn(),
            createNotification: jest.fn(),
            markAsRead: jest.fn(),
            markAllAsRead: jest.fn(),
            deleteNotification: jest.fn(),
            getUnreadCount: jest.fn(),
            getPreferences: jest.fn(),
            updatePreferences: jest.fn(),
        };
        controller = new NotificationController(service);
    });

    afterEach(() => jest.clearAllMocks());

    // -------------------------------------------------------------------------
    // getNotifications
    // -------------------------------------------------------------------------
    describe('getNotifications', () => {
        it('should return 200 with notifications', async () => {
            const data = { notifications: [{ _id: '1' }], pagination: { total: 1, page: 1, limit: 20, pages: 1 } };
            service.getAllNotifications.mockResolvedValue(data);
            const req = { query: {}, user: { id: 'user_001' } };
            const res = mockRes();

            await controller.getNotifications(req, res, mockNext);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data }));
        });

        it('should parse isRead query string to boolean', async () => {
            service.getAllNotifications.mockResolvedValue({ notifications: [], pagination: {} });
            const req = { query: { isRead: 'false' }, user: { id: 'user_001' } };
            const res = mockRes();

            await controller.getNotifications(req, res, mockNext);

            expect(service.getAllNotifications).toHaveBeenCalledWith(
                expect.objectContaining({ recipientId: 'user_001', isRead: false })
            );
        });

        it('should reject attempts to query another user recipientId', async () => {
            const req = { query: { recipientId: 'user_999' }, user: { id: 'user_001' } };
            const res = mockRes();

            await controller.getNotifications(req, res, mockNext);

            expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
        });

        it('should call next on error', async () => {
            service.getAllNotifications.mockRejectedValue(new Error('DB error'));
            const req = { query: {}, user: { id: 'user_001' } };
            const res = mockRes();

            await controller.getNotifications(req, res, mockNext);

            expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
        });
    });

    // -------------------------------------------------------------------------
    // getNotificationById
    // -------------------------------------------------------------------------
    describe('getNotificationById', () => {
        it('should return 200 with a notification', async () => {
            service.getNotificationById.mockResolvedValue({ _id: 'abc', title: 'Test' });
            const req = { params: { id: 'abc' }, user: { id: 'user_001' } };
            const res = mockRes();

            await controller.getNotificationById(req, res, mockNext);

            expect(service.getNotificationById).toHaveBeenCalledWith('abc', 'user_001');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });

        it('should delegate errors to next', async () => {
            const error = new Error('Not found');
            error.statusCode = 404;
            service.getNotificationById.mockRejectedValue(error);
            const req = { params: { id: 'missing' }, user: { id: 'user_001' } };
            const res = mockRes();

            await controller.getNotificationById(req, res, mockNext);

            expect(mockNext).toHaveBeenCalledWith(error);
        });
    });

    // -------------------------------------------------------------------------
    // createNotification
    // -------------------------------------------------------------------------
    describe('createNotification', () => {
        it('should return 201 when notification is created', async () => {
            const created = { _id: 'new', title: 'New Notif' };
            service.createNotification.mockResolvedValue(created);
            const req = { body: { type: 'task_assigned', title: 'New', message: 'Msg', recipientId: 'u1' }, user: { id: 'user_001' } };
            const res = mockRes();

            await controller.createNotification(req, res, mockNext);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: created }));
        });
    });

    // -------------------------------------------------------------------------
    // markAsRead
    // -------------------------------------------------------------------------
    describe('markAsRead', () => {
        it('should return 200 with updated notification', async () => {
            service.markAsRead.mockResolvedValue({ _id: 'abc', isRead: true });
            const req = { params: { id: 'abc' }, user: { id: 'user_001' } };
            const res = mockRes();

            await controller.markAsRead(req, res, mockNext);

            expect(service.markAsRead).toHaveBeenCalledWith('abc', 'user_001');
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

    // -------------------------------------------------------------------------
    // markAllAsRead
    // -------------------------------------------------------------------------
    describe('markAllAsRead', () => {
        it('should return 200 with modified count', async () => {
            service.markAllAsRead.mockResolvedValue({ modifiedCount: 3 });
            const req = { body: { recipientId: 'user_001' }, user: { id: 'user_001' } };
            const res = mockRes();

            await controller.markAllAsRead(req, res, mockNext);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ data: { modifiedCount: 3 } })
            );
        });

        it('should reject mark-all attempts for another user', async () => {
            const req = { body: { recipientId: 'user_999' }, user: { id: 'user_001' } };
            const res = mockRes();

            await controller.markAllAsRead(req, res, mockNext);

            expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
        });
    });

    // -------------------------------------------------------------------------
    // deleteNotification
    // -------------------------------------------------------------------------
    describe('deleteNotification', () => {
        it('should return 200 on successful delete', async () => {
            service.deleteNotification.mockResolvedValue({ _id: 'abc' });
            const req = { params: { id: 'abc' }, user: { id: 'user_001' } };
            const res = mockRes();

            await controller.deleteNotification(req, res, mockNext);

            expect(service.deleteNotification).toHaveBeenCalledWith('abc', 'user_001');
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

    // -------------------------------------------------------------------------
    // getUnreadCount
    // -------------------------------------------------------------------------
    describe('getUnreadCount', () => {
        it('should return 200 with unread count', async () => {
            service.getUnreadCount.mockResolvedValue({ count: 5 });
            const req = { query: { recipientId: 'user_001' }, user: { id: 'user_001' } };
            const res = mockRes();

            await controller.getUnreadCount(req, res, mockNext);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ data: { count: 5 } })
            );
        });

        it('should reject unread-count requests for another user', async () => {
            const req = { query: { recipientId: 'user_999' }, user: { id: 'user_001' } };
            const res = mockRes();

            await controller.getUnreadCount(req, res, mockNext);

            expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
        });
    });

    // -------------------------------------------------------------------------
    // getPreferences / updatePreferences
    // -------------------------------------------------------------------------
    describe('getPreferences', () => {
        it('should return 200 with user preferences', async () => {
            service.getPreferences.mockResolvedValue({ userId: 'u1', emailEnabled: true });
            const req = { params: { userId: 'u1' }, user: { id: 'u1' } };
            const res = mockRes();

            await controller.getPreferences(req, res, mockNext);

            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

    describe('updatePreferences', () => {
        it('should return 200 with updated preferences', async () => {
            service.updatePreferences.mockResolvedValue({ userId: 'u1', emailEnabled: false });
            const req = { params: { userId: 'u1' }, body: { emailEnabled: false }, user: { id: 'u1' } };
            const res = mockRes();

            await controller.updatePreferences(req, res, mockNext);

            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should reject preference updates for another user', async () => {
            const req = { params: { userId: 'u2' }, body: { emailEnabled: false }, user: { id: 'u1' } };
            const res = mockRes();

            await controller.updatePreferences(req, res, mockNext);

            expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
        });
    });
});
