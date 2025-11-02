// models/contactMessage.js
import mongoose from 'mongoose';

const ContactMessageSchema = new mongoose.Schema({
    senderEmail: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    subject: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    read: { // To mark if admin has read it
        type: Boolean,
        default: false
    },
    replied: { // To mark if admin has replied
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('ContactMessage', ContactMessageSchema);
