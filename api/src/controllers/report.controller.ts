import { NextFunction, Request, Response } from "express";

import { ReportService } from "../services/report.service";
import { reportOutletParamSchema } from "../validators/report.validator";

const reportService = new ReportService();

export const getRevenueByOutletReport = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const report = await reportService.getRevenueByOutlet();
    res.status(200).json(report);
  } catch (error) {
    next(error);
  }
};

export const getTopItemsByOutletReport = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { outletId } = reportOutletParamSchema.parse(req.params);
    const report = await reportService.getTopItemsByOutlet(outletId);
    res.status(200).json(report);
  } catch (error) {
    next(error);
  }
};
