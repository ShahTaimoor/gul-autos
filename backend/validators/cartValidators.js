const Joi = require('joi');

const addItemSchema = Joi.object({
  productId: Joi.string().required().pattern(/^[0-9a-fA-F]{24}$/).messages({
    'string.empty': 'Product ID is required',
    'string.pattern.base': 'Product ID must be a valid MongoDB ObjectId',
    'any.required': 'Product ID is required'
  }),
  quantity: Joi.number().integer().min(1).required().messages({
    'number.base': 'Quantity must be a number',
    'number.integer': 'Quantity must be an integer',
    'number.min': 'Quantity must be at least 1',
    'any.required': 'Quantity is required'
  })
});

const removeItemSchema = Joi.object({
  productId: Joi.string().required().pattern(/^[0-9a-fA-F]{24}$/).messages({
    'string.empty': 'Product ID is required',
    'string.pattern.base': 'Product ID must be a valid MongoDB ObjectId',
    'any.required': 'Product ID is required'
  })
});

const updateItemQuantitySchema = Joi.object({
  productId: Joi.string().required().pattern(/^[0-9a-fA-F]{24}$/).messages({
    'string.empty': 'Product ID is required',
    'string.pattern.base': 'Product ID must be a valid MongoDB ObjectId',
    'any.required': 'Product ID is required'
  }),
  quantity: Joi.number().integer().min(1).required().messages({
    'number.base': 'Quantity must be a number',
    'number.integer': 'Quantity must be an integer',
    'number.min': 'Quantity must be at least 1',
    'any.required': 'Quantity is required'
  })
});

const checkStockSchema = Joi.object({
  products: Joi.array().items(
    Joi.object({
      id: Joi.string().optional(),
      productId: Joi.string().optional(),
      quantity: Joi.number().integer().min(1).required()
    }).or('id', 'productId')
  ).min(1).required().messages({
    'array.base': 'Products must be an array',
    'array.min': 'At least one product is required',
    'any.required': 'Products array is required'
  })
});

module.exports = {
  addItemSchema,
  removeItemSchema,
  updateItemQuantitySchema,
  checkStockSchema
};

