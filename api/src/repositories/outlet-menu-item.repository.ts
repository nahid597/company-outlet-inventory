import { Repository } from "typeorm";

import { AppDataSource } from "../db/data-source";
import { OutletMenuItem } from "../entities/outlet-menu-item.entity";

export class OutletMenuItemRepository {
  private readonly repository: Repository<OutletMenuItem>;

  constructor() {
    this.repository = AppDataSource.getRepository(OutletMenuItem);
  }

  async findByOutletAndMenuItem(
    outletId: string,
    menuItemId: string,
  ): Promise<OutletMenuItem | null> {
    return this.repository.findOne({
      where: { outletId, menuItemId },
      relations: { menuItem: true },
    });
  }

  async createAndSave(
    payload: Partial<OutletMenuItem>,
  ): Promise<OutletMenuItem> {
    const entity = this.repository.create(payload);
    return this.repository.save(entity);
  }

  async save(entity: OutletMenuItem): Promise<OutletMenuItem> {
    return this.repository.save(entity);
  }

  async listAssignedByOutlet(
    outletId: string,
    includeUnavailable = false,
  ): Promise<OutletMenuItem[]> {
    return this.repository.find({
      where: includeUnavailable
        ? { outletId }
        : { outletId, isAvailable: true },
      relations: { menuItem: true },
      order: { createdAt: "ASC" },
    });
  }
}
