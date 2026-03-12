import type { EditDraft, MenuItem } from "../../types";

type Props = {
  menuItems: MenuItem[];
  editDrafts: Record<string, EditDraft>;
  saving: boolean;
  onDraftChange: (
    id: string,
    field: keyof EditDraft,
    value: string | boolean,
  ) => void;
  onSave: (item: MenuItem) => void;
};

export default function MenuItemTable({
  menuItems,
  editDrafts,
  saving,
  onDraftChange,
  onSave,
}: Props) {
  return (
    <article className="panel">
      <h2>Master Menu List &amp; Update</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Base Price</th>
              <th>Description</th>
              <th>Active</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {menuItems.map((item) => {
              const draft = editDrafts[item.id];
              return (
                <tr key={item.id}>
                  <td>
                    <input
                      value={draft?.name ?? ""}
                      onChange={(e) =>
                        onDraftChange(item.id, "name", e.target.value)
                      }
                    />
                  </td>
                  <td>
                    <input
                      value={draft?.category ?? ""}
                      onChange={(e) =>
                        onDraftChange(item.id, "category", e.target.value)
                      }
                    />
                  </td>
                  <td>
                    <input
                      min="0"
                      step="0.01"
                      type="number"
                      value={draft?.basePrice ?? ""}
                      onChange={(e) =>
                        onDraftChange(item.id, "basePrice", e.target.value)
                      }
                    />
                  </td>
                  <td>
                    <input
                      value={draft?.description ?? ""}
                      onChange={(e) =>
                        onDraftChange(item.id, "description", e.target.value)
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      checked={Boolean(draft?.isActive)}
                      onChange={(e) =>
                        onDraftChange(item.id, "isActive", e.target.checked)
                      }
                    />
                  </td>
                  <td>
                    <button
                      className="action ghost"
                      disabled={saving}
                      onClick={() => onSave(item)}
                    >
                      Save
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </article>
  );
}
