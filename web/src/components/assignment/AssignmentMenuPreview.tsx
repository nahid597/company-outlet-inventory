import type { OutletMenuResponse } from "../../types";

type Props = {
  outletMenu: OutletMenuResponse | null;
};

export default function AssignmentMenuPreview({ outletMenu }: Props) {
  return (
    <article className="panel">
      <h2>Selected Outlet Effective Menu</h2>
      {outletMenu ? (
        <>
          <p className="meta">
            {outletMenu.outlet.code} - {outletMenu.outlet.name}
          </p>
          <ul className="menu-cards">
            {outletMenu.items.map((item) => (
              <li key={item.assignmentId}>
                <h3>{item.name}</h3>
                <p>{item.category ?? "Uncategorized"}</p>
                <p>
                  Effective <strong>{item.effectivePrice}</strong> | Base{" "}
                  {item.basePrice}
                  {item.overridePrice
                    ? ` | Override ${item.overridePrice}`
                    : ""}
                </p>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="status">Select an outlet to preview assigned menu.</p>
      )}
    </article>
  );
}
