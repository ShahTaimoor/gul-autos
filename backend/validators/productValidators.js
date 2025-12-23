const Joi = require('joi');

const createProductSchema = Joi.object({
  title: Joi.string().trim().required().messages({
    'string.empty': 'Title is required',
    'any.required': 'Title is required'
  }),
  description: Joi.string().trim().allow('').optional(),
  price: Joi.number().positive().required().messages({
    'number.base': 'Price must be a number',
    'number.positive': 'Price must be positive',
    'any.required': 'Price is required'
  }),
  category: Joi.string().required().messages({
    'string.empty': 'Category is required',
    'any.required': 'Category is required'
  }),
  stock: Joi.number().integer().min(0).required().messages({
    'number.base': 'Stock must be a number',
    'number.integer': 'Stock must be an integer',
    'number.min': 'Stock cannot be negative',
    'any.required': 'Stock is required'
  }),
  isFeatured: Joi.boolean().optional()
});

const updateProductSchema = Joi.object({
  title: Joi.string().trim().optional(),
  description: Joi.string().trim().allow('').optional(),
  price: Joi.number().positive().optional().messages({
    'number.base': 'Price must be a number',
    'number.positive': 'Price must be positive'
  }),
  category: Joi.string().optional(),
  stock: Joi.number().integer().min(0).optional().messages({
    'number.base': 'Stock must be a number',
    'number.integer': 'Stock must be an integer',
    'number.min': 'Stock cannot be negative'
  }),
  isFeatured: Joi.boolean().optional()
});

const updateProductStockSchema = Joi.object({
  stock: Joi.number().integer().required().messages({
    'number.base': 'Stock must be a number',
    'number.integer': 'Stock must be an integer',
    'any.required': 'Stock value is required'
  })
});

const bulkUpdateFeaturedSchema = Joi.object({
  productIds: Joi.array().items(Joi.string()).min(1).required().messages({
    'array.base': 'Product IDs must be an array',
    'array.min': 'At least one product ID is required',
    'any.required': 'Product IDs array is required'
  }),
  isFeatured: Joi.boolean().required().messages({
    'boolean.base': 'isFeatured must be a boolean',
    'any.required': 'isFeatured value is required'
  })
});

const getProductsQuerySchema = Joi.object({
  category: Joi.string().trim().allow('').optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.alternatives().try(
    Joi.number().integer().min(1),
    Joi.string().valid('all')
  ).optional(),
  stockFilter: Joi.string().valid('active', 'out-of-stock', 'low-stock', 'all').optional(),
  sortBy: Joi.string().valid('az', 'za', 'price-low', 'price-high', 'newest', 'oldest', 'stock-high', 'stock-low', 'relevance').optional()
});

const searchQuerySchema = Joi.object({
  q: Joi.string().trim().min(1).required().messages({
    'string.empty': 'Search query is required',
    'string.min': 'Search query cannot be empty',
    'any.required': 'Search query is required'
  }),
  limit: Joi.number().integer().min(1).max(100).optional(),
  page: Joi.number().integer().min(1).optional()
});

const searchSuggestionsQuerySchema = Joi.object({
  q: Joi.string().trim().min(2).optional(),
  limit: Joi.number().integer().min(1).max(8).optional()
});

module.exports = {
  createProductSchema,
  updateProductSchema,
  updateProductStockSchema,
  bulkUpdateFeaturedSchema,
  getProductsQuerySchema,
  searchQuerySchema,
  searchSuggestionsQuerySchema
};

