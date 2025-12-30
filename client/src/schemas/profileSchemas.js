import { z } from 'zod';

// Profile update schema
export const profileSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .trim(),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters')
    .trim(),
  phone: z
    .string()
    .optional()
    .refine((val) => {
      if (!val || val.trim() === '') return true; // Optional
      return /^[\d\s\-\+\(\)]+$/.test(val) && val.replace(/\D/g, '').length >= 10;
    }, 'Phone number must be valid (at least 10 digits)'),
  address: z
    .string()
    .max(500, 'Address must be less than 500 characters')
    .optional(),
  city: z
    .string()
    .max(100, 'City must be less than 100 characters')
    .optional()
});


