const Board = require('../models/Board');
const { validationResult } = require('express-validator');
const { createBulkNotifications } = require('../services/notificationService');

// ─── Helper ────────────────────────────────────────────────────────────────────
function handleValidationErrors(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }
    return null;
}

// ─── GET /api/boards ──────────────────────────────────────────────────────────
const getAllBoards = async (req, res) => {
    try {
        const userId = req.user?.id || 'system';
        
        // Get boards where user is creator or member
        const boards = await Board.find({
            $or: [
                { 'createdBy.id': userId },
                { 'members.id': userId }
            ]
        }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: boards.length,
            boards,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── GET /api/boards/:id ──────────────────────────────────────────────────────
const getBoardById = async (req, res) => {
    try {
        const board = await Board.findById(req.params.id);

        if (!board) {
            return res.status(404).json({ success: false, message: 'Board not found.' });
        }

        // Check if user has access
        const userId = req.user?.id || 'system';
        const hasAccess = board.createdBy.id === userId || 
                         board.members.some(m => m.id === userId);

        if (!hasAccess) {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }

        res.status(200).json({ success: true, board });
    } catch (error) {
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ success: false, message: 'Invalid board ID.' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── POST /api/boards ─────────────────────────────────────────────────────────
const createBoard = async (req, res) => {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return;

    try {
        const { name, description, sprint, members } = req.body;
        const user = req.user || { id: 'system', name: 'System', email: 'system@example.com' };
        const authToken = req.headers.authorization?.split(' ')[1] || null;

        const board = await Board.create({
            name,
            description: description || '',
            sprint: sprint || 'Sprint 1',
            members: members || [],
            createdBy: {
                id: user.id,
                name: user.name,
                email: user.email,
                avatar: user.avatar || null,
            },
        });

        const recipients = (board.members || []).filter((member) => member.id !== user.id);
        if (recipients.length > 0) {
            try {
                await createBulkNotifications(
                    recipients.map((member) => ({
                        type: 'team_update',
                        title: `Added to team: ${board.name}`,
                        message: `${user.name} added you to the team ${board.name}.`,
                        recipientId: member.id,
                        priority: 'medium',
                        metadata: {
                            boardId: board._id.toString(),
                            boardName: board.name,
                            createdBy: user.id,
                            createdByName: user.name,
                            recipientEmail: member.email || null,
                        },
                    })),
                    authToken,
                );
            } catch (error) {
                console.error(`Failed to send board creation notifications for board ${board._id}: ${error.message}`);
            }
        }

        res.status(201).json({ 
            success: true, 
            message: 'Board created successfully.', 
            board 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── PUT /api/boards/:id ──────────────────────────────────────────────────────
const updateBoard = async (req, res) => {
    try {
        const { name, description, sprint, members } = req.body;
        const board = await Board.findById(req.params.id);

        if (!board) {
            return res.status(404).json({ success: false, message: 'Board not found.' });
        }

        // Check if user is creator
        const userId = req.user?.id || 'system';
        if (board.createdBy.id !== userId) {
            return res.status(403).json({ success: false, message: 'Only board creator can update it.' });
        }

        if (name !== undefined) board.name = name;
        if (description !== undefined) board.description = description;
        if (sprint !== undefined) board.sprint = sprint;
        if (members !== undefined) board.members = members;

        await board.save();

        res.status(200).json({ 
            success: true, 
            message: 'Board updated successfully.', 
            board 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── DELETE /api/boards/:id ───────────────────────────────────────────────────
const deleteBoard = async (req, res) => {
    try {
        const board = await Board.findById(req.params.id);

        if (!board) {
            return res.status(404).json({ success: false, message: 'Board not found.' });
        }

        // Check if user is creator
        const userId = req.user?.id || 'system';
        if (board.createdBy.id !== userId) {
            return res.status(403).json({ success: false, message: 'Only board creator can delete it.' });
        }

        // Permanently delete from database
        await Board.findByIdAndDelete(req.params.id);

        res.status(200).json({ 
            success: true, 
            message: 'Board deleted successfully.' 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── POST /api/boards/:id/members ─────────────────────────────────────────────
const addMember = async (req, res) => {
    try {
        const { member } = req.body; // { id, name, email, avatar }
        const board = await Board.findById(req.params.id);

        if (!board) {
            return res.status(404).json({ success: false, message: 'Board not found.' });
        }

        // Check if user is creator or admin
        const userId = req.user?.id || 'system';
        const isCreator = board.createdBy.id === userId;
        const isAdmin = board.members.some(m => m.id === userId && m.role === 'admin');

        if (!isCreator && !isAdmin) {
            return res.status(403).json({ success: false, message: 'Only admins can add members.' });
        }

        // Check if member already exists
        const exists = board.members.some(m => m.id === member.id);
        if (exists) {
            return res.status(400).json({ success: false, message: 'User is already a member.' });
        }

        board.members.push({
            id: member.id,
            name: member.name,
            email: member.email,
            role: member.role || 'member',
            avatar: member.avatar || null,
        });

        await board.save();

        res.status(200).json({ 
            success: true, 
            message: 'Member added successfully.', 
            board 
        });
    } catch (error) {
        if (error.kind === 'ObjectId' || error.name === 'CastError') {
            return res.status(400).json({ success: false, message: 'Invalid board ID.' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── DELETE /api/boards/:id/members/:memberId ─────────────────────────────────
const removeMember = async (req, res) => {
    try {
        const { memberId } = req.params;
        const board = await Board.findById(req.params.id);

        if (!board) {
            return res.status(404).json({ success: false, message: 'Board not found.' });
        }

        // Check if user is creator or admin
        const userId = req.user?.id || 'system';
        const isCreator = board.createdBy.id === userId;
        const isAdmin = board.members.some(m => m.id === userId && m.role === 'admin');

        if (!isCreator && !isAdmin) {
            return res.status(403).json({ success: false, message: 'Only admins can remove members.' });
        }

        board.members = board.members.filter(m => m.id !== memberId);
        await board.save();

        res.status(200).json({ 
            success: true, 
            message: 'Member removed successfully.', 
            board 
        });
    } catch (error) {
        if (error.kind === 'ObjectId' || error.name === 'CastError') {
            return res.status(400).json({ success: false, message: 'Invalid board ID.' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getAllBoards,
    getBoardById,
    createBoard,
    updateBoard,
    deleteBoard,
    addMember,
    removeMember,
};
