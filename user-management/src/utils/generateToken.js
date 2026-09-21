const jwt = require('jsonwebtoken');

const generateToken = (userId, role, name, email) => {
  return jwt.sign(
    { id: userId, role, name, email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};

module.exports = generateToken;
