const Joi = require('joi');

const createCategorySchema = Joi.object({
  name: Joi.string().trim().required().messages({
    'string.empty': 'Category name is required',
    'any.required': 'Category name is required'
  })
});

const updateCategorySchema = Joi.object({
  name: Joi.string().trim().required().messages({
    'string.empty': 'Category name is required',
    'any.required': 'Category name is required'
  }),
  position: Joi.number().integer().min(1).optional(),
  active: Joi.boolean().optional()
});

const getAllCategoriesQuerySchema = Joi.object({
  search: Joi.string().trim().allow('').optional()
});

module.exports = {
  createCategorySchema,
  updateCategorySchema,
  getAllCategoriesQuerySchema
};

