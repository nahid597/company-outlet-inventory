import { NextFunction, Request, Response } from "express";

import { InventoryService } from "../services/inventory.service";
import {
  adjustInventorySchema,
  inventoryItemParamSchema,
  inventoryOutletParamSchema,
  setInventorySchema,
} from "../validators/inventory.validator";

const inventoryService = new InventoryService();

export const getOutletInventory = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { outletId } = inventoryOutletParamSchema.parse(req.params);
    const result = await inventoryService.getOutletInventory(outletId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const setOutletInventory = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { outletId, outletMenuItemId } = inventoryItemParamSchema.parse(
      req.params,
    );
    const payload = setInventorySchema.parse(req.body);
    const result = await inventoryService.setOutletInventoryQuantity(
      outletId,
      outletMenuItemId,
      payload,
    );

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const adjustOutletInventory = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { outletId, outletMenuItemId } = inventoryItemParamSchema.parse(
      req.params,
    );
    const payload = adjustInventorySchema.parse(req.body);
    const result = await inventoryService.adjustOutletInventoryQuantity(
      outletId,
      outletMenuItemId,
      payload,
    );

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
