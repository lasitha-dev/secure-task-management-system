const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUser,
  deleteUser,
  getAllUsers,
  googleAuth,
  searchUsers,
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  validateRegister,
  validateLogin,
  validateUpdate,
} = require('../middleware/validators/userValidator');

// Public routes
router.post('/register', validateRegister, registerUser);
router.post('/login', validateLogin, loginUser);

// Google OAuth (token-based — frontend sends Google ID token)
router.post('/google', googleAuth);

// Protected routes (require valid JWT)
router.get('/search', protect, searchUsers);
router.get('/profile', protect, getUserProfile);
router.put('/:id', protect, validateUpdate, updateUser);
router.delete('/:id', protect, deleteUser);

// Admin-only routes
router.get('/', protect, authorize('Admin'), getAllUsers);

module.exports = router;
