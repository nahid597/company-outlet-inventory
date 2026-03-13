import { Router } from "express";

import {
  adjustOutletInventory,
  getOutletInventory,
  setOutletInventory,
} from "../controllers/inventory.controller";
import { getOutletMenu } from "../controllers/menu.controller";

const outletRouter = Router();

outletRouter.get("/outlets/:outletId/menu-items", getOutletMenu);
outletRouter.get("/outlets/:outletId/inventory", getOutletInventory);
outletRouter.put(
  "/outlets/:outletId/inventory/:outletMenuItemId",
  setOutletInventory,
);
outletRouter.patch(
  "/outlets/:outletId/inventory/:outletMenuItemId",
  adjustOutletInventory,
);

export default outletRouter;
