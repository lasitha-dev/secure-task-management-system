const syncService = require('../../src/services/syncService');
const TasksMirror = require('../../src/models/TasksMirror');
const axios = require('axios');

jest.mock('../../src/models/TasksMirror');
jest.mock('axios');

describe('Sync Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('syncTasksFromExternal', () => {
        it('should sync tasks successfully via API fetch', async () => {
            TasksMirror.deleteMany = jest.fn().mockResolvedValue({});
            TasksMirror.updateOne = jest.fn().mockResolvedValue({});
            
            axios.get.mockResolvedValue({
                data: {
                    data: [
                         { _id: '1', title: 'Task 1', status: 'done', assignedTo: { _id: 'u1', name: 'User 1' }, createdAt: new Date() },
                         { _id: '2', title: 'Task 2', status: 'todo', assignedTo: 'u2', createdAt: new Date() }
                    ]
                }
            });

            const result = await syncService.syncTasksFromExternal();

            expect(result.success).toBe(true);
            expect(result.count).toBe(2);
            expect(TasksMirror.deleteMany).toHaveBeenCalled();
            expect(TasksMirror.updateOne).toHaveBeenCalledTimes(2);
        });

        it('should handle invalid data format gracefully', async () => {
            axios.get.mockResolvedValue({ data: { data: 'not an array' } });

            const result = await syncService.syncTasksFromExternal();

            expect(result.success).toBe(false);
            expect(result.message).toMatch(/Invalid data format/);
        });

        it('should handle API errors gracefully', async () => {
            axios.get.mockRejectedValue(new Error('Network Error'));

            const result = await syncService.syncTasksFromExternal();

            expect(result.success).toBe(false);
            expect(result.message).toMatch(/Network Error/);
        });
        
        it('should handle DB errors gracefully', async () => {
            axios.get.mockResolvedValue({ data: { data: [] } });
            TasksMirror.deleteMany = jest.fn().mockRejectedValue(new Error('DB Error'));

            const result = await syncService.syncTasksFromExternal();

            expect(result.success).toBe(false);
            expect(result.message).toMatch(/DB Error/);
        });
    });
});
