import type { FormEvent } from "react";

import type {
  Outlet,
  OutletInventoryItem,
  OutletInventoryResponse,
  RecentSalesResponse,
  SaleCartItem,
  SaleReceipt,
  SalesFormState,
} from "../../types";

type Props = {
  outlets: Outlet[];
  salesInventory: OutletInventoryResponse | null;
  recentSales: RecentSalesResponse | null;
  salesForm: SalesFormState;
  saleCart: SaleCartItem[];
  lastReceipt: SaleReceipt | null;
  saving: boolean;
  onSalesOutletSelect: (outletId: string) => void;
  onSalesFormChange: (field: keyof SalesFormState, value: string) => void;
  onAddSaleItem: (item: OutletInventoryItem, quantity: number) => void;
  onRemoveSaleItem: (outletMenuItemId: string) => void;
  onUpdateSaleItemQuantity: (
    outletMenuItemId: string,
    quantity: number,
  ) => void;
  onClearSaleCart: () => void;
  onCreateSale: (event: FormEvent<HTMLFormElement>) => void;
};

const formatSubtotal = (item: SaleCartItem): string =>
  (Number(item.unitPrice) * item.quantity).toFixed(2);

const getCartTotal = (items: SaleCartItem[]): string =>
  items
    .reduce((sum, item) => sum + Number(item.unitPrice) * item.quantity, 0)
    .toFixed(2);

