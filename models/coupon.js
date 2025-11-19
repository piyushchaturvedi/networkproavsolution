// models/coupon.js
import mongoose from 'mongoose';

const CouponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    discountType: { // 'percentage' or 'fixed'
        type: String,
        required: true,
        enum: ['percentage', 'fixed']
    },
    discountValue: { // e.g., 10 for 10% or 20 for $20 off
        type: Number,
        required: true
    },
    minOrderAmount: {
        type: Number,
        default: 0
    },
    
    // === TARGETING FIELDS ===
    appliesTo: { // 'all', 'products', 'categories'
        type: String,
        required: true,
        enum: ['all', 'products', 'categories'],
        default: 'all'
    },
    targetProductIds: { // Stores Product.id strings
        type: [String], 
        default: []
    },
    targetCategoryNames: { // Stores Category.name strings
        type: [String],
        default: []
    },
    // === END TARGETING FIELDS ===
    
    usageLimit: {
        type: Number,
        default: -1
    },
    usedCount: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    expiresAt: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('Coupon', CouponSchema);