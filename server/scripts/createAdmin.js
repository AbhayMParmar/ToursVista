const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        // Check if admin exists
        const adminExists = await User.findOne({ email: 'admin@tours.com' });
        
        if (!adminExists) {
            // Create admin user
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('admin123', salt);
            
            const admin = new User({
                name: 'Admin User',
                email: 'admin@tours.com',
                password: hashedPassword,
                role: 'admin',
                phone: '1234567890',
                address: 'Admin Address'
            });
            
            await admin.save();
            console.log('Admin user created successfully!');
            console.log('Email: admin@tours.com');
            console.log('Password: admin123');
        } else {
            console.log('Admin user already exists');
        }
        
        mongoose.disconnect();
    } catch (error) {
        console.error('Error creating admin:', error);
        mongoose.disconnect();
    }
};

createAdmin();