const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const boardController = require('../controllers/boardController');
const { protect } = require('../middleware/auth');

// Validation rules
const createBoardValidation = [
    body('name').trim().notEmpty().withMessage('Board name is required')
        .isLength({ max: 100 }).withMessage('Board name cannot exceed 100 characters'),
    body('description').optional().trim()
        .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
    body('sprint').optional().trim()
        .isLength({ max: 50 }).withMessage('Sprint cannot exceed 50 characters'),
    body('members').optional().isArray().withMessage('Members must be an array'),
];

const updateBoardValidation = [
    body('name').optional().trim().notEmpty().withMessage('Board name cannot be empty')
        .isLength({ max: 100 }).withMessage('Board name cannot exceed 100 characters'),
    body('description').optional().trim()
        .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
    body('sprint').optional().trim()
        .isLength({ max: 50 }).withMessage('Sprint cannot exceed 50 characters'),
    body('members').optional().isArray().withMessage('Members must be an array'),
];

// ─── Routes ────────────────────────────────────────────────────────────────────

router.get('/', protect, boardController.getAllBoards);
router.get('/:id', protect, boardController.getBoardById);
router.post('/', protect, createBoardValidation, boardController.createBoard);
router.put('/:id', protect, updateBoardValidation, boardController.updateBoard);
router.delete('/:id', protect, boardController.deleteBoard);

// Member management
router.post('/:id/members', protect, boardController.addMember);
router.delete('/:id/members/:memberId', protect, boardController.removeMember);

module.exports = router;
