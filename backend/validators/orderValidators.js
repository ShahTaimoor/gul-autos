const Joi = require('joi');

const createOrderSchema = Joi.object({
  products: Joi.array().items(
    Joi.object({
      id: Joi.string().required().messages({
        'string.empty': 'Product ID is required',
        'any.required': 'Product ID is required'
      }),
      quantity: Joi.number().integer().min(1).required().messages({
        'number.base': 'Quantity must be a number',
        'number.integer': 'Quantity must be an integer',
        'number.min': 'Quantity must be at least 1',
        'any.required': 'Quantity is required'
      })
    })
  ).min(1).required().messages({
    'array.base': 'Products must be an array',
    'array.min': 'At least one product is required',
    'any.required': 'Products are required'
  }),
  address: Joi.string().trim().optional(),
  amount: Joi.string().required().messages({
    'string.empty': 'Amount is required',
    'any.required': 'Amount is required'
  }),
  phone: Joi.string().trim().optional(),
  city: Joi.string().trim().optional()
});

const updateOrderStatusSchema = Joi.object({
  status: Joi.string().valid('Pending', 'Completed').required().messages({
    'any.only': 'Status must be either Pending or Completed',
    'any.required': 'Status is required'
  }),
  packerName: Joi.string().trim().allow('').optional()
});

const getAllOrdersQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).optional()
});

const getMetricsQuerySchema = Joi.object({
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional()
});

const bulkDeleteOrdersSchema = Joi.object({
  orderIds: Joi.array().items(Joi.string()).min(1).required().messages({
    'array.base': 'Order IDs must be an array',
    'array.min': 'At least one order ID is required',
    'any.required': 'Order IDs array is required'
  })
});

module.exports = {
  createOrderSchema,
  updateOrderStatusSchema,
  getAllOrdersQuerySchema,
  getMetricsQuerySchema,
  bulkDeleteOrdersSchema
};

