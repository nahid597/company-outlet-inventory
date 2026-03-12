import { Router } from "express";

import { getOutletMenu } from "../controllers/menu.controller";

const outletRouter = Router();

outletRouter.get("/outlets/:outletId/menu-items", getOutletMenu);

export default outletRouter;
