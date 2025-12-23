const express = require('express');
const orderController = require('../controllers/OrderController');
const { isAuthorized, isAdminOrSuperAdmin } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const {
  createOrderSchema,
  updateOrderStatusSchema,
  getAllOrdersQuerySchema,
  getMetricsQuerySchema,
  bulkDeleteOrdersSchema
} = require('../validators/orderValidators');

const router = express.Router();

router.post(
  '/order',
  isAuthorized,
  validate(createOrderSchema),
  orderController.createOrder
);

router.put(
  '/update-order-status/:id',
  isAuthorized,
  isAdminOrSuperAdmin,
  validate(updateOrderStatusSchema),
  orderController.updateOrderStatus
);

router.get(
  '/get-orders-by-user-id',
  isAuthorized,
  orderController.getOrdersByUserId
);

router.get(
  '/get-all-orders',
  isAuthorized,
  isAdminOrSuperAdmin,
  validate(getAllOrdersQuerySchema, 'query'),
  orderController.getAllOrders
);

router.get(
  '/get-metrics',
  isAuthorized,
  isAdminOrSuperAdmin,
  validate(getMetricsQuerySchema, 'query'),
  orderController.getMetrics
);

router.get(
  '/pending-orders-count',
  isAuthorized,
  isAdminOrSuperAdmin,
  orderController.getPendingOrdersCount
);

router.delete(
  '/delete-order/:id',
  isAuthorized,
  isAdminOrSuperAdmin,
  orderController.deleteOrder
);

router.delete(
  '/bulk-delete-orders',
  isAuthorized,
  isAdminOrSuperAdmin,
  validate(bulkDeleteOrdersSchema),
  orderController.bulkDeleteOrders
);

module.exports = router;
