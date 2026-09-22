const bcrypt = require('bcryptjs');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ---- A07:2021 Brute-force / account-lockout config --------------------------
const MAX_LOGIN_ATTEMPTS = 5;           // failures before account is locked
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15-minute lockout window

// Pre-computed ONCE at module load — used to equalise response timing when the
// requested email does not exist in the DB, preventing timing-based user
// enumeration (attacker cannot distinguish 'no account' from 'wrong password').
const DUMMY_HASH = bcrypt.hashSync('__timing_guard_dummy__', 10);
// ----------------------------------------------------------------------------

const registerUser = async ({ name, email, password, role }) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const error = new Error('User already exists');
    error.statusCode = 409;
    throw error;
  }

  const user = await User.create({ name, email, password, role });
  const token = generateToken(user._id, user.role, user.name, user.email);

  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    token,
  };
};

const loginUser = async (email, password) => {
  // Fetch user; include lockout fields that are hidden from API responses
  const user = await User.findOne({ email }).select(
    '+password +failedLoginAttempts +lockUntil'
  );

  // ---- Non-existent email —————————————————————————————————————————————————
  // Run a dummy bcrypt.compare (against a pre-computed hash) so that the
  // response time is indistinguishable from a real wrong-password attempt,
  // preventing timing-based user enumeration (A07:2021).
  if (!user) {
    await bcrypt.compare(password, DUMMY_HASH);
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  // ---- Account lockout check ——————————————————————————————————————————————
  const isLocked = user.lockUntil && user.lockUntil > Date.now();
  if (isLocked) {
    const error = new Error(
      'Too many failed login attempts. Try again later.'
    );
    error.statusCode = 429;
    throw error;
  }

  // ---- Expired-lock reset ——————————————————————————————————————————————————
  // If lockUntil exists but is in the past the lock has expired.
  // Reset the stale counters NOW, before processing this attempt.
  // Without this, failedLoginAttempts would still be MAX_LOGIN_ATTEMPTS,
  // so the first post-expiry wrong password would increment it to
  // MAX_LOGIN_ATTEMPTS + 1 → immediately re-trigger a new 15-min lock.
  if (user.lockUntil && user.lockUntil <= Date.now()) {
    user.failedLoginAttempts = 0;
    user.lockUntil = null;
  }

  // ---- Password verification ——————————————————————————————————————————————
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    // Increment the failure counter
    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;

    // Lock the account once MAX_LOGIN_ATTEMPTS is reached
    if (user.failedLoginAttempts >= MAX_LOGIN_ATTEMPTS) {
      user.lockUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
    }

    await user.save();

    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  // ---- Successful login — reset brute-force counters ——————————————————————
  user.failedLoginAttempts = 0;
  user.lockUntil = null;
  await user.save();

  const token = generateToken(user._id, user.role, user.name, user.email);

  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    token,
  };
};

const getUserProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
};

const updateUser = async (userId, updateData, requestingUser) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  if (requestingUser._id.toString() !== userId && requestingUser.role !== 'Admin') {
    const error = new Error('Not authorized to update this user');
    error.statusCode = 403;
    throw error;
  }

  // Whitelist updateable fields
  const { name, email, password } = updateData;
  if (name) user.name = name;
  if (email) user.email = email;
  if (password) user.password = password;

  // Only Admin can change roles
  if (updateData.role && requestingUser.role === 'Admin') {
    user.role = updateData.role;
  }

  await user.save();

  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
};

const deleteUser = async (userId, requestingUser) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  if (requestingUser._id.toString() !== userId && requestingUser.role !== 'Admin') {
    const error = new Error('Not authorized to delete this user');
    error.statusCode = 403;
    throw error;
  }

  await user.deleteOne();
  return { message: 'User removed' };
};

const getAllUsers = async () => {
  const users = await User.find(
    {},
    '_id name email role createdAt'
  );
  return users;
};

const googleAuth = async (idToken) => {
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const { sub: googleId, email, name } = ticket.getPayload();

  // Check if user exists by googleId
  let user = await User.findOne({ googleId });
  if (user) {
    const token = generateToken(user._id, user.role, user.name, user.email);
    return { _id: user._id, name: user.name, email: user.email, role: user.role, token };
  }

  // Check if user exists by email (link accounts)
  user = await User.findOne({ email });
  if (user) {
    user.googleId = googleId;
    await user.save();
    const token = generateToken(user._id, user.role, user.name, user.email);
    return { _id: user._id, name: user.name, email: user.email, role: user.role, token };
  }

  // Create new user
  user = await User.create({
    name,
    email,
    googleId,
  });

  const token = generateToken(user._id, user.role, user.name, user.email);
  return { _id: user._id, name: user.name, email: user.email, role: user.role, token };
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUser,
  deleteUser,
  getAllUsers,
  googleAuth,
};
