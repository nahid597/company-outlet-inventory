import { AppDataSource } from "../db/data-source";
import { OutletRepository } from "../repositories/outlet.repository";
import { HttpError } from "../utils/http-error";

type RevenueByOutletRow = {
  outletId: string;
  outletCode: string;
  outletName: string;
  saleCount: number;
  totalRevenue: string;
};

type TopItemRow = {
  menuItemId: string;
  name: string;
  quantitySold: number;
  revenue: string;
};

type RevenueReport = {
  generatedAt: Date;
  outlets: RevenueByOutletRow[];
};

type TopItemsReport = {
  generatedAt: Date;
  outlet: {
    id: string;
    code: string;
    name: string;
  };
  items: TopItemRow[];
};

type RawRevenueRow = {
  outletId: string;
  outletCode: string;
  outletName: string;
  saleCount: string;
  totalRevenue: string;
};

type RawTopItemRow = {
  menuItemId: string;
  name: string;
  quantitySold: string;
  revenue: string;
};

export class ReportService {
  private readonly outletRepository: OutletRepository;

  constructor() {
    this.outletRepository = new OutletRepository();
  }

  async getRevenueByOutlet(): Promise<RevenueReport> {
    const rows = await AppDataSource.query(
      `SELECT
         o.id AS "outletId",
         o.code AS "outletCode",
         o.name AS "outletName",
         COUNT(s.id)::int AS "saleCount",
         COALESCE(SUM(s.total_amount), 0)::numeric(14,2)::text AS "totalRevenue"
       FROM outlets o
       LEFT JOIN sales s ON s.outlet_id = o.id
       GROUP BY o.id, o.code, o.name
       ORDER BY COALESCE(SUM(s.total_amount), 0) DESC, o.code ASC`,
    );

    return {
      generatedAt: new Date(),
      outlets: (rows as RawRevenueRow[]).map((row) => ({
        outletId: row.outletId,
        outletCode: row.outletCode,
        outletName: row.outletName,
        saleCount: Number(row.saleCount),
        totalRevenue: row.totalRevenue,
      })),
    };
  }

  async getTopItemsByOutlet(outletId: string): Promise<TopItemsReport> {
    const outlet = await this.outletRepository.findById(outletId);

    if (!outlet) {
      throw new HttpError(404, "Outlet not found");
    }

    const rows = await AppDataSource.query(
      `SELECT
         mi.id AS "menuItemId",
         mi.name AS "name",
         SUM(si.quantity)::int AS "quantitySold",
         COALESCE(SUM(si.subtotal), 0)::numeric(14,2)::text AS "revenue"
       FROM sale_items si
       INNER JOIN sales s ON s.id = si.sale_id
       INNER JOIN outlet_menu_items omi ON omi.id = si.outlet_menu_item_id
       INNER JOIN menu_items mi ON mi.id = omi.menu_item_id
       WHERE s.outlet_id = $1
       GROUP BY mi.id, mi.name
       ORDER BY SUM(si.quantity) DESC, SUM(si.subtotal) DESC, mi.name ASC
       LIMIT 5`,
      [outletId],
    );

    return {
      generatedAt: new Date(),
      outlet: {
        id: outlet.id,
        code: outlet.code,
        name: outlet.name,
      },
      items: (rows as RawTopItemRow[]).map((row) => ({
        menuItemId: row.menuItemId,
        name: row.name,
        quantitySold: Number(row.quantitySold),
        revenue: row.revenue,
      })),
    };
  }
}
