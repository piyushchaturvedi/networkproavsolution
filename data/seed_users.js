// seed_users.js (Example for adding an admin user - run ONCE)
const mongoose = require('mongoose');
const User = require('../models/user'); // Adjust path as needed
require('dotenv').config();

const seedAdminUser = async () => {
    try {
        await mongoose.connect("mongodb://localhost:27017/cybersafetrust", {});
        console.log('MongoDB Connected for user seeding...');

        const existingAdmin = await User.findOne({ username: 'admin' });
        if (!existingAdmin) {
            const adminUser = new User({
                username: 'admin',
                password: 'adminpassword', // IMPORTANT: In real app, hash this!
                role: 'admin',
                email: 'admin@example.com' // Use a real admin email
            });
            await adminUser.save();
            console.log('Admin user created successfully!');
        } else {
            console.log('Admin user already exists.');
        }
    } catch (err) {
        console.error('Error seeding admin user:', err.message);
    } finally {
        mongoose.connection.close();
    }
};

seedAdminUser();