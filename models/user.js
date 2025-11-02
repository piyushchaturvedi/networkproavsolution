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
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('User', UserSchema); // ES6 export
