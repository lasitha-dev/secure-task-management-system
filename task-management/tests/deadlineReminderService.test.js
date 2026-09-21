jest.mock('../src/models/Task', () => ({
    find: jest.fn(),
}));

jest.mock('../src/services/notificationService', () => ({
    createNotification: jest.fn(),
}));

const Task = require('../src/models/Task');
const { createNotification } = require('../src/services/notificationService');
const {
    REMINDER_TYPES,
    resolveReminderType,
    runDeadlineReminderCycle,
} = require('../src/services/deadlineReminderService');

describe('deadlineReminderService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('resolveReminderType', () => {
        it('returns 48-hour reminder when due within 48 hours but not 24 hours', () => {
            const now = new Date('2026-03-08T10:00:00.000Z');
            const deadline = new Date('2026-03-10T09:00:00.000Z');

            expect(resolveReminderType(deadline, now)).toBe(REMINDER_TYPES.DUE_IN_48_HOURS);
        });

        it('returns 24-hour reminder when due within 24 hours', () => {
            const now = new Date('2026-03-08T10:00:00.000Z');
            const deadline = new Date('2026-03-09T08:00:00.000Z');

            expect(resolveReminderType(deadline, now)).toBe(REMINDER_TYPES.DUE_IN_24_HOURS);
        });

        it('returns overdue when deadline has passed', () => {
            const now = new Date('2026-03-08T10:00:00.000Z');
            const deadline = new Date('2026-03-08T09:59:00.000Z');

            expect(resolveReminderType(deadline, now)).toBe(REMINDER_TYPES.OVERDUE);
        });
    });

    describe('runDeadlineReminderCycle', () => {
        it('sends one reminder and records a dispatch entry', async () => {
            const save = jest.fn().mockResolvedValue(undefined);
            Task.find.mockResolvedValue([
                {
                    _id: 'task-123',
                    title: 'Prepare demo',
                    deadline: new Date('2026-03-09T08:00:00.000Z'),
                    status: 'in_progress',
                    board: null,
                    assignees: [{ id: 'user_002', name: 'Teammate' }],
                    notificationDispatches: [],
                    save,
                },
            ]);
            createNotification.mockResolvedValue({ _id: 'notif-1' });

            const result = await runDeadlineReminderCycle('token-123', new Date('2026-03-08T10:00:00.000Z'));

            expect(createNotification).toHaveBeenCalledTimes(1);
            expect(createNotification).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'deadline_reminder',
                    recipientId: 'user_002',
                }),
                'token-123'
            );
            expect(save).toHaveBeenCalledTimes(1);
            expect(result).toEqual({ scannedTasks: 1, notificationsSent: 1 });
        });

        it('does not resend a reminder that was already dispatched', async () => {
            const save = jest.fn().mockResolvedValue(undefined);
            Task.find.mockResolvedValue([
                {
                    _id: 'task-123',
                    title: 'Prepare demo',
                    deadline: new Date('2026-03-09T08:00:00.000Z'),
                    status: 'in_progress',
                    board: null,
                    assignees: [{ id: 'user_002', name: 'Teammate' }],
                    notificationDispatches: [
                        {
                            key: 'due_in_24_hours:user_002:2026-03-09T08:00:00.000Z',
                            type: 'due_in_24_hours',
                            recipientId: 'user_002',
                        },
                    ],
                    save,
                },
            ]);

            const result = await runDeadlineReminderCycle('token-123', new Date('2026-03-08T10:00:00.000Z'));

            expect(createNotification).not.toHaveBeenCalled();
            expect(save).toHaveBeenCalledTimes(1);
            expect(result).toEqual({ scannedTasks: 1, notificationsSent: 0 });
        });
    });
});