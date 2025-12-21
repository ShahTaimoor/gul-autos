const express = require('express');
const Cart = require('../models/Cart');
const { isAuthorized } = require('../middleware/authMiddleware');
const router = express.Router();

// Get current user's cart
router.get('/', isAuthorized, async (req, res) => {
  const cart = await Cart.findOne({ user: req.user.id }).populate('items.product');
  
  if (!cart) {
    return res.json({ items: [] });
  }
  
  // Filter out items with null/deleted products
  let validItems = cart.items.filter(item => item.product !== null);
  
  // Check stock availability and adjust quantities or mark as out of stock
  const itemsToUpdate = [];
  validItems = validItems.map(item => {
    const product = item.product;
    const currentStock = product.stock || 0;
    const requestedQty = item.quantity;
    
    // If product is out of stock, mark it but keep in cart for user to see
    if (currentStock <= 0) {
      return {
        ...item.toObject(),
        product: {
          ...product.toObject(),
          isOutOfStock: true,
          availableStock: 0
        }
      };
    }
    
    // If requested quantity exceeds stock, adjust to available stock
    if (requestedQty > currentStock) {
      itemsToUpdate.push({
        productId: product._id.toString(),
        quantity: currentStock
      });
      return {
        ...item.toObject(),
        quantity: currentStock,
        product: {
          ...product.toObject(),
          isOutOfStock: false,
          availableStock: currentStock,
          quantityAdjusted: true,
          originalQuantity: requestedQty
        }
      };
    }
    
    return {
      ...item.toObject(),
      product: {
        ...product.toObject(),
        isOutOfStock: false,
        availableStock: currentStock
      }
    };
  });
  
  // Update cart with adjusted quantities if needed
  if (itemsToUpdate.length > 0) {
    itemsToUpdate.forEach(({ productId, quantity }) => {
      const itemIndex = cart.items.findIndex(i => i.product.toString() === productId);
      if (itemIndex > -1) {
        cart.items[itemIndex].quantity = quantity;
      }
    });
    cart.updatedAt = new Date();
    await cart.save();
  }
  
  // Clean up invalid items from database
  if (validItems.length !== cart.items.length) {
    cart.items = validItems.map(item => ({
      product: item.product._id,
      quantity: item.quantity
    }));
    cart.updatedAt = new Date();
    await cart.save();
  }
  
  res.json({ items: validItems });
});

// Add/update item in cart
router.post('/add', isAuthorized, async (req, res) => {
  const { productId, quantity } = req.body;
  
  // Validate product exists and check stock
  const Product = require('../models/Product');
  const product = await Product.findById(productId);
  
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }
  
  if (product.stock <= 0) {
    return res.status(400).json({ 
      message: `Product "${product.title}" is out of stock`,
      code: 'OUT_OF_STOCK'
    });
  }
  
  let cart = await Cart.findOne({ user: req.user.id });
  if (!cart) {
    cart = new Cart({ user: req.user.id, items: [] });
  }
  
  const itemIndex = cart.items.findIndex(i => i.product.toString() === productId);
  const requestedQuantity = itemIndex > -1 
    ? cart.items[itemIndex].quantity + quantity 
    : quantity;
  
  // Check if requested quantity exceeds available stock
  if (requestedQuantity > product.stock) {
    return res.status(400).json({ 
      message: `Only ${product.stock} units available for "${product.title}". You requested ${requestedQuantity}.`,
      code: 'INSUFFICIENT_STOCK',
      availableStock: product.stock
    });
  }
  
  if (itemIndex > -1) {
    cart.items[itemIndex].quantity += quantity;
  } else {
    cart.items.push({ product: productId, quantity });
  }
  await cart.save();
  cart = await Cart.findOne({ user: req.user.id }).populate('items.product');
  
  // Filter out items with null/deleted products
  const validItems = cart.items.filter(item => item.product !== null);
  
  // Clean up invalid items from database
  if (validItems.length !== cart.items.length) {
    cart.items = validItems;
    cart.updatedAt = new Date();
    await cart.save();
  }
  
  res.json({ items: validItems });
});

