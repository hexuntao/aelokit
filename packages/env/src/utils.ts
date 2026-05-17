import { z } from 'zod';

export const booleanString = z
  .union([z.literal('true'), z.literal('false'), z.boolean()])
  .transform((value) => value === true || value === 'true');

export const optionalBooleanString = z
  .union([z.literal('true'), z.literal('false'), z.boolean()])
  .optional()
  .transform((value) => value === true || value === 'true');

export const optionalUrl = z.string().url().optional().or(z.literal(''));
export const optionalString = z.string().optional().or(z.literal(''));
