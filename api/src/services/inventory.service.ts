import { OutletInventoryRepository } from "../repositories/outlet-inventory.repository";
import { OutletRepository } from "../repositories/outlet.repository";
import {
  AdjustInventoryInput,
  SetInventoryInput,
} from "../validators/inventory.validator";
import { HttpError } from "../utils/http-error";

type InventoryOutletSummary = {
  id: string;
  code: string;
  name: string;
};

type InventoryItemSummary = {
  outletMenuItemId: string;
  menuItemId: string;
  name: string;
  category: string | null;
  basePrice: string;
  overridePrice: string | null;
  effectivePrice: string;
  isAvailable: boolean;
  quantity: number;
  updatedAt: Date | null;
};

type InventoryListResponse = {
  outlet: InventoryOutletSummary;
  items: InventoryItemSummary[];
};

type InventoryMutationResponse = {
  item: InventoryItemSummary;
  note: string;
};

const toInventoryItem = (payload: {
  outletMenuItemId: string;
  menuItemId: string;
  name: string;
  category: string | null;
  basePrice: string;
  overridePrice: string | null;
  isAvailable: boolean;
  quantity: number;
  updatedAt: Date;
}): InventoryItemSummary => ({
  outletMenuItemId: payload.outletMenuItemId,
  menuItemId: payload.menuItemId,
  name: payload.name,
  category: payload.category,
  basePrice: payload.basePrice,
  overridePrice: payload.overridePrice,
  effectivePrice: payload.overridePrice ?? payload.basePrice,
  isAvailable: payload.isAvailable,
  quantity: payload.quantity,
  updatedAt: payload.updatedAt,
});

export class InventoryService {
  private readonly outletRepository: OutletRepository;
  private readonly inventoryRepository: OutletInventoryRepository;

  constructor() {
    this.outletRepository = new OutletRepository();
    this.inventoryRepository = new OutletInventoryRepository();
  }

  async getOutletInventory(outletId: string): Promise<InventoryListResponse> {
    const outlet = await this.outletRepository.findById(outletId);
    if (!outlet) {
      throw new HttpError(404, "Outlet not found");
    }

    const items = await this.inventoryRepository.listByOutlet(outletId);

    return {
      outlet: {
        id: outlet.id,
        code: outlet.code,
        name: outlet.name,
      },
      items,
    };
  }

  async setOutletInventoryQuantity(
    outletId: string,
    outletMenuItemId: string,
    input: SetInventoryInput,
  ): Promise<InventoryMutationResponse> {
    const outletMenuItem =
      await this.inventoryRepository.findOutletMenuItemById(
        outletId,
        outletMenuItemId,
      );

    if (!outletMenuItem) {
      throw new HttpError(404, "Outlet menu item not found for outlet");
    }

    const existing =
      await this.inventoryRepository.findByOutletMenuItemId(outletMenuItemId);

    const saved = existing
      ? await this.inventoryRepository.save(
          Object.assign(existing, { quantity: input.quantity }),
        )
      : await this.inventoryRepository.createAndSave({
          outletMenuItemId,
          quantity: input.quantity,
        });

    return {
      note: "Inventory quantity set successfully",
      item: toInventoryItem({
        outletMenuItemId: outletMenuItem.id,
        menuItemId: outletMenuItem.menuItemId,
        name: outletMenuItem.menuItem.name,
        category: outletMenuItem.menuItem.category,
        basePrice: outletMenuItem.menuItem.basePrice,
        overridePrice: outletMenuItem.overridePrice,
        isAvailable: outletMenuItem.isAvailable,
        quantity: saved.quantity,
        updatedAt: saved.updatedAt,
      }),
    };
  }

  async adjustOutletInventoryQuantity(
    outletId: string,
    outletMenuItemId: string,
    input: AdjustInventoryInput,
  ): Promise<InventoryMutationResponse> {
    const outletMenuItem =
      await this.inventoryRepository.findOutletMenuItemById(
        outletId,
        outletMenuItemId,
      );

    if (!outletMenuItem) {
      throw new HttpError(404, "Outlet menu item not found for outlet");
    }

    const existing =
      await this.inventoryRepository.findByOutletMenuItemId(outletMenuItemId);
    const previousQuantity = existing?.quantity ?? 0;
    const nextQuantity = previousQuantity + input.delta;

    if (nextQuantity < 0) {
      throw new HttpError(422, "Stock cannot go negative");
    }

    const saved = existing
      ? await this.inventoryRepository.save(
          Object.assign(existing, { quantity: nextQuantity }),
        )
      : await this.inventoryRepository.createAndSave({
          outletMenuItemId,
          quantity: nextQuantity,
        });

    return {
      note: `Inventory adjusted by ${input.delta}`,
      item: toInventoryItem({
        outletMenuItemId: outletMenuItem.id,
        menuItemId: outletMenuItem.menuItemId,
        name: outletMenuItem.menuItem.name,
        category: outletMenuItem.menuItem.category,
        basePrice: outletMenuItem.menuItem.basePrice,
        overridePrice: outletMenuItem.overridePrice,
        isAvailable: outletMenuItem.isAvailable,
        quantity: saved.quantity,
        updatedAt: saved.updatedAt,
      }),
    };
  }
}
