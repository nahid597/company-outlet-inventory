import { Router } from "express";

import {
  assignMenuItemToOutlet,
  createMenuItem,
  listMenuItems,
  listOutlets,
  updateMenuItem,
} from "../controllers/menu.controller";

const hqRouter = Router();

hqRouter.get("/hq/menu-items", listMenuItems);
hqRouter.post("/hq/menu-items", createMenuItem);
hqRouter.patch("/hq/menu-items/:menuItemId", updateMenuItem);

hqRouter.get("/hq/outlets", listOutlets);
hqRouter.put(
  "/hq/outlets/:outletId/menu-items/:menuItemId",
  assignMenuItemToOutlet,
);

export default hqRouter;
