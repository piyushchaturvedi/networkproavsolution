// models/order.js
import mongoose from "mongoose";

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
    ref: "User",
    default: null
  },

  sessionId: String,

  customerName: {
    type: String,
    default: "Guest"
  },

  customerEmail: {
    type: String,
    default: "guest@example.com"
  },
  OrderCompleteStatus: {
    type: String,
    enum: ["pending", "complete"],
    default: "pending"
  },
  // Payment Status
  status: {
    type: String,
    enum: ["pending", "success", "failed", "cancelled"],
    default: "pending"
  },

  paypalOrderId: {
    type: String,
    unique: true,
    sparse: true
  },

  paypalPayerId: {
    type: String
  },

  totalAmount: {
    type: Number,
    required: true
  },

  currency: {
    type: String,
    default: "USD"
  },

  items: [OrderItemSchema],

  shippingAddress: {
    firstName: String,
    lastName: String,
    email: String,
    phone: String,
    address: String,
    state: String,
    city: String,
    zipCode: String,
    country: String
  }

}, {
  timestamps: true
});

export default mongoose.model("Order", OrderSchema);