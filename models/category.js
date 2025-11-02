// models/category.js
import mongoose from 'mongoose'; // ES6 import

const CategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

CategorySchema.pre('save', function(next) {
    if ((this.isModified('name') || this.isNew) && this.name) {
        this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    }
    this.updatedAt = Date.now();
    next();
});

// REMOVED THE EXTRANEOUS 'PageSchema.pre' HOOK THAT WAS CAUSING THE ERROR
// PageSchema.pre('findOneAndUpdate', function(next) {
//     const update = this.getUpdate();
//     if (update.name) {
//         update.slug = update.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
//     }
//     update.updatedAt = Date.now();
//     next();
// });

export default mongoose.model('Category', CategorySchema); // ES6 export
