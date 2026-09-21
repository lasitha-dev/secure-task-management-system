/**
 * Token Generator Utility
 * -------------------------------------------------------
 * Run this to generate a dev JWT token for testing APIs:
 *   node src/utils/generateToken.js
 *
 * Use the printed token as: Authorization: Bearer <token>
 * -------------------------------------------------------
 */

require('dotenv').config();
const jwt = require('jsonwebtoken');
const { MOCK_USERS } = require('./mockUsers');

const user = MOCK_USERS[0]; // Alex Morgan (admin)

const token = jwt.sign(
    {
        id:    user.id,
        name:  user.name,
        email: user.email,
        role:  user.role,
    },
    process.env.JWT_SECRET || 'taskmanagement_super_secret_key_2026',
    { expiresIn: '7d' }
);

console.log('\n✅ Dev JWT Token (valid 7 days):');
console.log('\n' + token + '\n');
console.log('User:', user);
console.log('\nUsage in API calls:');
console.log('Authorization: Bearer ' + token + '\n');
