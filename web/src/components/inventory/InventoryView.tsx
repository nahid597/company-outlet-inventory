import type { FormEvent } from "react";

import type {
  InventoryFormState,
  Outlet,
  OutletInventoryResponse,
} from "../../types";

type Props = {
  outlets: Outlet[];
  outletInventory: OutletInventoryResponse | null;
  inventoryForm: InventoryFormState;
  saving: boolean;
  onInventoryOutletSelect: (outletId: string) => void;
  onInventoryFormChange: (
    field: keyof InventoryFormState,
    value: string,
  ) => void;
  onSetInventoryQuantity: (event: FormEvent<HTMLFormElement>) => void;
  onAdjustInventoryQuantity: (event: FormEvent<HTMLFormElement>) => void;
};

export default function InventoryView({
  outlets,
  outletInventory,
  inventoryForm,
  saving,
  onInventoryOutletSelect,
  onInventoryFormChange,
  onSetInventoryQuantity,
  onAdjustInventoryQuantity,
}: Props) {
  const inventoryItems = outletInventory?.items ?? [];

  return (
    <section className="panel-grid">
      <article className="panel form-panel">
        <h2>Outlet Inventory Controls</h2>
        <div className="form-stack">
          <label>
            Outlet
            <select
              value={inventoryForm.outletId}
              onChange={(event) => onInventoryOutletSelect(event.target.value)}
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
            Outlet Menu Item
            <select
              value={inventoryForm.outletMenuItemId}
              onChange={(event) =>
                onInventoryFormChange("outletMenuItemId", event.target.value)
              }
            >
              <option value="">Select menu item</option>
              {inventoryItems.map((item) => (
                <option
                  key={item.outletMenuItemId}
                  value={item.outletMenuItemId}
                >
                  {item.name} ({item.quantity} in stock)
                </option>
              ))}
            </select>
          </label>

          <form
            className="form-stack"
            onSubmit={(event) => void onSetInventoryQuantity(event)}
          >
            <label>
              Set Quantity
              <input
                type="number"
                min="0"
                step="1"
                value={inventoryForm.quantity}
                onChange={(event) =>
                  onInventoryFormChange("quantity", event.target.value)
                }
              />
            </label>
            <button className="action" type="submit" disabled={saving}>
              {saving ? "Saving..." : "Set Stock"}
            </button>
          </form>

          <form
            className="form-stack"
            onSubmit={(event) => void onAdjustInventoryQuantity(event)}
          >
            <label>
              Adjust Delta (+/-)
              <input
                type="number"
                step="1"
                value={inventoryForm.delta}
                onChange={(event) =>
                  onInventoryFormChange("delta", event.target.value)
                }
              />
            </label>
            <button className="action ghost" type="submit" disabled={saving}>
              {saving ? "Saving..." : "Adjust Stock"}
            </button>
          </form>
        </div>
      </article>

      <article className="panel">
        <h2>Inventory Snapshot</h2>
        {outletInventory ? (
          <>
            <p className="meta">
              {outletInventory.outlet.code} - {outletInventory.outlet.name}
            </p>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Category</th>
                    <th>Effective Price</th>
                    <th>Stock</th>
                    <th>Available</th>
                    <th>Updated At</th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryItems.map((item) => (
                    <tr key={item.outletMenuItemId}>
                      <td>{item.name}</td>
                      <td>{item.category ?? "-"}</td>
                      <td>{item.effectivePrice}</td>
                      <td>{item.quantity}</td>
                      <td>{item.isAvailable ? "Yes" : "No"}</td>
                      <td>
                        {item.updatedAt
                          ? new Date(item.updatedAt).toLocaleString()
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p className="status">Select an outlet to load inventory.</p>
        )}
      </article>
    </section>
  );
}
