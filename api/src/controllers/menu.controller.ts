import { NextFunction, Request, Response } from "express";

import { MenuService } from "../services/menu.service";
import {
  assignMenuItemSchema,
  createMenuItemSchema,
  menuItemParamSchema,
  outletMenuAssignmentParamSchema,
  outletParamSchema,
  updateMenuItemSchema,
} from "../validators/menu.validator";

const menuService = new MenuService();

export const createMenuItem = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const payload = createMenuItemSchema.parse(req.body);
    const created = await menuService.createMenuItem(payload);
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
};

export const listMenuItems = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const menuItems = await menuService.listMenuItems();
    res.status(200).json(menuItems);
  } catch (error) {
    next(error);
  }
};

export const updateMenuItem = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { menuItemId } = menuItemParamSchema.parse(req.params);
    const payload = updateMenuItemSchema.parse(req.body);
    const updated = await menuService.updateMenuItem(menuItemId, payload);
    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
};

export const assignMenuItemToOutlet = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { outletId, menuItemId } = outletMenuAssignmentParamSchema.parse(
      req.params,
    );
    const payload = assignMenuItemSchema.parse(req.body);
    const assignment = await menuService.assignMenuItemToOutlet(
      outletId,
      menuItemId,
      payload,
    );

    res.status(200).json(assignment);
  } catch (error) {
    next(error);
  }
};

export const listOutlets = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const outlets = await menuService.listOutlets();
    res.status(200).json(outlets);
  } catch (error) {
    next(error);
  }
};

export const getOutletMenu = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { outletId } = outletParamSchema.parse(req.params);
    const result = await menuService.getOutletAssignedMenu(outletId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
