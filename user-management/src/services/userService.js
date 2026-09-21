const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

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
    googleId: user.googleId,
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
  const users = await User.find({});
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
