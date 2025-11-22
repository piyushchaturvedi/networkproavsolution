// models/user.js
import mongoose from 'mongoose'; // ES6 import

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: { // In a real app, this would be hashed (e.g., with bcrypt)
        type: String,
        required: true
    },
    role: { // e.g., 'admin', 'customer'
        type: String,
        default: 'customer',
        enum: ['admin', 'customer']
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    // --- NEW FIELDS FOR MANAGEMENT ---
    isBlocked: { // For admin to disable user access
        type: Boolean,
        default: false
    },
    fullName: {
        type: String,
        trim: true,
        default: ''
    },
    // --- END NEW FIELDS ---
    // --- NEW FIELDS FOR PASSWORD RESET ---
    resetToken: {
        type: String,
        default: null
    },
    resetTokenExpiry: {
        type: Date,
        default: null
    },
    // --- END NEW FIELDS ---
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('User', UserSchema); // ES6 export