jest.mock('../src/models/Board', () => ({
    create: jest.fn(),
}));

jest.mock('../src/services/notificationService', () => ({
    createBulkNotifications: jest.fn(),
}));

const Board = require('../src/models/Board');
const { createBulkNotifications } = require('../src/services/notificationService');
const boardController = require('../src/controllers/boardController');

function createResponse() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

describe('boardController notification hook', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('notifies non-creator members when a board is created', async () => {
        Board.create.mockResolvedValue({
            _id: 'board-001',
            name: 'Alpha Team',
            members: [
                { id: 'user-001', name: 'Creator', email: 'creator@test.com' },
                { id: 'user-002', name: 'Teammate', email: 'teammate@test.com' },
            ],
        });
        const req = {
            body: {
                name: 'Alpha Team',
                members: [
                    { id: 'user-001', name: 'Creator', email: 'creator@test.com' },
                    { id: 'user-002', name: 'Teammate', email: 'teammate@test.com' },
                ],
            },
            user: { id: 'user-001', name: 'Creator', email: 'creator@test.com' },
            headers: { authorization: 'Bearer token-123' },
        };
        const res = createResponse();

        await boardController.createBoard(req, res);

        expect(createBulkNotifications).toHaveBeenCalledWith(
            [
                expect.objectContaining({
                    type: 'team_update',
                    recipientId: 'user-002',
                }),
            ],
            'token-123'
        );
        expect(res.status).toHaveBeenCalledWith(201);
    });
});