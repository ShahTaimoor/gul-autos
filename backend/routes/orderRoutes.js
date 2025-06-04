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
    const { products, address, amount, phone, city } = req.body;

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

    // Find the user
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Save address, phone, city if not already present in user profile
    let updatedUser = false;

    if (!user.address && address) {
      user.address = address;
      updatedUser = true;
    }

    if (!user.phone && phone) {
      user.phone = phone;
      updatedUser = true;
    }

    if (!user.city && city) {
      user.city = city;
      updatedUser = true;
    }

    if (updatedUser) {
      await user.save();
    }

    // Create new order with either user profile info or request info
    const newOrder = new Order({
      products,
      userId: req.user.id,
      address: user.address || address,
      phone: user.phone || phone,
      city: user.city || city,
      amount,
      paymentMethod: 'COD',
      status: 'Pending',
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

// Helper function to convert any date to Pakistan date string 'YYYY-MM-DD'
function toPakistanDateISOString(date) {
  const d = new Date(date);
  const pakistanOffset = 5 * 60; // 5 hours in minutes
  const localTime = new Date(d.getTime() + pakistanOffset * 60000);

  const year = localTime.getUTCFullYear();
  const month = String(localTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(localTime.getUTCDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

// GET: Metrics (Sales, Users, Recent Orders)
router.get('/get-metrics', isAuthorized, isAdmin, async (req, res) => {
  const { startDate, endDate } = req.query;

  try {
    const start = new Date(startDate || new Date().setMonth(new Date().getMonth() - 1));
    const end = new Date(endDate || new Date());

    // Get orders in date range
    const ordersInRange = await Order.find({ createdAt: { $gte: start, $lte: end } });
    const totalSales = ordersInRange.reduce((acc, order) => acc + Number(order.amount), 0);

    // Calculate sales grouped by Pakistan date for frontend filtering
    const salesByDateMap = {};
    ordersInRange.forEach(order => {
      const date = toPakistanDateISOString(order.createdAt);
      if (!salesByDateMap[date]) {
        salesByDateMap[date] = 0;
      }
      salesByDateMap[date] += Number(order.amount);
    });
    const salesByDate = Object.entries(salesByDateMap).map(([date, totalAmount]) => ({
      date,
      totalAmount,
    }));

    // Calculate last month sales for growth
    const lastMonth = new Date(new Date().setMonth(new Date().getMonth() - 2));
    const lastMonthOrders = await Order.find({ createdAt: { $gte: lastMonth, $lte: start } });
    const totalLastMonth = lastMonthOrders.reduce((acc, order) => acc + Number(order.amount), 0);

    const salesGrowth = totalLastMonth
      ? ((totalSales - totalLastMonth) / totalLastMonth) * 100
      : 0;

    // Calculate users growth
    const thisMonthUsers = await User.find({ createdAt: { $gte: start, $lte: end } });
    const lastMonthUsers = await User.find({ createdAt: { $gte: lastMonth, $lte: start } });

    const usersGrowth = lastMonthUsers.length
      ? ((thisMonthUsers.length - lastMonthUsers.length) / lastMonthUsers.length) * 100
      : 0;

    // Active now: orders in last hour
    const lastHour = new Date(new Date().setHours(new Date().getHours() - 1));
    const lastHourOrders = await Order.find({ createdAt: { $gte: lastHour, $lte: new Date() } });

    // Previous day orders for growth calc
    const previousDayOrders = await Order.find({
      createdAt: {
        $gte: new Date(new Date().setDate(new Date().getDate() - 1)),
        $lte: new Date(),
      },
    });

    const lastHourGrowth = previousDayOrders.length
      ? (lastHourOrders.length / previousDayOrders.length) * 100
      : 0;

    // Recent orders for display
    const recentOrders = await Order.find()
      .populate({ path: 'userId', select: 'name email' })
      .select('amount userId createdAt')
      .sort({ createdAt: -1 })
      .limit(10);

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
        salesByDate, // grouped by Pakistan date
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
});





module.exports = router;
