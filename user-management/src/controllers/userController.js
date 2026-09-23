const { validationResult } = require('express-validator');
const passport = require('passport');
const crypto = require('crypto');
const userService = require('../services/userService');
const generateToken = require('../utils/generateToken');

const registerUser = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    const { name, email, password } = req.body;
    const user = await userService.registerUser({ name, email, password });
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

const loginUser = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    const { email, password } = req.body;
    const user = await userService.loginUser(email, password);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

const getUserProfile = async (req, res, next) => {
  try {
    const user = await userService.getUserProfile(req.user._id);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    const user = await userService.updateUser(req.params.id, req.body, req.user);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const result = await userService.deleteUser(req.params.id, req.user);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    const users = await userService.getAllUsers();
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

const googleAuth = async (req, res, next) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ success: false, message: 'Google ID token is required' });
    }
    const user = await userService.googleAuth(idToken);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// Search/filter users - accessible to all authenticated users
const searchUsers = async (req, res, next) => {
  try {
    const { q = '', limit = 10 } = req.query;
    const users = await userService.getAllUsers();
    
    // Filter users based on search query
    let filteredUsers = users;
    if (q && q.trim() !== '') {
      const query = q.toLowerCase();
      filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
      );
    }
    
    // Limit results
    const limitNum = parseInt(limit, 10);
    const limitedUsers = filteredUsers.slice(0, limitNum);
    
    res.status(200).json({ success: true, users: limitedUsers });
  } catch (error) {
    next(error);
  }
};

// Google OAuth Authorization Code Flow
const initiateGoogleAuth = (req, res, next) => {
  const state = crypto.randomBytes(32).toString('hex');
  res.cookie('oauth_state', state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 5 * 60 * 1000,
  });

  passport.authenticate('google', {
    scope: ['profile', 'email'],
    state,
  })(req, res, next);
};

const handleGoogleCallback = (req, res, next) => {
  const queryState = req.query.state;
  const cookieState = req.cookies ? req.cookies.oauth_state : null;

  if (!queryState || !cookieState || queryState !== cookieState) {
    res.clearCookie('oauth_state');
    return res.status(400).json({ success: false, message: 'Invalid or missing OAuth state' });
  }

  res.clearCookie('oauth_state');

  passport.authenticate('google', { session: false }, (err, user) => {
    if (err || !user) {
      return res.status(401).json({
        success: false,
        message: err ? err.message : 'Google authentication failed',
      });
    }

    const token = generateToken(user._id, user.role, user.name, user.email);
    const code = userService.createOAuthExchangeTicket({ user, token });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    return res.redirect(`${frontendUrl}/oauth-callback?code=${code}`);
  })(req, res, next);
};

const exchangeOAuthCode = async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Exchange code is required' });
    }
    const result = await userService.consumeOAuthExchangeTicket(code);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /auth/handoff
 * Authenticated route. Creates a short-lived, single-use handoff code
 * that the caller can pass to another TaskMaster frontend via ?handoff=<code>.
 * The JWT is NEVER placed in the URL — only the opaque code is.
 */
const issueHandoffCode = async (req, res, next) => {
  try {
    // req.user is populated by the protect middleware; re-generate a fresh JWT
    // so the handoff ticket always contains a valid, current token.
    const token = generateToken(
      req.user._id,
      req.user.role,
      req.user.name,
      req.user.email
    );
    const code = userService.createHandoffTicket(token);
    res.status(200).json({ success: true, data: { code } });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /auth/handoff/exchange
 * Public route. Consumes a single-use handoff code and returns the JWT.
 * The code is burned on read; replay attempts receive 400.
 */
const exchangeHandoffCode = async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Handoff code is required' });
    }
    const result = userService.consumeHandoffTicket(code);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};