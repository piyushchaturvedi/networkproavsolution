// models/user.js
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({

    firstName: {
        type: String,
        required: true,
        trim: true
    },

    lastName: {
        type: String,
        required: true,
        trim: true
    },

    fullName: {
        type: String,
        trim: true
    },

    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },

    // username: {
    //     type: String,
    //     required: true,
    //     unique: true,
    //     trim: true
    // },

    password: {
        type: String,
        required: true    // (Hash before save)
    },

    phone: {
        type: String,
        required: true,
        trim: true
    },

    address: {
        type: String,
        default: '',
        trim: true
    },

    role: {
        type: String,
        enum: ['admin', 'customer'],
        default: 'customer'
    },

    isBlocked: {
        type: Boolean,
        default: false
    },

    // Password Reset Fields
    resetToken: {
        type: String,
        default: null
    },

    resetTokenExpiry: {
        type: Date,
        default: null
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});


// Auto-generate fullName if first + last exists
UserSchema.pre('save', function (next) {
    if (this.firstName && this.lastName) {
        this.fullName = `${this.firstName} ${this.lastName}`;
    }
    next();
});

export default mongoose.model('User', UserSchema);
