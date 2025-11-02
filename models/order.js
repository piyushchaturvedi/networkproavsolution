// models/order.js
import mongoose from 'mongoose'; // ES6 import

const OrderItemSchema = new mongoose.Schema({
    productId: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    image: { type: String }
});

const OrderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    customerName: { type: String, default: 'Guest' },
    customerEmail: { type: String, default: 'guest@example.com' },
    
    paypalOrderId: {
        type: String,
        required: true,
        unique: true
    },
    paypalPayerId: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true,
        default: 'PENDING'
    },
    totalAmount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        required: true
    },
    items: [OrderItemSchema],
    
    shippingAddress: {
        fullName: { type: String },
        email: { type: String },
        phone: { type: String },
        address: { type: String },
        city: { type: String },
        zipCode: { type: String },
        country: { type: String }
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('Order', OrderSchema); // ES6 export
