const mongoose = require('mongoose');
const User = require('../src/models/User');
require('dotenv').config();

const listAllUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const users = await User.find({});
    
    if (users.length === 0) {
      console.log('ℹ️  No users found in database');
    } else {
      console.log(`📋 Total Users: ${users.length}\n`);
      console.log('═══════════════════════════════════════════════════════');
      
      users.forEach((user, index) => {
        const roleIcon = user.role === 'Admin' ? '👑' : '👤';
        console.log(`\n${roleIcon} User #${index + 1}`);
        console.log(`   ID:      ${user._id}`);
        console.log(`   Name:    ${user.name}`);
        console.log(`   Email:   ${user.email}`);
        console.log(`   Role:    ${user.role}`);
        console.log(`   Created: ${user.createdAt}`);
        if (user.googleId) {
          console.log(`   Google:  Yes (${user.googleId.substring(0, 10)}...)`);
        }
      });
      
      console.log('\n═══════════════════════════════════════════════════════');
      
      const adminCount = users.filter(u => u.role === 'Admin').length;
      const userCount = users.filter(u => u.role === 'User').length;
      
      console.log(`\n📊 Summary:`);
      console.log(`   👑 Admins: ${adminCount}`);
      console.log(`   👤 Users:  ${userCount}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

listAllUsers();
