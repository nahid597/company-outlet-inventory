import { useEffect } from "react";

import type {
  Outlet,
  RevenueByOutletReport,
  TopItemsReport,
} from "../../types";

type Props = {
  outlets: Outlet[];
  reportsRevenue: RevenueByOutletReport | null;
  reportsTopItems: TopItemsReport | null;
  reportsOutletId: string;
  loading: boolean;
  onRefreshRevenueReport: () => Promise<void>;
  onReportsOutletSelect: (outletId: string) => Promise<void>;
};

const getTotalRevenue = (report: RevenueByOutletReport | null): string => {
  if (!report) {
    return "0.00";
  }

  return report.outlets
    .reduce((sum, outlet) => sum + Number(outlet.totalRevenue), 0)
    .toFixed(2);
};

export default function ReportsView({
  outlets,
  reportsRevenue,
  reportsTopItems,
  reportsOutletId,
  loading,
  onRefreshRevenueReport,
  onReportsOutletSelect,
}: Props) {
  useEffect(() => {
    void onRefreshRevenueReport();
    // Initial fetch when report view mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="panel-grid reports-grid">
      <article className="panel form-panel">
        <h2>Top Items By Outlet</h2>
        <div className="form-stack">
          <label>
            Outlet
            <select
              value={reportsOutletId}
              onChange={(event) =>
                void onReportsOutletSelect(event.target.value)
              }
            >
              <option value="">Select outlet</option>
              {outlets.map((outlet) => (
                <option key={outlet.id} value={outlet.id}>
                  {outlet.code} - {outlet.name}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            className="action ghost"
            onClick={() => void onRefreshRevenueReport()}
            disabled={loading}
          >
            Refresh Revenue Report
          </button>
        </div>

        {reportsTopItems ? (
          <>
            <p className="meta">
              Showing top items for {reportsTopItems.outlet.code} -{" "}
              {reportsTopItems.outlet.name}
            </p>
            {reportsTopItems.items.length > 0 ? (
              <ul className="menu-cards">
                {reportsTopItems.items.map((item) => (
                  <li key={item.menuItemId}>
                    <h3>{item.name}</h3>
                    <p>Sold: {item.quantitySold}</p>
                    <p>Revenue: {item.revenue}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="status">No sales data yet for this outlet.</p>
            )}
          </>
        ) : (
          <p className="status">Select an outlet to load top sold items.</p>
        )}
      </article>

      <article className="panel">
        <div className="recent-sales-head">
          <h2>Revenue By Outlet</h2>
          <p className="meta">
            Total revenue: {getTotalRevenue(reportsRevenue)}
          </p>
        </div>

        {reportsRevenue && reportsRevenue.outlets.length > 0 ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Outlet</th>
                  <th>Code</th>
                  <th>Sale Count</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {reportsRevenue.outlets.map((row) => (
                  <tr key={row.outletId}>
                    <td>{row.outletName}</td>
                    <td>{row.outletCode}</td>
                    <td>{row.saleCount}</td>
                    <td>{row.totalRevenue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="status">No revenue rows available yet.</p>
        )}
      </article>
    </section>
  );
}
