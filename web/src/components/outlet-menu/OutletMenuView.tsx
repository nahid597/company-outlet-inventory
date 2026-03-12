import type { Outlet, OutletMenuResponse } from "../../types";

type Props = {
  outlets: Outlet[];
  selectedOutletId: string;
  outletMenu: OutletMenuResponse | null;
  onOutletChange: (id: string) => void;
};

export default function OutletMenuView({
  outlets,
  selectedOutletId,
  outletMenu,
  onOutletChange,
}: Props) {
  return (
    <section className="panel">
      <h2>Outlet Menu View</h2>
      <div className="inline-controls">
        <label>
          Outlet
          <select
            value={selectedOutletId}
            onChange={(e) => onOutletChange(e.target.value)}
          >
            <option value="">Select outlet</option>
            {outlets.map((outlet) => (
              <option key={outlet.id} value={outlet.id}>
                {outlet.code} - {outlet.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {outletMenu ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Base Price</th>
                <th>Override</th>
                <th>Effective Price</th>
              </tr>
            </thead>
            <tbody>
              {outletMenu.items.map((item) => (
                <tr key={item.assignmentId}>
                  <td>{item.name}</td>
                  <td>{item.category ?? "-"}</td>
                  <td>{item.basePrice}</td>
                  <td>{item.overridePrice ?? "-"}</td>
                  <td>{item.effectivePrice}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="status">Select an outlet to load menu items.</p>
      )}
    </section>
  );
}
