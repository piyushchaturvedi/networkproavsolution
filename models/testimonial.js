// models/testimonial.js
import mongoose from 'mongoose'; // ES6 import

const TestimonialSchema = new mongoose.Schema({
    quote: {
        type: String,
        required: true,
        trim: true
    },
    rating: {
        type: Number,
        required: true,
        min: 0,
        max: 5
    },
    userName: {
        type: String,
        required: true,
        trim: true
    },
    userImage: {
        type: String,
        default: 'https://placehold.co/60x60/cccccc/000000?text=Avatar'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('Testimonial', TestimonialSchema); // ES6 export
