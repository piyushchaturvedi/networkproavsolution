// models/product.js
import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    oldPrice: {
        type: Number,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    savePercent: {
        type: Number,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    shortDesc: {
        type: String,
        required: true
    },
    longDesc: {
        type: [String],
        required: true
    },
    brand: {
        type: String,
        required: true
    },
    rating: { // NEW: Rating field
        type: Number,
        min: 0,
        max: 5,
        default: 0 // Default to 0 if not provided
    },
    platform: {
        type: String,
        required: true
    },
    delivery: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    isFeatured: { type: Boolean, default: false },
    isLoved: { type: Boolean, default: false }

});

export default mongoose.model('Product', ProductSchema);
