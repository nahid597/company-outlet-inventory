import { Repository } from "typeorm";

import { AppDataSource } from "../db/data-source";
import { Outlet } from "../entities/outlet.entity";

export class OutletRepository {
  private readonly repository: Repository<Outlet>;

  constructor() {
    this.repository = AppDataSource.getRepository(Outlet);
  }

  async listAll(): Promise<Outlet[]> {
    return this.repository.find({ order: { code: "ASC" } });
  }

  async findById(id: string): Promise<Outlet | null> {
    return this.repository.findOne({ where: { id } });
  }
}
