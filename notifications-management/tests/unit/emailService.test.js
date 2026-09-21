/**
 * Unit tests for EmailService.
 * The nodemailer transporter and emailTemplates module are both mocked so
 * these tests run fully offline with no SMTP connection.
 */

// Mock the transporter module — by default no transporter (SMTP not configured)
jest.mock('../../src/config/emailConfig', () => null);

// Mock the template builder
jest.mock('../../src/utils/emailTemplates', () => ({
    buildEmailPayload: jest.fn().mockReturnValue({
        subject: 'Test Subject',
        html: '<p>Test</p>',
        text: 'Test',
    }),
}));

const { buildEmailPayload } = require('../../src/utils/emailTemplates');

describe('EmailService', () => {
    let sendNotificationEmail;

    // Re-require after each mock override so module state is fresh
    beforeEach(() => {
        jest.resetModules();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('when SMTP is not configured (transporter is null)', () => {
        beforeEach(() => {
            jest.mock('../../src/config/emailConfig', () => null);
            ({ sendNotificationEmail } = require('../../src/services/emailService'));
        });

        it('should return without error when transporter is null', async () => {
            const notification = {
                _id: 'n1',
                type: 'task_assigned',
                title: 'Test',
                message: 'Msg',
                recipientId: 'u1',
                metadata: { recipientEmail: 'user@example.com' },
            };

            await expect(sendNotificationEmail(notification)).resolves.toBeUndefined();
        });

        it('should not call buildEmailPayload when transporter is null', async () => {
            const notification = {
                _id: 'n1',
                type: 'task_assigned',
                title: 'Test',
                message: 'Msg',
                recipientId: 'u1',
                metadata: { recipientEmail: 'user@example.com' },
            };

            await sendNotificationEmail(notification);

            expect(buildEmailPayload).not.toHaveBeenCalled();
        });
    });

    describe('when SMTP is configured (transporter available)', () => {
        const mockSendMail = jest.fn().mockResolvedValue({ messageId: 'msg-001' });

        beforeEach(() => {
            jest.mock('../../src/config/emailConfig', () => ({
                sendMail: mockSendMail,
            }));
            jest.resetModules();
            jest.mock('../../src/config/emailConfig', () => ({
                sendMail: mockSendMail,
            }));
            jest.mock('../../src/utils/emailTemplates', () => ({
                buildEmailPayload: jest.fn().mockReturnValue({
                    subject: 'You have been assigned',
                    html: '<p>You were assigned</p>',
                    text: 'You were assigned',
                }),
            }));
            ({ sendNotificationEmail } = require('../../src/services/emailService'));
        });

        it('should call transporter.sendMail with correct fields', async () => {
            const notification = {
                _id: 'n2',
                type: 'task_assigned',
                title: 'New task assigned: Fix Bug',
                message: 'Alice assigned you to "Fix Bug".',
                recipientId: 'u1',
                metadata: { recipientEmail: 'bob@example.com' },
            };

            await sendNotificationEmail(notification);

            expect(mockSendMail).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: 'bob@example.com',
                    subject: 'You have been assigned',
                })
            );
        });

        it('should skip sending when recipientEmail is missing', async () => {
            const notification = {
                _id: 'n3',
                type: 'task_assigned',
                title: 'New task',
                message: 'Msg',
                recipientId: 'u1',
                metadata: {},
            };

            await sendNotificationEmail(notification);

            expect(mockSendMail).not.toHaveBeenCalled();
        });

        it('should not throw when sendMail rejects', async () => {
            mockSendMail.mockRejectedValueOnce(new Error('SMTP connection failed'));
            const notification = {
                _id: 'n4',
                type: 'deadline_reminder',
                title: 'Deadline',
                message: 'Task is overdue',
                recipientId: 'u1',
                metadata: { recipientEmail: 'carol@example.com' },
            };

            await expect(sendNotificationEmail(notification)).resolves.toBeUndefined();
        });
    });
});
