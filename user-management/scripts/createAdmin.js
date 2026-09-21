const mongoose = require('mongoose');
const User = require('../src/models/User');
require('dotenv').config();

const createAdminUser = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@taskmaster.com' });
    
    if (existingAdmin) {
      console.log('ℹ️  Admin user already exists:');
      console.log(`   Name: ${existingAdmin.name}`);
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Role: ${existingAdmin.role}`);
      
      // Update role if not Admin
      if (existingAdmin.role !== 'Admin') {
        existingAdmin.role = 'Admin';
        await existingAdmin.save();
        console.log('✅ Updated user role to Admin');
      }
    } else {
      // Create new admin user
      const admin = await User.create({
        name: 'Admin User',
        email: 'admin@taskmaster.com',
        password: 'admin123',
        role: 'Admin'
      });
      
      console.log('✅ Admin user created successfully!');
      console.log(`   Name: ${admin.name}`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Role: ${admin.role}`);
      console.log(`   Password: admin123`);
    }

    console.log('\n📋 Use these credentials to login:');
    console.log('   Email: admin@taskmaster.com');
    console.log('   Password: admin123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

createAdminUser();
