import { In } from "typeorm";

import { AppDataSource } from "../db/data-source";
import { OutletInventory } from "../entities/outlet-inventory.entity";
import { OutletMenuItem } from "../entities/outlet-menu-item.entity";
import { OutletReceiptSequence } from "../entities/outlet-receipt-sequence.entity";
import { Outlet } from "../entities/outlet.entity";
import { SaleItem } from "../entities/sale-item.entity";
import { Sale } from "../entities/sale.entity";
import { OutletRepository } from "../repositories/outlet.repository";
import { HttpError } from "../utils/http-error";
import { centsToMoneyString, moneyToCents } from "../utils/money";
import { CreateSaleInput } from "../validators/sale.validator";

type NormalizedSaleItem = {
  outletMenuItemId: string;
  quantity: number;
};

type ReceiptLine = {
  outletMenuItemId: string;
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: string;
  subtotal: string;
  remainingStock: number;
};

type SaleReceipt = {
  saleId: string;
  receiptNumber: string;
  totalAmount: string;
  createdAt: Date;
  outlet: {
    id: string;
    code: string;
    name: string;
  };
  items: ReceiptLine[];
};

type RecentSaleItem = {
  saleItemId: string;
  outletMenuItemId: string;
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: string;
  subtotal: string;
};

type RecentSale = {
  saleId: string;
  receiptNumber: string;
  totalAmount: string;
  createdAt: Date;
  itemCount: number;
  items: RecentSaleItem[];
};

type RecentSalesResponse = {
  outlet: {
    id: string;
    code: string;
    name: string;
  };
  sales: RecentSale[];
};

const normalizeSaleItems = (
  items: CreateSaleInput["items"],
): NormalizedSaleItem[] => {
  const groupedItems = new Map<string, number>();

  for (const item of items) {
    groupedItems.set(
      item.outletMenuItemId,
      (groupedItems.get(item.outletMenuItemId) ?? 0) + item.quantity,
    );
  }

  return Array.from(groupedItems.entries())
    .map(([outletMenuItemId, quantity]) => ({ outletMenuItemId, quantity }))
    .sort((left, right) =>
      left.outletMenuItemId.localeCompare(right.outletMenuItemId),
    );
};

const buildReceiptNumber = (
  outletCode: string,
  sequenceNumber: number,
  createdAt: Date,
): string => {
  const year = createdAt.getUTCFullYear();
  const month = String(createdAt.getUTCMonth() + 1).padStart(2, "0");
  const day = String(createdAt.getUTCDate()).padStart(2, "0");

  return `${outletCode}-${year}${month}${day}-${String(sequenceNumber).padStart(4, "0")}`;
};

export class SaleService {
  private readonly outletRepository: OutletRepository;

  constructor() {
    this.outletRepository = new OutletRepository();
  }

