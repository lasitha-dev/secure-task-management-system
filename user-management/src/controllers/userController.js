const { validationResult } = require('express-validator');
const userService = require('../services/userService');

const registerUser = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    const { name, email, password, role } = req.body;
    const user = await userService.registerUser({ name, email, password, role });
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

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUser,
  deleteUser,
  getAllUsers,
  googleAuth,
  searchUsers,
};
