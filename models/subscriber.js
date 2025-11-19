import mongoose from 'mongoose';

const SubscriberSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true, // Prevent duplicate subscriptions
        trim: true,
        lowercase: true
    },
    subscribedAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('Subscriber', SubscriberSchema);