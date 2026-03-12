import { z } from "zod";

const genericUuidSchema = z
  .string()
  .regex(
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
    "Invalid UUID",
  );

const nullableTrimmedString = z
  .string()
  .trim()
  .min(1)
  .max(500)
  .nullable()
  .optional();

export const uuidParamSchema = z.object({
  outletId: genericUuidSchema.optional(),
  menuItemId: genericUuidSchema.optional(),
});

export const menuItemParamSchema = z.object({
  menuItemId: genericUuidSchema,
});

export const outletParamSchema = z.object({
  outletId: genericUuidSchema,
});

export const outletMenuAssignmentParamSchema = z.object({
  outletId: genericUuidSchema,
  menuItemId: genericUuidSchema,
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
