const Joi = require('joi');

const getAllMediaQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).optional()
});

const bulkDeleteMediaSchema = Joi.object({
  ids: Joi.array().items(Joi.string()).min(1).required().messages({
    'array.base': 'Media IDs must be an array',
    'array.min': 'At least one media ID is required',
    'any.required': 'Media IDs array is required'
  })
});

module.exports = {
  getAllMediaQuerySchema,
  bulkDeleteMediaSchema
};

