import { MenuItemRepository } from "../repositories/menu-item.repository";
import { OutletMenuItemRepository } from "../repositories/outlet-menu-item.repository";
import { OutletRepository } from "../repositories/outlet.repository";
import {
  AssignMenuItemInput,
  CreateMenuItemInput,
  UpdateMenuItemInput,
} from "../validators/menu.validator";
import { HttpError } from "../utils/http-error";

const toMoneyString = (value: number): string => value.toFixed(2);

export class MenuService {
  private readonly menuItemRepository: MenuItemRepository;
  private readonly outletRepository: OutletRepository;
  private readonly outletMenuItemRepository: OutletMenuItemRepository;

  constructor() {
    this.menuItemRepository = new MenuItemRepository();
    this.outletRepository = new OutletRepository();
    this.outletMenuItemRepository = new OutletMenuItemRepository();
  }

  async createMenuItem(input: CreateMenuItemInput) {
    return this.menuItemRepository.createAndSave({
      name: input.name,
      category: input.category ?? null,
      basePrice: toMoneyString(input.basePrice),
      description: input.description ?? null,
      isActive: input.isActive ?? true,
    });
  }

  async listMenuItems() {
    return this.menuItemRepository.listAll();
  }

  async updateMenuItem(menuItemId: string, input: UpdateMenuItemInput) {
    const existing = await this.menuItemRepository.findById(menuItemId);
    if (!existing) {
      throw new HttpError(404, "Menu item not found");
    }

    if (input.name !== undefined) {
      existing.name = input.name;
    }
    if (input.category !== undefined) {
      existing.category = input.category;
    }
    if (input.basePrice !== undefined) {
      existing.basePrice = toMoneyString(input.basePrice);
    }
    if (input.description !== undefined) {
      existing.description = input.description;
    }
    if (input.isActive !== undefined) {
      existing.isActive = input.isActive;
    }

    return this.menuItemRepository.save(existing);
  }

  async assignMenuItemToOutlet(
    outletId: string,
    menuItemId: string,
    input: AssignMenuItemInput,
  ) {
    const [outlet, menuItem] = await Promise.all([
      this.outletRepository.findById(outletId),
      this.menuItemRepository.findById(menuItemId),
    ]);

    if (!outlet) {
      throw new HttpError(404, "Outlet not found");
    }
    if (!menuItem) {
      throw new HttpError(404, "Menu item not found");
    }

    const existing =
      await this.outletMenuItemRepository.findByOutletAndMenuItem(
        outletId,
        menuItemId,
      );

    if (!existing) {
      return this.outletMenuItemRepository.createAndSave({
        outletId,
        menuItemId,
        overridePrice:
          input.overridePrice !== undefined && input.overridePrice !== null
            ? toMoneyString(input.overridePrice)
            : null,
        isAvailable: input.isAvailable ?? true,
      });
    }

    if (input.overridePrice !== undefined) {
      existing.overridePrice =
        input.overridePrice === null
          ? null
          : toMoneyString(input.overridePrice);
    }

    if (input.isAvailable !== undefined) {
      existing.isAvailable = input.isAvailable;
    }

    return this.outletMenuItemRepository.save(existing);
  }

  async listOutlets() {
    return this.outletRepository.listAll();
  }

  async getOutletAssignedMenu(outletId: string) {
    const outlet = await this.outletRepository.findById(outletId);
    if (!outlet) {
      throw new HttpError(404, "Outlet not found");
    }

    const assignments =
      await this.outletMenuItemRepository.listAssignedByOutlet(outletId);

    return {
      outlet: {
        id: outlet.id,
        code: outlet.code,
        name: outlet.name,
      },
      items: assignments.map((assignment) => ({
        assignmentId: assignment.id,
        menuItemId: assignment.menuItemId,
        name: assignment.menuItem.name,
        category: assignment.menuItem.category,
        basePrice: assignment.menuItem.basePrice,
        overridePrice: assignment.overridePrice,
        effectivePrice:
          assignment.overridePrice ?? assignment.menuItem.basePrice,
        description: assignment.menuItem.description,
      })),
    };
  }
}
