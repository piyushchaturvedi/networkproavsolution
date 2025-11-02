// models/setting.js
import mongoose from 'mongoose'; // ES6 import

const SettingSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    value: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('Setting', SettingSchema); // ES6 export
