// lib/api-utils/validation.ts
import { z, ZodSchema } from 'zod';

export function validateBody<T>(schema: ZodSchema<T>, body: unknown): T {
  const result = schema.safeParse(body);
  
  if (!result.success) {
    const errors = result.error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
    throw new Error(`Validation failed: ${errors.join(', ')}`);
  }
  
  return result.data;
}

export function validateQuery<T>(schema: ZodSchema<T>, query: URLSearchParams): T {
  const queryObject = Object.fromEntries(query.entries());
  return validateBody(schema, queryObject);
}

// Common validation schemas
export const paginationSchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1).optional(),
  limit: z.string().transform(val => Math.min(parseInt(val) || 10, 100)).optional(),
});

export const usernameSchema = z.object({
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_-]+$/)
});

export const projectCreateSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  short_description: z.string().min(1).max(255),
  year: z.number().min(1900).max(new Date().getFullYear() + 1),
  roles: z.array(z.string()).min(1),
  client_ids: z.array(z.string()).optional(),
  thumbnail_url: z.string().url().optional(),
});

export const searchSchema = z.object({
  q: z.string().min(1),
  role: z.string().optional(),
  content_type: z.enum(['all', 'videos', 'images']).optional(),
  page: z.string().transform(val => parseInt(val) || 1).optional(),
  limit: z.string().transform(val => Math.min(parseInt(val) || 10, 50)).optional(),
  subjects: z.string().optional(), // comma-separated
  styles: z.string().optional(), // comma-separated
  max_budget: z.string().transform(val => parseInt(val)).optional(),
});

export const creatorUpdateSchema = z.object({
  first_name: z.string().min(1).max(50).optional(),
  last_name: z.string().min(1).max(50).optional(),
  bio: z.string().max(500).optional(),
  location: z.string().max(100).optional(),
  website: z.string().url().optional(),
  primary_role: z.array(z.string()).optional(),
  social_links: z.record(z.string()).optional(),
});