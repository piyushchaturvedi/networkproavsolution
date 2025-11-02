// models/page.js
import mongoose from 'mongoose'; // ES6 import

const PageSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    content: {
        type: String,
        required: true
    },
    menuLocation: {
        type: String,
        enum: ['none', 'header', 'footer', 'both'],
        default: 'none'
    },
    order: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

PageSchema.pre('save', function(next) {
    if ((this.isModified('title') || this.isNew) && this.title) {
        this.slug = this.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    }
    this.updatedAt = Date.now();
    next();
});

PageSchema.pre('findOneAndUpdate', function(next) {
    const update = this.getUpdate();
    if (update.title) {
        update.slug = update.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    }
    update.updatedAt = Date.now();
    next();
});

export default mongoose.model('Page', PageSchema); // ES6 export
