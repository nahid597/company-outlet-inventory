import "./App.css";

import Banner from "./components/common/Banner";
import Header from "./components/layout/Header";
import TabNav from "./components/layout/TabNav";
import AssignmentForm from "./components/assignment/AssignmentForm";
import AssignmentMenuPreview from "./components/assignment/AssignmentMenuPreview";
import CreateMenuItemForm from "./components/hq-menu/CreateMenuItemForm";
import MenuItemTable from "./components/hq-menu/MenuItemTable";
import OutletMenuView from "./components/outlet-menu/OutletMenuView";
import { useAppData } from "./hooks/useAppData";

function App() {
  const {
    activeTab,
    loading,
    saving,
    notice,
    error,
    menuItems,
    outlets,
    selectedOutletId,
    outletMenu,
    newMenuItem,
    editDrafts,
    assignmentForm,
    onTabChange,
    onOutletSelect,
    onNewMenuItemChange,
    onEditDraftChange,
    onAssignmentFormChange,
    onCreateMenuItem,
    onUpdateMenuItem,
    onAssignMenuItem,
  } = useAppData();

  return (
    <div className="shell">
      <Header />
      <TabNav activeTab={activeTab} onTabChange={onTabChange} />

      {error ? <Banner type="error" message={error} /> : null}
      {notice ? <Banner type="success" message={notice} /> : null}

      {loading ? <p className="status">Loading data...</p> : null}

      {!loading && activeTab === "menu" ? (
        <section className="panel-grid">
          <CreateMenuItemForm
            form={newMenuItem}
            saving={saving}
            onChange={onNewMenuItemChange}
            onSubmit={onCreateMenuItem}
          />
          <MenuItemTable
            menuItems={menuItems}
            editDrafts={editDrafts}
            saving={saving}
            onDraftChange={onEditDraftChange}
            onSave={onUpdateMenuItem}
          />
        </section>
      ) : null}

      {!loading && activeTab === "assignment" ? (
        <section className="panel-grid">
          <AssignmentForm
            form={assignmentForm}
            outlets={outlets}
            menuItems={menuItems}
            saving={saving}
            onChange={onAssignmentFormChange}
            onSubmit={onAssignMenuItem}
          />
          <AssignmentMenuPreview outletMenu={outletMenu} />
        </section>
      ) : null}

      {!loading && activeTab === "outlet" ? (
        <OutletMenuView
          outlets={outlets}
          selectedOutletId={selectedOutletId}
          outletMenu={outletMenu}
          onOutletChange={onOutletSelect}
        />
      ) : null}
    </div>
  );
}

export default App;
