const { orderRepository, productRepository, userRepository } = require('../repositories');
const { BadRequestError, NotFoundError } = require('../errors');

class OrderService {
  toPakistanDateISOString(date) {
    const d = new Date(date);
    const pakistanOffset = 5 * 60;
    const localTime = new Date(d.getTime() + pakistanOffset * 60000);

    const year = localTime.getUTCFullYear();
    const month = String(localTime.getUTCMonth() + 1).padStart(2, '0');
    const day = String(localTime.getUTCDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  async createOrder(orderData, userId) {
    const { products, address, amount, phone, city } = orderData;

    if (!products || products.length === 0) {
      throw new BadRequestError('No products provided');
    }

    for (const item of products) {
      const product = await productRepository.findById(item.id);

      if (!product) {
        throw new NotFoundError(`Product not found: ${item.id}`);
      }

      await productRepository.updateById(item.id, {
        $inc: { stock: -item.quantity }
      });
    }

    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const updateData = {};
    if (!user.address && address) {
      updateData.address = address;
    }
    if (!user.phone && phone) {
      updateData.phone = phone;
    }
    if (!user.city && city) {
      updateData.city = city;
    }

    if (Object.keys(updateData).length > 0) {
      await userRepository.updateById(userId, updateData);
    }

    const order = await orderRepository.create({
      products,
      userId,
      address: user.address || address,
      phone: user.phone || phone,
      city: user.city || city,
      amount,
      paymentMethod: 'COD',
      status: 'Pending'
    });

    return await orderRepository.findByIdWithPopulate(order._id, [
      {
        path: 'products.id',
        select: 'title price picture'
      }
    ]);
  }

  async updateOrderStatus(orderId, status, packerName) {
    if (!status) {
      throw new BadRequestError('Status is required');
    }

    const validStatuses = ['Pending', 'Completed'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const updateData = { status };
    if (packerName) {
      updateData.packerName = packerName;
    }

    const order = await orderRepository.updateById(orderId, updateData);
    if (!order) {
      throw new NotFoundError('Order not found');
    }

    return await orderRepository.findByIdWithPopulate(orderId, [
      {
        path: 'products.id',
        select: 'title price category picture'
      }
    ]);
  }

  async getOrdersByUserId(userId, page = 1, limit = 20) {
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, Math.min(parseInt(limit) || 20, 100)); // Max 100 per page
    const skip = (pageNum - 1) * limitNum;

    const orders = await orderRepository.find(
      { userId },
      {
        populate: [
          {
            path: 'products.id',
            select: 'title price category picture'
          }
        ],
        sort: { createdAt: -1 },
        skip,
        limit: limitNum
      }
    );

    const total = await orderRepository.countDocuments({ userId });

    return {
      orders,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    };
  }

  async getAllOrders(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const orders = await orderRepository.find(
      {},
      {
        populate: [
          {
            path: 'products.id',
            select: 'title price category picture'
          },
          {
            path: 'userId',
            select: 'name email username'
          }
        ],
        sort: { createdAt: -1 },
        skip,
        limit
      }
    );

    if (orders.length === 0) {
      throw new NotFoundError('Orders not found');
    }

    const totalOrders = await orderRepository.countDocuments({});

    return {
      orders,
      totalOrders,
      totalPages: Math.ceil(totalOrders / limit),
      currentPage: page
    };
  }

  async getMetrics(startDate, endDate) {
    const start = new Date(startDate || new Date().setMonth(new Date().getMonth() - 1));
    const end = new Date(endDate || new Date());

    const ordersInRange = await orderRepository.find({
      createdAt: { $gte: start, $lte: end }
    });

    const totalSales = ordersInRange.reduce((acc, order) => acc + Number(order.amount), 0);

    const salesByDateMap = {};
    ordersInRange.forEach(order => {
      const date = this.toPakistanDateISOString(order.createdAt);
      if (!salesByDateMap[date]) {
        salesByDateMap[date] = 0;
      }
      salesByDateMap[date] += Number(order.amount);
    });

    const salesByDate = Object.entries(salesByDateMap).map(([date, totalAmount]) => ({
      date,
      totalAmount
    }));

    const lastMonth = new Date(new Date().setMonth(new Date().getMonth() - 2));
    const lastMonthOrders = await orderRepository.find({
      createdAt: { $gte: lastMonth, $lte: start }
    });

    const totalLastMonth = lastMonthOrders.reduce((acc, order) => acc + Number(order.amount), 0);
    const salesGrowth = totalLastMonth
      ? ((totalSales - totalLastMonth) / totalLastMonth) * 100
      : 0;

    const thisMonthUsers = await userRepository.find({
      createdAt: { $gte: start, $lte: end }
    });

    const lastMonthUsers = await userRepository.find({
      createdAt: { $gte: lastMonth, $lte: start }
    });

    const usersGrowth = lastMonthUsers.length
      ? ((thisMonthUsers.length - lastMonthUsers.length) / lastMonthUsers.length) * 100
      : 0;

    const lastHour = new Date(new Date().setHours(new Date().getHours() - 1));
    const lastHourOrders = await orderRepository.find({
      createdAt: { $gte: lastHour, $lte: new Date() }
    });

    const previousDayOrders = await orderRepository.find({
      createdAt: {
        $gte: new Date(new Date().setDate(new Date().getDate() - 1)),
        $lte: new Date()
      }
    });

    const lastHourGrowth = previousDayOrders.length
      ? (lastHourOrders.length / previousDayOrders.length) * 100
      : 0;

    const recentOrders = await orderRepository.find(
      {},
      {
        populate: [
          {
            path: 'userId',
            select: 'name email username'
          }
        ],
        select: 'amount userId createdAt',
        sort: { createdAt: -1 },
        limit: 10
      }
    );

    return {
      totalSales: {
        count: totalSales.toFixed(2),
        growth: salesGrowth.toFixed(2)
      },
      users: {
        count: thisMonthUsers.length,
        growth: usersGrowth.toFixed(2)
      },
      sales: {
        count: totalSales.toFixed(2),
        growth: salesGrowth.toFixed(2)
      },
      activeNow: {
        count: lastHourOrders.length,
        growth: lastHourGrowth.toFixed(2)
      },
      recentSales: {
        count: totalSales.toFixed(2),
        orders: recentOrders
      },
      salesByDate
    };
  }

  async getPendingOrdersCount() {
    return await orderRepository.countDocuments({ status: 'Pending' });
  }

  async deleteOrder(orderId) {
    const order = await orderRepository.findByIdWithPopulate(orderId, [
      {
        path: 'products.id',
        select: 'title stock'
      }
    ]);

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    for (const item of order.products) {
      if (item.id) {
        const productId = item.id._id || item.id;
        const product = await productRepository.findById(productId);
        if (product) {
          await productRepository.updateById(productId, {
            $inc: { stock: item.quantity }
          });
        }
      }
    }

    await orderRepository.deleteById(orderId);
  }

  async bulkDeleteOrders(orderIds) {
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      throw new BadRequestError('Order IDs array is required');
    }

    const orders = await orderRepository.find(
      { _id: { $in: orderIds } },
      {
        populate: [
          {
            path: 'products.id',
            select: 'title stock'
          }
        ]
      }
    );

    if (orders.length === 0) {
      throw new NotFoundError('No orders found');
    }

    for (const order of orders) {
      for (const item of order.products) {
        if (item.id) {
          const productId = item.id._id || item.id;
          const product = await productRepository.findById(productId);
          if (product) {
            await productRepository.updateById(productId, {
              $inc: { stock: item.quantity }
            });
          }
        }
      }
    }

    const deleteResult = await orderRepository.deleteMany({ _id: { $in: orderIds } });

    return {
      deletedCount: deleteResult.deletedCount
    };
  }
}

module.exports = new OrderService();

