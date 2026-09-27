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
  initiateGoogleAuth,
  handleGoogleCallback,
  exchangeOAuthCode,
  issueHandoffCode,
  exchangeHandoffCode,
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

// Google OAuth 2.0 Authorization Code flow
router.get('/auth/google', initiateGoogleAuth);
router.get('/auth/google/callback', handleGoogleCallback);
router.post('/auth/google/exchange', exchangeOAuthCode);

// Cross-app handoff — secure token transfer between TaskMaster frontends
router.post('/auth/handoff', protect, issueHandoffCode);
router.post('/auth/handoff/exchange', exchangeHandoffCode);

// Google OAuth (token-based — frontend sends Google ID token, preserved for backward compatibility)
router.post('/google', googleAuth);

// Protected routes (require valid JWT)
router.get('/search', protect, searchUsers);
router.get('/profile', protect, getUserProfile);
router.put('/:id', protect, validateUpdate, updateUser);
router.delete('/:id', protect, deleteUser);

// Admin-only routes
router.get('/', protect, authorize('Admin'), getAllUsers);

module.exports = router;
