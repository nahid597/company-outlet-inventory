import { useEffect } from "react";
import type { FormEvent } from "react";

import {
  adjustInventoryQuantity,
  assignMenuItem,
  createMenuItem,
  fetchOutletInventory,
  fetchOutletMenu,
  loadInitialData,
  setActiveTab,
  setInventoryOutletId,
  setSelectedOutletId,
  setInventoryQuantity,
  updateAssignmentFormField,
  updateEditDraftField,
  updateInventoryFormField,
  updateMenuItem,
  updateNewMenuItemField,
} from "../store/appSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import type {
  AssignmentFormState,
  EditDraft,
  InventoryFormState,
  MenuItem,
  NewMenuItemForm,
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
    newMenuItem: app.newMenuItem,
    editDrafts: app.editDrafts,
    assignmentForm: app.assignmentForm,
    inventoryForm: app.inventoryForm,
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
  };
}