export default function SalesView({
  outlets,
  salesInventory,
  recentSales,
  salesForm,
  saleCart,
  lastReceipt,
  saving,
  onSalesOutletSelect,
  onSalesFormChange,
  onAddSaleItem,
  onRemoveSaleItem,
  onUpdateSaleItemQuantity,
  onClearSaleCart,
  onCreateSale,
}: Props) {
  const saleItems =
    salesInventory?.items.filter((item) => item.isAvailable) ?? [];
  const selectedItem = saleItems.find(
    (item) => item.outletMenuItemId === salesForm.outletMenuItemId,
  );
  const parsedQuantity = Number(salesForm.quantity || "0");
  const requestedQuantity = Number.isInteger(parsedQuantity)
    ? Math.max(1, parsedQuantity)
    : 1;
  const canAddItem =
    !!selectedItem &&
    Number.isInteger(parsedQuantity) &&
    parsedQuantity > 0 &&
    requestedQuantity <= selectedItem.quantity;

  return (
    <section className="panel-grid sales-grid">
      <article className="panel form-panel">
        <h2>POS Checkout</h2>
        <div className="form-stack">
          <label>
            Outlet
            <select
              value={salesForm.outletId}
              onChange={(event) => onSalesOutletSelect(event.target.value)}
            >
              <option value="">Select outlet</option>
              {outlets.map((outlet) => (
                <option key={outlet.id} value={outlet.id}>
                  {outlet.code} - {outlet.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Available Item
            <select
              value={salesForm.outletMenuItemId}
              onChange={(event) =>
                onSalesFormChange("outletMenuItemId", event.target.value)
              }
            >
              <option value="">Select menu item</option>
              {saleItems.map((item) => (
                <option
                  key={item.outletMenuItemId}
                  value={item.outletMenuItemId}
                >
                  {item.name} ({item.quantity} in stock)
                </option>
              ))}
            </select>
          </label>

          {selectedItem ? (
            <div className="sales-meta-card">
              <strong>{selectedItem.name}</strong>
              <span>Effective price: {selectedItem.effectivePrice}</span>
              <span>Available stock: {selectedItem.quantity}</span>
            </div>
          ) : null}

          <label>
            Quantity
            <input
              type="number"
              min="1"
              step="1"
              value={salesForm.quantity}
              onChange={(event) =>
                onSalesFormChange("quantity", event.target.value)
              }
            />
          </label>

          <button
            className="action"
            type="button"
            disabled={!canAddItem || saving}
            onClick={() =>
              selectedItem && onAddSaleItem(selectedItem, requestedQuantity)
            }
          >
            Add To Cart
          </button>
        </div>

        <div className="catalog-grid">
          {saleItems.map((item) => (
            <div className="catalog-card" key={item.outletMenuItemId}>
              <h3>{item.name}</h3>
              <p>{item.category ?? "Uncategorized"}</p>
              <p>Price: {item.effectivePrice}</p>
              <p>Stock: {item.quantity}</p>
              <button
                className="action ghost inline-action"
                type="button"
                disabled={saving || item.quantity < 1}
                onClick={() => onAddSaleItem(item, 1)}
              >
                Quick Add 1
              </button>
            </div>
          ))}
        </div>
      </article>

      <article className="panel">
        <h2>Cart And Receipt</h2>
        {saleCart.length > 0 ? (
          <>
            <div className="cart-actions">
              <p className="meta">{saleCart.length} distinct items in cart.</p>
              <button
                className="action ghost"
                type="button"
                onClick={onClearSaleCart}
                disabled={saving}
              >
                Clear Cart
              </button>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Unit Price</th>
                    <th>Quantity</th>
                    <th>Stock Cap</th>
                    <th>Subtotal</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {saleCart.map((item) => (
                    <tr key={item.outletMenuItemId}>
                      <td>{item.name}</td>
                      <td>{item.unitPrice}</td>
                      <td>
                        <input
                          className="cart-qty-input"
                          type="number"
                          min="1"
                          max={item.availableStock}
                          step="1"
                          value={item.quantity}
                          onChange={(event) =>
                            onUpdateSaleItemQuantity(
                              item.outletMenuItemId,
                              Number(event.target.value || "1"),
                            )
                          }
                        />
                      </td>
                      <td>{item.availableStock}</td>
                      <td>{formatSubtotal(item)}</td>
                      <td>
                        <button
                          className="action ghost inline-action"
                          type="button"
                          onClick={() =>
                            onRemoveSaleItem(item.outletMenuItemId)
                          }
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <form
              className="checkout-panel"
              onSubmit={(event) => void onCreateSale(event)}
            >
              <p className="checkout-total">
                Cart total: {getCartTotal(saleCart)}
              </p>
              <button className="action" type="submit" disabled={saving}>
                {saving ? "Processing..." : "Complete Sale"}
              </button>
            </form>
          </>
        ) : (
          <p className="status">Add one or more items to build the cart.</p>
        )}

        {lastReceipt ? (
          <section className="receipt-card">
            <div className="receipt-head">
              <div>
                <p className="hero-kicker">Latest receipt</p>
                <h3>{lastReceipt.receiptNumber}</h3>
              </div>
              <div className="receipt-total">{lastReceipt.totalAmount}</div>
            </div>
            <div className="receipt-toolbar no-print">
              <button
                className="action ghost"
                type="button"
                onClick={() => window.print()}
              >
                Print Receipt
              </button>
            </div>
            <p className="meta">
              {lastReceipt.outlet.code} - {lastReceipt.outlet.name} •{" "}
              {new Date(lastReceipt.createdAt).toLocaleString()}
            </p>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Subtotal</th>
                    <th>Remaining Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {lastReceipt.items.map((item) => (
                    <tr key={item.outletMenuItemId}>
                      <td>{item.name}</td>
                      <td>{item.quantity}</td>
                      <td>{item.unitPrice}</td>
                      <td>{item.subtotal}</td>
                      <td>{item.remainingStock}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        <section className="recent-sales-panel">
          <div className="recent-sales-head">
            <h3>Recent Sales</h3>
            {recentSales ? (
              <p className="meta">
                {recentSales.outlet.code} - {recentSales.outlet.name}
              </p>
            ) : null}
          </div>

          {recentSales && recentSales.sales.length > 0 ? (
            <div className="recent-sales-list">
              {recentSales.sales.map((sale) => (
                <article className="recent-sale-card" key={sale.saleId}>
                  <div className="recent-sale-summary">
                    <div>
                      <strong>{sale.receiptNumber}</strong>
                      <p className="meta">
                        {new Date(sale.createdAt).toLocaleString()} •{" "}
                        {sale.itemCount} items
                      </p>
                    </div>
                    <div className="recent-sale-total">{sale.totalAmount}</div>
                  </div>
                  <ul className="recent-sale-items">
                    {sale.items.map((item) => (
                      <li key={item.saleItemId}>
                        <span>
                          {item.name} x{item.quantity}
                        </span>
                        <span>{item.subtotal}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          ) : (
            <p className="status">No recent sales yet for this outlet.</p>
          )}
        </section>
      </article>
    </section>
  );
}
