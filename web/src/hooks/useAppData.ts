import { useEffect } from "react";
import type { FormEvent } from "react";

import {
  addSaleCartItem,
  clearSaleCart,
  createSale,
  adjustInventoryQuantity,
  assignMenuItem,
  createMenuItem,
  fetchOutletInventory,
  fetchOutletMenu,
  fetchRecentSales,
  fetchRevenueReport,
  fetchSalesInventory,
  fetchTopItemsReport,
  loadInitialData,
  setActiveTab,
  setInventoryOutletId,
  setReportsOutletId,
  setSalesOutletId,
  setSelectedOutletId,
  setInventoryQuantity,
  removeSaleCartItem,
  updateSaleCartItemQuantity,
  updateAssignmentFormField,
  updateEditDraftField,
  updateInventoryFormField,
  updateMenuItem,
  updateNewMenuItemField,
  updateSalesFormField,
} from "../store/appSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import type {
  AssignmentFormState,
  EditDraft,
  InventoryFormState,
  MenuItem,
  NewMenuItemForm,
  OutletInventoryItem,
  SalesFormState,
  TabId,
} from "../types";

export function useAppData() {
  const dispatch = useAppDispatch();
  const app = useAppSelector((state) => state.app);

  useEffect(() => {
    void dispatch(loadInitialData());
  }, [dispatch]);

  const onTabChange = (tabId: TabId): void => {
    dispatch(setActiveTab(tabId));
  };

  const onNewMenuItemChange = (
    field: keyof NewMenuItemForm,
    value: string | boolean,
  ): void => {
    dispatch(updateNewMenuItemField({ field, value }));
  };

  const onEditDraftChange = (
    id: string,
    field: keyof EditDraft,
    value: string | boolean,
  ): void => {
    dispatch(updateEditDraftField({ id, field, value }));
  };

  const onAssignmentFormChange = (
    field: keyof AssignmentFormState,
    value: string | boolean,
  ): void => {
    dispatch(updateAssignmentFormField({ field, value }));

    if (field === "outletId" && typeof value === "string") {
      dispatch(setSelectedOutletId(value));
      void dispatch(fetchOutletMenu(value));
    }
  };

  const onOutletSelect = (outletId: string): void => {
    dispatch(setSelectedOutletId(outletId));
    void dispatch(fetchOutletMenu(outletId));
  };

  const onCreateMenuItem = async (
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();
    await dispatch(createMenuItem());
  };

  const onUpdateMenuItem = async (menuItem: MenuItem): Promise<void> => {
    await dispatch(updateMenuItem(menuItem));
  };

  const onAssignMenuItem = async (
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();
    await dispatch(assignMenuItem());
  };

  const onInventoryFormChange = (
    field: keyof InventoryFormState,
    value: string,
  ): void => {
    dispatch(updateInventoryFormField({ field, value }));
  };

  const onInventoryOutletSelect = (outletId: string): void => {
    dispatch(setInventoryOutletId(outletId));
    void dispatch(fetchOutletInventory(outletId));
  };

  const onSetInventoryQuantity = async (
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();
    await dispatch(setInventoryQuantity());
  };

  const onAdjustInventoryQuantity = async (
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();
    await dispatch(adjustInventoryQuantity());
  };

  const onSalesOutletSelect = (outletId: string): void => {
    dispatch(setSalesOutletId(outletId));
    void dispatch(fetchSalesInventory(outletId));
    void dispatch(fetchRecentSales(outletId));
  };

  const onSalesFormChange = (
    field: keyof SalesFormState,
    value: string,
  ): void => {
    dispatch(updateSalesFormField({ field, value }));
  };

  const onAddSaleItem = (item: OutletInventoryItem, quantity: number): void => {
    dispatch(addSaleCartItem({ item, quantity }));
    dispatch(updateSalesFormField({ field: "outletMenuItemId", value: "" }));
    dispatch(updateSalesFormField({ field: "quantity", value: "1" }));
  };

  const onRemoveSaleItem = (outletMenuItemId: string): void => {
    dispatch(removeSaleCartItem(outletMenuItemId));
  };

  const onUpdateSaleItemQuantity = (
    outletMenuItemId: string,
    quantity: number,
  ): void => {
    dispatch(updateSaleCartItemQuantity({ outletMenuItemId, quantity }));
  };

  const onClearSaleCart = (): void => {
    dispatch(clearSaleCart());
  };

  const onCreateSale = async (
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();
    await dispatch(createSale());
  };

  const onRefreshRevenueReport = async (): Promise<void> => {
    await dispatch(fetchRevenueReport());
  };

  const onReportsOutletSelect = async (outletId: string): Promise<void> => {
    dispatch(setReportsOutletId(outletId));
    await dispatch(fetchTopItemsReport(outletId));
  };

  return {
    activeTab: app.activeTab,
    loading: app.loading,
    saving: app.saving,
    notice: app.notice,
    error: app.error,
    menuItems: app.menuItems,
    outlets: app.outlets,
    selectedOutletId: app.selectedOutletId,
    outletMenu: app.outletMenu,
    outletInventory: app.outletInventory,
    salesInventory: app.salesInventory,
    recentSales: app.recentSales,
    reportsRevenue: app.reportsRevenue,
    reportsTopItems: app.reportsTopItems,
    reportsOutletId: app.reportsOutletId,
    newMenuItem: app.newMenuItem,
    editDrafts: app.editDrafts,
    assignmentForm: app.assignmentForm,
    inventoryForm: app.inventoryForm,
    salesForm: app.salesForm,
    saleCart: app.saleCart,
    lastReceipt: app.lastReceipt,
    onTabChange,
    onOutletSelect,
    onNewMenuItemChange,
    onEditDraftChange,
    onAssignmentFormChange,
    onCreateMenuItem,
    onUpdateMenuItem,
    onAssignMenuItem,
    onInventoryFormChange,
    onInventoryOutletSelect,
    onSetInventoryQuantity,
    onAdjustInventoryQuantity,
    onSalesOutletSelect,
    onSalesFormChange,
    onAddSaleItem,
    onRemoveSaleItem,
    onUpdateSaleItemQuantity,
    onClearSaleCart,
    onCreateSale,
    onRefreshRevenueReport,
    onReportsOutletSelect,
  };
}
