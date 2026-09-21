/**
 * Password Reset Utility
 * Usage: node scripts/resetPassword.js <email> <newPassword>
 * Example: node scripts/resetPassword.js admin@taskmaster.com Admin@123
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const [, , email, newPassword] = process.argv;

if (!email || !newPassword) {
  console.error('Usage: node scripts/resetPassword.js <email> <newPassword>');
  process.exit(1);
}

if (newPassword.length < 6) {
  console.error('Password must be at least 6 characters');
  process.exit(1);
}

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    const result = await mongoose.connection.db
      .collection('users')
      .updateOne({ email }, { $set: { password: hashedPassword } });

    if (result.matchedCount === 0) {
      console.error(`No user found with email: ${email}`);
    } else {
      console.log(`Password updated successfully for ${email}`);
      console.log(`You can now login with: ${email} / ${newPassword}`);
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
})();