// Remove item from cart
router.post('/remove', isAuthorized, async (req, res) => {
  const { productId } = req.body;
  let cart = await Cart.findOne({ user: req.user.id });
  if (!cart) return res.json({ items: [] });
  cart.items = cart.items.filter(i => i.product.toString() !== productId);
  cart.updatedAt = new Date();
  await cart.save();
  cart = await Cart.findOne({ user: req.user.id }).populate('items.product');
  
  // Filter out items with null/deleted products
  const validItems = cart.items.filter(item => item.product !== null);
  
  // Clean up invalid items from database
  if (validItems.length !== cart.items.length) {
    cart.items = validItems;
    cart.updatedAt = new Date();
    await cart.save();
  }
  
  res.json({ items: validItems });
});

// Empty cart
router.post('/empty', isAuthorized, async (req, res) => {
  let cart = await Cart.findOne({ user: req.user.id });
  if (cart) {
    cart.items = [];
    cart.updatedAt = new Date();
    await cart.save();
  }
  res.json({ items: [] });
});

// Update quantity of an item in cart
router.post('/update', isAuthorized, async (req, res) => {
  const { productId, quantity } = req.body;
  let cart = await Cart.findOne({ user: req.user.id });
  if (!cart) return res.status(404).json({ message: 'Cart not found' });

  const itemIndex = cart.items.findIndex(i => i.product.toString() === productId);
  if (itemIndex === -1) return res.status(404).json({ message: 'Item not found in cart' });

  // Validate product exists and check stock
  const Product = require('../models/Product');
  const product = await Product.findById(productId);
  
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }
  
  if (product.stock <= 0) {
    return res.status(400).json({ 
      message: `Product "${product.title}" is out of stock`,
      code: 'OUT_OF_STOCK'
    });
  }
  
  if (quantity > product.stock) {
    return res.status(400).json({ 
      message: `Only ${product.stock} units available for "${product.title}". You requested ${quantity}.`,
      code: 'INSUFFICIENT_STOCK',
      availableStock: product.stock
    });
  }

  cart.items[itemIndex].quantity = quantity;
  cart.updatedAt = new Date();
  await cart.save();
  cart = await Cart.findOne({ user: req.user.id }).populate('items.product');
  
  // Filter out items with null/deleted products
  const validItems = cart.items.filter(item => item.product !== null);
  
  // Clean up invalid items from database
  if (validItems.length !== cart.items.length) {
    cart.items = validItems;
    cart.updatedAt = new Date();
    await cart.save();
  }
  
  res.json({ items: validItems });
});

// Check stock for multiple products (for real-time validation before checkout)
router.post('/check-stock', isAuthorized, async (req, res) => {
  try {
    const { products } = req.body; // Array of { productId, quantity }
    
    if (!products || !Array.isArray(products)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Products array is required' 
      });
    }
    
    const Product = require('../models/Product');
    const stockStatus = [];
    const outOfStockItems = [];
    const insufficientStockItems = [];
    
    for (const item of products) {
      const product = await Product.findById(item.id || item.productId);
      
      if (!product) {
        outOfStockItems.push({
          productId: item.id || item.productId,
          message: 'Product not found'
        });
        continue;
      }
      
      const availableStock = product.stock || 0;
      const requestedQuantity = item.quantity || 0;
      
      // Allow orders even if stock would go negative
      // Always mark as available to allow orders through
      stockStatus.push({
        productId: product._id.toString(),
        available: true,
        availableStock,
        requestedQuantity
      });
    }
    
    // Always return valid since we allow orders even with negative stock
    const isValid = true;
    
    res.json({
      success: isValid,
      isValid,
      stockStatus,
      outOfStockItems,
      insufficientStockItems,
      message: isValid 
        ? 'All products are available in requested quantities'
        : `${outOfStockItems.length} out of stock, ${insufficientStockItems.length} insufficient stock`
    });
  } catch (error) {
    console.error('Stock check error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error checking stock availability' 
    });
  }
});

module.exports = router;
