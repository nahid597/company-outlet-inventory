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
    </nav>
  );
}
