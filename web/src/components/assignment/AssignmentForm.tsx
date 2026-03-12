import type { FormEvent } from "react";

import type { AssignmentFormState, MenuItem, Outlet } from "../../types";

type Props = {
  form: AssignmentFormState;
  outlets: Outlet[];
  menuItems: MenuItem[];
  saving: boolean;
  onChange: (field: keyof AssignmentFormState, value: string | boolean) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export default function AssignmentForm({
  form,
  outlets,
  menuItems,
  saving,
  onChange,
  onSubmit,
}: Props) {
  return (
    <article className="panel form-panel">
      <h2>Assign Menu To Outlet</h2>
      <form onSubmit={(e) => void onSubmit(e)} className="form-stack">
        <label>
          Outlet
          <select
            required
            value={form.outletId}
            onChange={(e) => onChange("outletId", e.target.value)}
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
          Menu Item
          <select
            required
            value={form.menuItemId}
            onChange={(e) => onChange("menuItemId", e.target.value)}
          >
            <option value="">Select menu item</option>
            {menuItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} ({item.basePrice})
              </option>
            ))}
          </select>
        </label>
        <label>
          Override Price (optional)
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.overridePrice}
            onChange={(e) => onChange("overridePrice", e.target.value)}
          />
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={form.isAvailable}
            onChange={(e) => onChange("isAvailable", e.target.checked)}
          />
          Available at outlet
        </label>
        <button className="action" type="submit" disabled={saving}>
          {saving ? "Saving..." : "Assign"}
        </button>
      </form>
    </article>
  );
}
