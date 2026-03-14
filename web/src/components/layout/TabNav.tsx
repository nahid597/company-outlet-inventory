import type { TabId } from "../../types";

type Props = {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
};

export default function TabNav({ activeTab, onTabChange }: Props) {
  return (
    <nav className="tabs" aria-label="Feature tabs">
      <button
        className={activeTab === "menu" ? "tab active" : "tab"}
        onClick={() => onTabChange("menu")}
      >
        HQ Menu
      </button>
      <button
        className={activeTab === "assignment" ? "tab active" : "tab"}
        onClick={() => onTabChange("assignment")}
      >
        Assignment
      </button>
      <button
        className={activeTab === "outlet" ? "tab active" : "tab"}
        onClick={() => onTabChange("outlet")}
      >
        Outlet Menu
      </button>
      <button
        className={activeTab === "inventory" ? "tab active" : "tab"}
        onClick={() => onTabChange("inventory")}
      >
        Inventory
      </button>
      <button
        className={activeTab === "sales" ? "tab active" : "tab"}
        onClick={() => onTabChange("sales")}
      >
        POS Sales
      </button>
      <button
        className={activeTab === "reports" ? "tab active" : "tab"}
        onClick={() => onTabChange("reports")}
      >
        Reports
      </button>
    </nav>
  );
}
