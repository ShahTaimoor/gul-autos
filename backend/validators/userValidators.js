const Joi = require('joi');

const signupOrLoginSchema = Joi.object({
  shopName: Joi.string().trim().required().messages({
    'string.empty': 'Shop name is required',
    'any.required': 'Shop name is required'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters long',
    'string.empty': 'Password is required',
    'any.required': 'Password is required'
  }),
  phone: Joi.string().trim().allow('').optional(),
  address: Joi.string().trim().allow('').optional(),
  city: Joi.string().trim().allow('').optional(),
  username: Joi.string().trim().allow('').optional(),
  rememberMe: Joi.boolean().optional()
});

const signupSchema = Joi.object({
  name: Joi.string().trim().required().messages({
    'string.empty': 'Shop name is required',
    'any.required': 'Shop name is required'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters long',
    'string.empty': 'Password is required',
    'any.required': 'Password is required'
  }),
  phone: Joi.string().trim().allow('').optional(),
  address: Joi.string().trim().allow('').optional(),
  city: Joi.string().trim().allow('').optional(),
  username: Joi.string().trim().allow('').optional()
});

const loginSchema = Joi.object({
  name: Joi.string().trim().required().messages({
    'string.empty': 'Shop name is required',
    'any.required': 'Shop name is required'
  }),
  password: Joi.string().required().messages({
    'string.empty': 'Password is required',
    'any.required': 'Password is required'
  }),
  rememberMe: Joi.boolean().optional()
});

const updateProfileSchema = Joi.object({
  name: Joi.string().trim().optional(),
  phone: Joi.string().trim().allow('').optional(),
  address: Joi.string().trim().allow('').optional(),
  city: Joi.string().trim().allow('').optional(),
  username: Joi.string().trim().allow('').optional()
});

const updateUserRoleSchema = Joi.object({
  role: Joi.number().valid(0, 1, 2).required().messages({
    'any.only': 'Invalid role value. Must be 0 (User), 1 (Admin), or 2 (Super Admin)',
    'any.required': 'Role is required'
  })
});

const changePasswordSchema = Joi.object({
  oldPassword: Joi.string().required().messages({
    'string.empty': 'Old password is required',
    'any.required': 'Old password is required'
  }),
  newPassword: Joi.string().min(6).required().messages({
    'string.min': 'New password must be at least 6 characters long',
    'string.empty': 'New password is required',
    'any.required': 'New password is required'
  }),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
    'any.only': 'New password and confirm password do not match',
    'any.required': 'Confirm password is required'
  })
});

const updateUsernameSchema = Joi.object({
  newUsername: Joi.string().trim().min(1).required().messages({
    'string.empty': 'Username is required',
    'string.min': 'Username is required',
    'any.required': 'Username is required'
  })
});

module.exports = {
  signupOrLoginSchema,
  signupSchema,
  loginSchema,
  updateProfileSchema,
  updateUserRoleSchema,
  changePasswordSchema,
  updateUsernameSchema
};

