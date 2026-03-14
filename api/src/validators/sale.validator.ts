import { z } from "zod";

import { uuidSchema } from "./common.validator";
import { outletParamSchema } from "./menu.validator";

const saleItemSchema = z.object({
  outletMenuItemId: uuidSchema,
  quantity: z.coerce.number().int().positive(),
});

export const saleOutletParamSchema = outletParamSchema;

export const createSaleSchema = z.object({
  items: z.array(saleItemSchema).min(1, "At least one sale item is required"),
});

export type CreateSaleInput = z.infer<typeof createSaleSchema>;
