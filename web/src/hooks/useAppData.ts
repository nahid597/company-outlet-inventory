import { useEffect } from "react";
import type { FormEvent } from "react";

import {
  assignMenuItem,
  createMenuItem,
  fetchOutletMenu,
  loadInitialData,
  setActiveTab,
  setSelectedOutletId,
  updateAssignmentFormField,
  updateEditDraftField,
  updateMenuItem,
  updateNewMenuItemField,
} from "../store/appSlice";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import type {
  AssignmentFormState,
  EditDraft,
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
    newMenuItem: app.newMenuItem,
    editDrafts: app.editDrafts,
    assignmentForm: app.assignmentForm,
    onTabChange,
    onOutletSelect,
    onNewMenuItemChange,
    onEditDraftChange,
    onAssignmentFormChange,
    onCreateMenuItem,
    onUpdateMenuItem,
    onAssignMenuItem,
  };
}
