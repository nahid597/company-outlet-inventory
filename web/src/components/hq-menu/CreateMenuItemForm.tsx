import type { FormEvent } from "react";

import type { NewMenuItemForm } from "../../types";

type Props = {
  form: NewMenuItemForm;
  saving: boolean;
  onChange: (field: keyof NewMenuItemForm, value: string | boolean) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export default function CreateMenuItemForm({
  form,
  saving,
  onChange,
  onSubmit,
}: Props) {
  return (
    <article className="panel form-panel">
      <h2>Create Menu Item</h2>
      <form onSubmit={(e) => void onSubmit(e)} className="form-stack">
        <label>
          Name
          <input
            required
            value={form.name}
            onChange={(e) => onChange("name", e.target.value)}
          />
        </label>
        <label>
          Category
          <input
            value={form.category}
            onChange={(e) => onChange("category", e.target.value)}
          />
        </label>
        <label>
          Base Price
          <input
            required
            min="0"
            step="0.01"
            type="number"
            value={form.basePrice}
            onChange={(e) => onChange("basePrice", e.target.value)}
          />
        </label>
        <label>
          Description
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => onChange("description", e.target.value)}
          />
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => onChange("isActive", e.target.checked)}
          />
          Active item
        </label>
        <button className="action" type="submit" disabled={saving}>
          {saving ? "Saving..." : "Create"}
        </button>
      </form>
    </article>
  );
}
