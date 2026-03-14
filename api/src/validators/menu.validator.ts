import { z } from "zod";

import { uuidSchema } from "./common.validator";

const nullableTrimmedString = z
  .string()
  .trim()
  .min(1)
  .max(500)
  .nullable()
  .optional();

export const uuidParamSchema = z.object({
  outletId: uuidSchema.optional(),
  menuItemId: uuidSchema.optional(),
});

export const menuItemParamSchema = z.object({
  menuItemId: uuidSchema,
});

export const outletParamSchema = z.object({
  outletId: uuidSchema,
});

export const outletMenuAssignmentParamSchema = z.object({
  outletId: uuidSchema,
  menuItemId: uuidSchema,
});

export const createMenuItemSchema = z.object({
  name: z.string().trim().min(1).max(150),
  category: z.string().trim().min(1).max(100).nullable().optional(),
  basePrice: z.coerce.number().min(0),
  description: nullableTrimmedString,
  isActive: z.boolean().optional(),
});

export const updateMenuItemSchema = z
  .object({
    name: z.string().trim().min(1).max(150).optional(),
    category: z.string().trim().min(1).max(100).nullable().optional(),
    basePrice: z.coerce.number().min(0).optional(),
    description: nullableTrimmedString,
    isActive: z.boolean().optional(),
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: "At least one field is required for update",
  });

export const assignMenuItemSchema = z.object({
  overridePrice: z.union([z.null(), z.coerce.number().min(0)]).optional(),
  isAvailable: z.boolean().optional(),
});

export type CreateMenuItemInput = z.infer<typeof createMenuItemSchema>;
export type UpdateMenuItemInput = z.infer<typeof updateMenuItemSchema>;
export type AssignMenuItemInput = z.infer<typeof assignMenuItemSchema>;
