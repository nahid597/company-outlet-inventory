import { z } from "zod";

const genericUuidSchema = z
  .string()
  .regex(
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
    "Invalid UUID",
  );

export const inventoryOutletParamSchema = z.object({
  outletId: genericUuidSchema,
});

export const inventoryItemParamSchema = z.object({
  outletId: genericUuidSchema,
  outletMenuItemId: genericUuidSchema,
});

export const setInventorySchema = z.object({
  quantity: z.coerce.number().int().min(0),
});

export const adjustInventorySchema = z.object({
  delta: z.coerce
    .number()
    .int()
    .refine((value) => value !== 0, "Delta must be non-zero"),
});

export type SetInventoryInput = z.infer<typeof setInventorySchema>;
export type AdjustInventoryInput = z.infer<typeof adjustInventorySchema>;
