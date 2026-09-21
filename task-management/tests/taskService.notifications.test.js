jest.mock('../src/models/Task', () => {
    const Task = jest.fn();
    Task.findById = jest.fn();
    return Task;
});

jest.mock('../src/services/notificationService', () => ({
    createNotification: jest.fn(),
    createBulkNotifications: jest.fn(),
}));

const Task = require('../src/models/Task');
const { createNotification, createBulkNotifications } = require('../src/services/notificationService');
const taskService = require('../src/services/taskService');

describe('taskService notification hooks', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('sends assignment notifications for initial assignees during task creation', async () => {
        const savedTask = {
            _id: 'task-001',
            title: 'Build notifications integration',
            priority: 'high',
            board: null,
            deadline: null,
            assignees: [
                { id: 'user-002', name: 'Teammate One' },
                { id: 'user-003', name: 'Teammate Two' },
            ],
        };
        const save = jest.fn().mockResolvedValue(savedTask);
        Task.mockImplementation((data) => ({ ...data, _id: 'task-001', save }));

        await taskService.createTask(
            {
                title: 'Build notifications integration',
                assignees: savedTask.assignees,
                activity: [],
            },
            { id: 'user-001', name: 'Creator', email: 'creator@test.com' },
            'token-123'
        );

        expect(createBulkNotifications).toHaveBeenCalledTimes(1);
        expect(createBulkNotifications).toHaveBeenCalledWith(
            expect.arrayContaining([
                expect.objectContaining({ recipientId: 'user-002', type: 'task_assigned' }),
                expect.objectContaining({ recipientId: 'user-003', type: 'task_assigned' }),
                expect.objectContaining({ recipientId: 'user-001', type: 'task_assigned' }),
            ]),
            'token-123'
        );
    });

    it('includes recipientEmail in the notification metadata for assignees', async () => {
        const savedTask = {
            _id: 'task-002',
            title: 'Build email feature',
            priority: 'medium',
            board: null,
            deadline: null,
            assignees: [
                { id: 'user-002', name: 'Teammate One', email: 'teammate1@test.com' },
            ],
        };
        const save = jest.fn().mockResolvedValue(savedTask);
        Task.mockImplementation((data) => ({ ...data, _id: 'task-002', save }));

        await taskService.createTask(
            {
                title: 'Build email feature',
                assignees: savedTask.assignees,
                activity: [],
            },
            { id: 'user-001', name: 'Creator', email: 'creator@test.com' },
            'token-xyz'
        );

        expect(createBulkNotifications).toHaveBeenCalledWith(
            expect.arrayContaining([
                expect.objectContaining({
                    recipientId: 'user-002',
                    metadata: expect.objectContaining({ recipientEmail: 'teammate1@test.com' }),
                }),
                expect.objectContaining({
                    recipientId: 'user-001',
                    metadata: expect.objectContaining({ recipientEmail: 'creator@test.com' }),
                }),
            ]),
            'token-xyz'
        );
    });

    it('sends a notification when an assignee is added later', async () => {
        const task = {
            _id: 'task-001',
            title: 'Build notifications integration',
            priority: 'medium',
            board: null,
            deadline: null,
            assignees: [],
            activity: [],
            save: jest.fn().mockResolvedValue({
                _id: 'task-001',
                title: 'Build notifications integration',
                priority: 'medium',
                board: null,
                deadline: null,
                assignees: [{ id: 'user-002', name: 'Teammate One', email: 'teammate@test.com' }],
                activity: [],
            }),
        };
        Task.findById.mockResolvedValue(task);

        await taskService.addAssignee(
            'task-001',
            { id: 'user-002', name: 'Teammate One', email: 'teammate@test.com' },
            { id: 'user-001', name: 'Creator' },
            'token-123'
        );

        expect(createNotification).toHaveBeenCalledTimes(2);
        expect(createNotification).toHaveBeenCalledWith(
            expect.objectContaining({ recipientId: 'user-002', type: 'task_assigned' }),
            'token-123'
        );
        expect(createNotification).toHaveBeenCalledWith(
            expect.objectContaining({ recipientId: 'user-001', type: 'task_assigned' }),
            'token-123'
        );
    });
});