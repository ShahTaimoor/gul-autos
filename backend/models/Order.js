// models/Order.js

const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  amount: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  phone: {
    type: Number,
    required: true,
  },
  
  products: [
    {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
      quantity: {
        type: Number,
        required: true,
      },
    },
  ],
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  paymentMethod: {
    type: String,
    enum: ['COD'],
    default: 'COD',
  },
  status: {
    type: String,
    enum: ['Pending', 'Completed'],
    default: 'Pending',
  },
   packerName: {
    type: String,
    default: ''
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
  
}, { timestamps: true });

// Indexes for frequently used fields
orderSchema.index({ userId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ isDeleted: 1 });
orderSchema.index({ userId: 1, isDeleted: 1 }); // Compound index for user orders

module.exports = mongoose.model('Order', orderSchema);
