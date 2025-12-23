const Joi = require('joi');

const signupSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).required().messages({
    'string.empty': 'Name is required',
    'string.min': 'Name must be at least 2 characters',
    'string.max': 'Name must be less than 50 characters',
    'any.required': 'Name is required'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters long',
    'string.empty': 'Password is required',
    'any.required': 'Password is required'
  }),
  phone: Joi.string().trim().allow('').optional(),
  username: Joi.string().trim().allow('').optional(),
  address: Joi.string().trim().allow('').optional(),
  city: Joi.string().trim().allow('').optional()
});

const loginSchema = Joi.object({
  name: Joi.string().trim().required().messages({
    'string.empty': 'Name is required',
    'any.required': 'Name is required'
  }),
  password: Joi.string().required().messages({
    'string.empty': 'Password is required',
    'any.required': 'Password is required'
  })
});

const updateProfileSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).optional(),
  phone: Joi.string().trim().allow('').optional(),
  username: Joi.string().trim().allow('').optional(),
  address: Joi.string().trim().allow('').optional(),
  city: Joi.string().trim().allow('').optional()
});

module.exports = {
  signupSchema,
  loginSchema,
  updateProfileSchema
};

