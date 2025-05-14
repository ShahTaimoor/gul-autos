const express = require('express');
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const { isAdmin, isAuthorized } = require('../middleware/authMiddleware');

const router = express.Router();

// @route POST /api/orders
// @desc Place a new order (COD)
// @access Privat

router.post('/order', isAuthorized, async (req, res) => {
  try {
    const { products, address, amount,phone,city } = req.body;

    if (!products || products.length === 0) {
      return res.status(400).json({ success: false, message: 'No products provided' });
    }

    // Check if stock is sufficient for each product
    for (const item of products) {
      const product = await Product.findById(item.id);

      if (!product) {
        return res.status(404).json({ success: false, message: `Product not found: ${item.id}` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({ success: false, message: `Not enough stock for product: ${product.title}` });
      }

      product.stock -= item.quantity;  // Deduct the stock
      await product.save();
    }

    // Create new order
    const newOrder = new Order({
      products,
      userId: req.user.id,
      address,
      phone,city,
      amount,
      paymentMethod: 'COD',
      status: 'Pending'
    });

    const savedOrder = await newOrder.save();

    return res.status(201).json({ success: true, data: savedOrder });
  } catch (error) {
    console.error('COD Order Error:', error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @route GET /api/orders/my-orders
// @desc Get logged-in user's orders
// @access Private

router.get('/get-orders-by-user-id', isAuthorized, async (req, res) => {
  const userId = req.user.id;

  try {
    const orders = await Order.find({ userId }).populate({
      path: 'products.id',
      select: "title price category picture"
    });

    return res.status(200).json({ success: true, data: orders });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @route GET /api/orders/get-all-orders
// @desc Get all orders (Admin only)
// @access Admin

// GET: All Orders with Pagination
router.get('/get-all-orders', isAuthorized, isAdmin, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  try {
    const orders = await Order.find()
      .populate({
        path: 'products.id',
        select: 'title price category picture',
      })
      .populate({
        path: 'userId',
        select: 'name email',
      })
      .limit(limit)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    if (!orders.length) {
      return res.status(404).json({ success: false, message: 'Orders not found' });
    }

    const count = await Order.countDocuments();

    return res.status(200).json({
      success: true,
      data: orders,
      totalOrders: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// GET: Metrics (Sales, Users, Recent Orders)
router.get('/get-metrics', isAuthorized, isAdmin, async (req, res) => {
  const { startDate, endDate } = req.query;

  try {
    const start = new Date(startDate || new Date().setMonth(new Date().getMonth() - 1));
    const end = new Date(endDate || new Date());

    const ordersInRange = await Order.find({ createdAt: { $gte: start, $lte: end } });
    const totalSales = ordersInRange.reduce((acc, order) => acc + Number(order.amount), 0);

    const lastMonth = new Date(new Date().setMonth(new Date().getMonth() - 2));
    const lastMonthOrders = await Order.find({ createdAt: { $gte: lastMonth, $lte: start } });
    const totalLastMonth = lastMonthOrders.reduce((acc, order) => acc + Number(order.amount), 0);

    const salesGrowth = totalLastMonth
      ? ((totalSales - totalLastMonth) / totalLastMonth) * 100
      : 0;

    const thisMonthUsers = await User.find({ createdAt: { $gte: start, $lte: end } });
    const lastMonthUsers = await User.find({ createdAt: { $gte: lastMonth, $lte: start } });

    const usersGrowth = lastMonthUsers.length
      ? ((thisMonthUsers.length - lastMonthUsers.length) / lastMonthUsers.length) * 100
      : 0;

    const lastHour = new Date(new Date().setHours(new Date().getHours() - 1));
    const lastHourOrders = await Order.find({ createdAt: { $gte: lastHour, $lte: new Date() } });

    const previousDayOrders = await Order.find({
      createdAt: {
        $gte: new Date(new Date().setDate(new Date().getDate() - 1)),
        $lte: new Date(),
      },
    });

    const lastHourGrowth = previousDayOrders.length
      ? (lastHourOrders.length / previousDayOrders.length) * 100
      : 0;

    const recentOrders = await Order.find()
      .populate({ path: 'userId', select: 'name email' })
      .select('amount userId createdAt')
      .sort({ createdAt: -1 })
      .limit(9);

    return res.status(200).json({
      success: true,
      data: {
        totalSales: {
          count: totalSales.toFixed(2),
          growth: salesGrowth.toFixed(2),
        },
        users: {
          count: thisMonthUsers.length,
          growth: usersGrowth.toFixed(2),
        },
        sales: {
          count: totalSales.toFixed(2),
          growth: salesGrowth.toFixed(2),
        },
        activeNow: {
          count: lastHourOrders.length,
          growth: lastHourGrowth.toFixed(2),
        },
        recentSales: {
          count: totalSales.toFixed(2),
          orders: recentOrders,
        },
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
