import { z } from "zod";

import { uuidSchema } from "./common.validator";

export const inventoryOutletParamSchema = z.object({
  outletId: uuidSchema,
});

export const inventoryItemParamSchema = z.object({
  outletId: uuidSchema,
  outletMenuItemId: uuidSchema,
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
