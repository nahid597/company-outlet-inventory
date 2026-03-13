import { Repository } from "typeorm";

import { AppDataSource } from "../db/data-source";
import { OutletInventory } from "../entities/outlet-inventory.entity";
import { OutletMenuItem } from "../entities/outlet-menu-item.entity";

type RawInventoryRow = {
  outletMenuItemId: string;
  menuItemId: string;
  name: string;
  category: string | null;
  basePrice: string;
  overridePrice: string | null;
  isAvailable: boolean;
  quantity: string | null;
  updatedAt: Date | null;
};

export type OutletInventoryListRow = {
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

const toRow = (raw: RawInventoryRow): OutletInventoryListRow => ({
  outletMenuItemId: raw.outletMenuItemId,
  menuItemId: raw.menuItemId,
  name: raw.name,
  category: raw.category,
  basePrice: raw.basePrice,
  overridePrice: raw.overridePrice,
  effectivePrice: raw.overridePrice ?? raw.basePrice,
  isAvailable: raw.isAvailable,
  quantity: Number(raw.quantity ?? 0),
  updatedAt: raw.updatedAt,
});

export class OutletInventoryRepository {
  private readonly inventoryRepository: Repository<OutletInventory>;
  private readonly outletMenuItemRepository: Repository<OutletMenuItem>;

  constructor() {
    this.inventoryRepository = AppDataSource.getRepository(OutletInventory);
    this.outletMenuItemRepository = AppDataSource.getRepository(OutletMenuItem);
  }

  async listByOutlet(outletId: string): Promise<OutletInventoryListRow[]> {
    const rows = await this.outletMenuItemRepository
      .createQueryBuilder("omi")
      .innerJoin("omi.menuItem", "mi")
      .leftJoin(OutletInventory, "oi", "oi.outlet_menu_item_id = omi.id")
      .where("omi.outlet_id = :outletId", { outletId })
      .select([
        'omi.id AS "outletMenuItemId"',
        'omi.menu_item_id AS "menuItemId"',
        'omi.override_price AS "overridePrice"',
        'omi.is_available AS "isAvailable"',
        'mi.name AS "name"',
        'mi.category AS "category"',
        'mi.base_price AS "basePrice"',
        'oi.quantity AS "quantity"',
        'oi.updated_at AS "updatedAt"',
      ])
      .orderBy("omi.created_at", "ASC")
      .getRawMany<RawInventoryRow>();

    return rows.map(toRow);
  }

  async findOutletMenuItemById(
    outletId: string,
    outletMenuItemId: string,
  ): Promise<OutletMenuItem | null> {
    return this.outletMenuItemRepository.findOne({
      where: {
        id: outletMenuItemId,
        outletId,
      },
      relations: {
        menuItem: true,
      },
    });
  }

  async findByOutletMenuItemId(
    outletMenuItemId: string,
  ): Promise<OutletInventory | null> {
    return this.inventoryRepository.findOne({
      where: {
        outletMenuItemId,
      },
    });
  }

  async createAndSave(
    payload: Partial<OutletInventory>,
  ): Promise<OutletInventory> {
    const entity = this.inventoryRepository.create(payload);
    return this.inventoryRepository.save(entity);
  }

  async save(entity: OutletInventory): Promise<OutletInventory> {
    return this.inventoryRepository.save(entity);
  }
}
