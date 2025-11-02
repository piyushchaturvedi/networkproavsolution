// seed_admin.js
const mongoose = require('mongoose');
const User = require('../models/user');
require('dotenv').config();

const seedAdmin = async () => {
    try {
        await mongoose.connect("mongodb://localhost:27017/cybersafetrust"); // Use your MongoDB URI
        console.log('MongoDB connected for seeding admin user...');

        const adminExists = await User.findOne({ username: 'admin' });
        if (!adminExists) {
            const newAdmin = new User({
                username: 'admin',
                password: 'adminpassword123', // !!! REPLACE WITH A REAL HASH IN PRODUCTION !!!
                role: 'admin',
                email: 'admin@yourdomain.com'
            });
            await newAdmin.save();
            console.log('Admin user "admin" created successfully!');
        } else {
            console.log('Admin user "admin" already exists.');
        }
    } catch (error) {
        console.error('Error seeding admin user:', error);
    } finally {
        mongoose.connection.close();
    }
};

seedAdmin();