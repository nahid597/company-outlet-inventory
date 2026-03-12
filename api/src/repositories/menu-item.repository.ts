import { Repository } from "typeorm";

import { AppDataSource } from "../db/data-source";
import { MenuItem } from "../entities/menu-item.entity";

export class MenuItemRepository {
  private readonly repository: Repository<MenuItem>;

  constructor() {
    this.repository = AppDataSource.getRepository(MenuItem);
  }

  async createAndSave(payload: Partial<MenuItem>): Promise<MenuItem> {
    const entity = this.repository.create(payload);
    return this.repository.save(entity);
  }

  async listAll(): Promise<MenuItem[]> {
    return this.repository.find({ order: { createdAt: "DESC" } });
  }

  async findById(id: string): Promise<MenuItem | null> {
    return this.repository.findOne({ where: { id } });
  }

  async save(menuItem: MenuItem): Promise<MenuItem> {
    return this.repository.save(menuItem);
  }
}
