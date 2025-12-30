import { z } from 'zod';

// Login schema (minimal fields)
export const loginSchema = z.object({
  shopName: z
    .string()
    .min(1, 'Shop name is required')
    .min(2, 'Shop name must be at least 2 characters')
    .max(100, 'Shop name must be less than 100 characters')
    .trim(),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must be less than 100 characters')
});

// Signup schema (all fields)
export const signupSchema = z.object({
  shopName: z
    .string()
    .min(1, 'Shop name is required')
    .min(2, 'Shop name must be at least 2 characters')
    .max(100, 'Shop name must be less than 100 characters')
    .trim(),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must be less than 100 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  phone: z
    .string()
    .optional()
    .refine((val) => {
      if (!val || val.trim() === '') return true; // Optional
      // Basic phone validation (allows various formats)
      return /^[\d\s\-\+\(\)]+$/.test(val) && val.replace(/\D/g, '').length >= 10;
    }, 'Phone number must be valid (at least 10 digits)'),
  address: z
    .string()
    .max(500, 'Address must be less than 500 characters')
    .optional(),
  city: z
    .string()
    .max(100, 'City must be less than 100 characters')
    .optional(),
  username: z
    .string()
    .max(50, 'Username must be less than 50 characters')
    .optional()
});

// Combined schema that validates based on whether it's login or signup
export const authSchema = z.object({
  shopName: z
    .string()
    .min(1, 'Shop name is required')
    .min(2, 'Shop name must be at least 2 characters')
    .max(100, 'Shop name must be less than 100 characters')
    .trim(),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must be less than 100 characters'),
  phone: z
    .string()
    .optional(),
  address: z
    .string()
    .max(500, 'Address must be less than 500 characters')
    .optional(),
  city: z
    .string()
    .max(100, 'City must be less than 100 characters')
    .optional(),
  username: z
    .string()
    .max(50, 'Username must be less than 50 characters')
    .optional()
}).refine((data) => {
  // If phone, address, city, or username is provided, it's a signup
  const isSignup = !!(data.phone?.trim() || data.address?.trim() || data.city?.trim() || data.username?.trim());
  if (isSignup) {
    // For signup, validate password strength
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(data.password);
  }
  return true;
}, {
  message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  path: ['password']
});


