import { z } from "zod";

import { uuidSchema } from "./common.validator";

export const reportOutletParamSchema = z.object({
  outletId: uuidSchema,
});
