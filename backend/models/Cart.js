const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1 },
});

const cartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  items: [cartItemSchema],
  updatedAt: { type: Date, default: Date.now },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Indexes for frequently used fields
cartSchema.index({ user: 1 });
cartSchema.index({ isDeleted: 1 });
cartSchema.index({ user: 1, isDeleted: 1 }); // Compound index for user carts

module.exports = mongoose.model('Cart', cartSchema);
