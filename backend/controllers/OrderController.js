const orderService = require('../services/OrderService');

class OrderController {
  async createOrder(req, res, next) {
    try {
      const orderData = req.body;
      const userId = req.user.id;

      const order = await orderService.createOrder(orderData, userId);

      return res.status(201).json({
        success: true,
        data: order
      });
    } catch (error) {
      next(error);
    }
  }

  async updateOrderStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status, packerName } = req.body;

      const order = await orderService.updateOrderStatus(id, status, packerName);

      return res.status(200).json({
        success: true,
        message: 'Order status updated successfully',
        data: order
      });
    } catch (error) {
      next(error);
    }
  }

  async getOrdersByUserId(req, res, next) {
    try {
      const userId = req.user.id;
      const { page, limit } = req.query;

      const result = await orderService.getOrdersByUserId(userId, page, limit);

      return res.status(200).json({
        success: true,
        data: result.orders,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllOrders(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      const result = await orderService.getAllOrders(page, limit);

      return res.status(200).json({
        success: true,
        data: result.orders,
        totalOrders: result.totalOrders,
        totalPages: result.totalPages,
        currentPage: result.currentPage
      });
    } catch (error) {
      next(error);
    }
  }

  async getMetrics(req, res, next) {
    try {
      const { startDate, endDate } = req.query;

      const metrics = await orderService.getMetrics(startDate, endDate);

      return res.status(200).json({
        success: true,
        data: metrics
      });
    } catch (error) {
      next(error);
    }
  }

  async getPendingOrdersCount(req, res, next) {
    try {
      const count = await orderService.getPendingOrdersCount();

      return res.status(200).json({
        success: true,
        count
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteOrder(req, res, next) {
    try {
      const { id } = req.params;

      await orderService.deleteOrder(id);

      return res.status(200).json({
        success: true,
        message: 'Order deleted successfully and stock restored'
      });
    } catch (error) {
      next(error);
    }
  }

  async bulkDeleteOrders(req, res, next) {
    try {
      const { orderIds } = req.body;

      const result = await orderService.bulkDeleteOrders(orderIds);

      return res.status(200).json({
        success: true,
        message: `${result.deletedCount} orders deleted successfully and stock restored`,
        deletedCount: result.deletedCount
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new OrderController();

