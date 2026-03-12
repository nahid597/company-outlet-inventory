import { Router } from "express";

import healthRouter from "./health.route";
import hqRouter from "./hq.route";
import outletRouter from "./outlet.route";

const router = Router();

router.use(healthRouter);
router.use(hqRouter);
router.use(outletRouter);

export default router;