  async createSale(
    outletId: string,
    input: CreateSaleInput,
  ): Promise<SaleReceipt> {
    const normalizedItems = normalizeSaleItems(input.items);
    const outlet = await this.outletRepository.findById(outletId);

    if (!outlet) {
      throw new HttpError(404, "Outlet not found");
    }

    return AppDataSource.transaction(async (manager) => {
      const assignmentRepository = manager.getRepository(OutletMenuItem);
      const inventoryRepository = manager.getRepository(OutletInventory);
      const receiptSequenceRepository = manager.getRepository(
        OutletReceiptSequence,
      );
      const saleRepository = manager.getRepository(Sale);

      const assignments = await assignmentRepository.find({
        where: {
          id: In(normalizedItems.map((item) => item.outletMenuItemId)),
          outletId,
          isAvailable: true,
        },
        relations: {
          menuItem: true,
        },
      });

      if (assignments.length !== normalizedItems.length) {
        throw new HttpError(
          422,
          "One or more sale items are not assigned or available for this outlet",
        );
      }

      const assignmentMap = new Map(
        assignments.map((assignment) => [assignment.id, assignment]),
      );
      const lockedInventories = await inventoryRepository
        .createQueryBuilder("inventory")
        .where("inventory.outlet_menu_item_id IN (:...itemIds)", {
          itemIds: normalizedItems.map((item) => item.outletMenuItemId),
        })
        .orderBy("inventory.outlet_menu_item_id", "ASC")
        .setLock("pessimistic_write")
        .getMany();

      const inventoryMap = new Map(
        lockedInventories.map((inventory) => [
          inventory.outletMenuItemId,
          inventory,
        ]),
      );

      const receiptTimestamp = new Date();
      await receiptSequenceRepository
        .createQueryBuilder()
        .insert()
        .into(OutletReceiptSequence)
        .values({ outletId, lastSequence: 0 })
        .orIgnore()
        .execute();

      const receiptSequence = await receiptSequenceRepository
        .createQueryBuilder("sequence")
        .where("sequence.outlet_id = :outletId", { outletId })
        .setLock("pessimistic_write")
        .getOne();

      if (!receiptSequence) {
        throw new HttpError(500, "Failed to lock receipt sequence for outlet");
      }

      let totalAmountInCents = 0;
      const receiptLines: ReceiptLine[] = [];
      const saleItems: SaleItem[] = [];
      const updatedInventories: OutletInventory[] = [];

      for (const item of normalizedItems) {
        const assignment = assignmentMap.get(item.outletMenuItemId);

        if (!assignment) {
          throw new HttpError(422, "Sale item is not assigned to the outlet");
        }

        const inventory = inventoryMap.get(item.outletMenuItemId);
        const availableStock = inventory?.quantity ?? 0;

        if (availableStock < item.quantity) {
          throw new HttpError(
            422,
            `Insufficient stock for ${assignment.menuItem.name}. Available: ${availableStock}, requested: ${item.quantity}`,
          );
        }

        const nextQuantity = availableStock - item.quantity;
        const unitPrice =
          assignment.overridePrice ?? assignment.menuItem.basePrice;
        const unitPriceInCents = moneyToCents(unitPrice);
        const subtotalInCents = unitPriceInCents * item.quantity;

        totalAmountInCents += subtotalInCents;

        if (inventory) {
          inventory.quantity = nextQuantity;
          updatedInventories.push(inventory);
        }

        saleItems.push(
          manager.getRepository(SaleItem).create({
            outletMenuItemId: item.outletMenuItemId,
            quantity: item.quantity,
            unitPrice: centsToMoneyString(unitPriceInCents),
            subtotal: centsToMoneyString(subtotalInCents),
          }),
        );

        receiptLines.push({
          outletMenuItemId: item.outletMenuItemId,
          menuItemId: assignment.menuItemId,
          name: assignment.menuItem.name,
          quantity: item.quantity,
          unitPrice: centsToMoneyString(unitPriceInCents),
          subtotal: centsToMoneyString(subtotalInCents),
          remainingStock: nextQuantity,
        });
      }

      receiptSequence.lastSequence += 1;
      await receiptSequenceRepository.save(receiptSequence);

      const receiptNumber = buildReceiptNumber(
        outlet.code,
        receiptSequence.lastSequence,
        receiptTimestamp,
      );

      const sale = saleRepository.create({
        outletId: outlet.id,
        receiptNumber,
        totalAmount: centsToMoneyString(totalAmountInCents),
        items: saleItems,
      });

      const savedSale = await saleRepository.save(sale);

      if (updatedInventories.length > 0) {
        await inventoryRepository.save(updatedInventories);
      }

      return {
        saleId: savedSale.id,
        receiptNumber: savedSale.receiptNumber,
        totalAmount: savedSale.totalAmount,
        createdAt: savedSale.createdAt,
        outlet: {
          id: outlet.id,
          code: outlet.code,
          name: outlet.name,
        },
        items: receiptLines,
      };
    });
  }

  async listRecentSales(outletId: string): Promise<RecentSalesResponse> {
    const outlet = await this.outletRepository.findById(outletId);

    if (!outlet) {
      throw new HttpError(404, "Outlet not found");
    }

    const sales = await AppDataSource.getRepository(Sale).find({
      where: { outletId },
      relations: {
        items: {
          outletMenuItem: {
            menuItem: true,
          },
        },
      },
      order: {
        createdAt: "DESC",
      },
      take: 10,
    });

    return {
      outlet: {
        id: outlet.id,
        code: outlet.code,
        name: outlet.name,
      },
      sales: sales.map((sale) => ({
        // Keep line items deterministic regardless of DB relation loading order.
        // Primary sort is by menu name, then by stable ids as tie-breakers.
        // This prevents flaky tests and inconsistent UI rendering.

        saleId: sale.id,
        receiptNumber: sale.receiptNumber,
        totalAmount: sale.totalAmount,
        createdAt: sale.createdAt,
        itemCount: sale.items.reduce((sum, item) => sum + item.quantity, 0),
        items: [...sale.items]
          .sort((left, right) => {
            const byName = left.outletMenuItem.menuItem.name.localeCompare(
              right.outletMenuItem.menuItem.name,
            );

            if (byName !== 0) {
              return byName;
            }

            const byOutletMenuItemId = left.outletMenuItemId.localeCompare(
              right.outletMenuItemId,
            );

            if (byOutletMenuItemId !== 0) {
              return byOutletMenuItemId;
            }

            return left.id.localeCompare(right.id);
          })
          .map((item) => ({
            saleItemId: item.id,
            outletMenuItemId: item.outletMenuItemId,
            menuItemId: item.outletMenuItem.menuItemId,
            name: item.outletMenuItem.menuItem.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal,
          })),
      })),
    };
  }
}
