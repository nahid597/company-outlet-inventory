import { NextFunction, Request, Response } from "express";

import { SaleService } from "../services/sale.service";
import {
  createSaleSchema,
  saleOutletParamSchema,
} from "../validators/sale.validator";

const saleService = new SaleService();

export const getRecentOutletSales = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { outletId } = saleOutletParamSchema.parse(req.params);
    const payload = await saleService.listRecentSales(outletId);

    res.status(200).json(payload);
  } catch (error) {
    next(error);
  }
};

export const createOutletSale = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { outletId } = saleOutletParamSchema.parse(req.params);
    const payload = createSaleSchema.parse(req.body);
    const receipt = await saleService.createSale(outletId, payload);

    res.status(201).json(receipt);
  } catch (error) {
    next(error);
  }
};
