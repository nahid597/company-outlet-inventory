import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { apiRequest } from "../api/client";
import type {
  AssignmentFormState,
  EditDraft,
  MenuItem,
  NewMenuItemForm,
  Outlet,
  OutletMenuResponse,
  TabId,
} from "../types";

type AppState = {
  activeTab: TabId;
  loading: boolean;
  saving: boolean;
  notice: string | null;
  error: string | null;
  menuItems: MenuItem[];
  outlets: Outlet[];
  selectedOutletId: string;
  outletMenu: OutletMenuResponse | null;
  newMenuItem: NewMenuItemForm;
  editDrafts: Record<string, EditDraft>;
  assignmentForm: AssignmentFormState;
  initialized: boolean;
};

const EMPTY_NEW_ITEM: NewMenuItemForm = {
  name: "",
  category: "",
  basePrice: "",
  description: "",
  isActive: true,
};

const toDraftMap = (items: MenuItem[]): Record<string, EditDraft> => {
  const record: Record<string, EditDraft> = {};
  for (const item of items) {
    record[item.id] = {
      name: item.name,
      category: item.category ?? "",
      basePrice: item.basePrice,
      description: item.description ?? "",
      isActive: item.isActive,
    };
  }
  return record;
};

const initialState: AppState = {
  activeTab: "menu",
  loading: true,
  saving: false,
  notice: null,
  error: null,
  menuItems: [],
  outlets: [],
  selectedOutletId: "",
  outletMenu: null,
  newMenuItem: EMPTY_NEW_ITEM,
  editDrafts: {},
  assignmentForm: {
    outletId: "",
    menuItemId: "",
    overridePrice: "",
    isAvailable: true,
  },
  initialized: false,
};

export const loadInitialData = createAsyncThunk<
  {
    menuItems: MenuItem[];
    outlets: Outlet[];
    selectedOutletId: string;
    outletMenu: OutletMenuResponse | null;
  },
  void,
  { rejectValue: string }
>("app/loadInitialData", async (_, { rejectWithValue }) => {
  try {
    const [menuItems, outlets] = await Promise.all([
      apiRequest<MenuItem[]>("/hq/menu-items"),
      apiRequest<Outlet[]>("/hq/outlets"),
    ]);

    const selectedOutletId = outlets[0]?.id ?? "";
    const outletMenu = selectedOutletId
      ? await apiRequest<OutletMenuResponse>(
          `/outlets/${selectedOutletId}/menu-items`,
        )
      : null;

    return { menuItems, outlets, selectedOutletId, outletMenu };
  } catch (err) {
    return rejectWithValue(
      err instanceof Error ? err.message : "Failed to load data",
    );
  }
});

export const fetchOutletMenu = createAsyncThunk<
  OutletMenuResponse | null,
  string,
  { rejectValue: string }
>("app/fetchOutletMenu", async (outletId, { rejectWithValue }) => {
  try {
    if (!outletId) {
      return null;
    }
    return await apiRequest<OutletMenuResponse>(
      `/outlets/${outletId}/menu-items`,
    );
  } catch (err) {
    return rejectWithValue(
      err instanceof Error ? err.message : "Failed to load outlet menu",
    );
  }
});

export const createMenuItem = createAsyncThunk<
  MenuItem[],
  void,
  { state: { app: AppState }; rejectValue: string }
>("app/createMenuItem", async (_, { getState, rejectWithValue }) => {
  try {
    const { newMenuItem } = getState().app;

    await apiRequest("/hq/menu-items", {
      method: "POST",
      body: JSON.stringify({
        name: newMenuItem.name,
        category: newMenuItem.category.trim() || null,
        basePrice: Number(newMenuItem.basePrice),
        description: newMenuItem.description.trim() || null,
        isActive: newMenuItem.isActive,
      }),
    });

    return await apiRequest<MenuItem[]>("/hq/menu-items");
  } catch (err) {
    return rejectWithValue(
      err instanceof Error ? err.message : "Failed to create menu item",
    );
  }
});

export const updateMenuItem = createAsyncThunk<
  { menuItems: MenuItem[] | null; notice: string },
  MenuItem,
  { state: { app: AppState }; rejectValue: string }
>("app/updateMenuItem", async (menuItem, { getState, rejectWithValue }) => {
  try {
    const { editDrafts } = getState().app;
    const draft = editDrafts[menuItem.id];

    if (!draft) {
      return {
        menuItems: null,
        notice: "No changes to save for this item.",
      };
    }

    const payload: Record<string, string | boolean | null | number> = {};

    if (draft.name !== menuItem.name) payload.name = draft.name;

    if ((draft.category || null) !== menuItem.category)
      payload.category = draft.category.trim() ? draft.category.trim() : null;

    if (
      Number(draft.basePrice).toFixed(2) !==
      Number(menuItem.basePrice).toFixed(2)
    ) {
      payload.basePrice = Number(draft.basePrice);
    }

    if ((draft.description || null) !== menuItem.description) {
      payload.description = draft.description.trim()
        ? draft.description.trim()
        : null;
    }

    if (draft.isActive !== menuItem.isActive) {
      payload.isActive = draft.isActive;
    }

    if (Object.keys(payload).length === 0) {
      return {
        menuItems: null,
        notice: "No changes to save for this item.",
      };
    }

    await apiRequest(`/hq/menu-items/${menuItem.id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });

    const menuItems = await apiRequest<MenuItem[]>("/hq/menu-items");
    return {
      menuItems,
      notice: `Updated ${menuItem.name}.`,
    };
  } catch (err) {
    return rejectWithValue(
      err instanceof Error ? err.message : "Failed to update menu item",
    );
  }
});

export const assignMenuItem = createAsyncThunk<
  { selectedOutletId: string; outletMenu: OutletMenuResponse | null },
  void,
  { state: { app: AppState }; rejectValue: string }
>("app/assignMenuItem", async (_, { getState, rejectWithValue }) => {
  try {
    const { assignmentForm } = getState().app;

    await apiRequest(
      `/hq/outlets/${assignmentForm.outletId}/menu-items/${assignmentForm.menuItemId}`,
      {
        method: "PUT",
        body: JSON.stringify({
          overridePrice: assignmentForm.overridePrice.trim()
            ? Number(assignmentForm.overridePrice)
            : null,
          isAvailable: assignmentForm.isAvailable,
        }),
      },
    );

    const outletMenu = assignmentForm.outletId
      ? await apiRequest<OutletMenuResponse>(
          `/outlets/${assignmentForm.outletId}/menu-items`,
        )
      : null;

    return {
      selectedOutletId: assignmentForm.outletId,
      outletMenu,
    };
  } catch (err) {
    return rejectWithValue(
      err instanceof Error ? err.message : "Failed to assign menu item",
    );
  }
});

const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    setActiveTab: (state, action: { payload: TabId }) => {
      state.activeTab = action.payload;
      state.error = null;
      state.notice = null;
    },
    setSelectedOutletId: (state, action: { payload: string }) => {
      state.selectedOutletId = action.payload;
    },
    updateNewMenuItemField: (
      state,
      action: {
        payload: {
          field: keyof NewMenuItemForm;
          value: string | boolean;
        };
      },
    ) => {
      state.newMenuItem[action.payload.field] = action.payload.value as never;
    },
    updateEditDraftField: (
      state,
      action: {
        payload: {
          id: string;
          field: keyof EditDraft;
          value: string | boolean;
        };
      },
    ) => {
      const current = state.editDrafts[action.payload.id];
      if (!current) {
        return;
      }
      current[action.payload.field] = action.payload.value as never;
    },
    updateAssignmentFormField: (
      state,
      action: {
        payload: {
          field: keyof AssignmentFormState;
          value: string | boolean;
        };
      },
    ) => {
      state.assignmentForm[action.payload.field] = action.payload
        .value as never;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadInitialData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadInitialData.fulfilled, (state, action) => {
        state.loading = false;
        state.initialized = true;
        state.error = null;
        state.menuItems = action.payload.menuItems;
        state.editDrafts = toDraftMap(action.payload.menuItems);
        state.outlets = action.payload.outlets;
        state.selectedOutletId = action.payload.selectedOutletId;
        state.assignmentForm.outletId = action.payload.selectedOutletId;
        state.outletMenu = action.payload.outletMenu;
      })
      .addCase(loadInitialData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to load data";
      })
      .addCase(fetchOutletMenu.pending, (state) => {
        state.error = null;
      })
      .addCase(fetchOutletMenu.fulfilled, (state, action) => {
        state.error = null;
        state.outletMenu = action.payload;
      })
      .addCase(fetchOutletMenu.rejected, (state, action) => {
        state.error = action.payload ?? "Failed to load outlet menu";
      })
      .addCase(createMenuItem.pending, (state) => {
        state.saving = true;
        state.error = null;
        state.notice = null;
      })
      .addCase(createMenuItem.fulfilled, (state, action) => {
        state.saving = false;
        state.error = null;
        state.notice = "Menu item created.";
        state.menuItems = action.payload;
        state.editDrafts = toDraftMap(action.payload);
        state.newMenuItem = EMPTY_NEW_ITEM;
      })
      .addCase(createMenuItem.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload ?? "Failed to create menu item";
      })
      .addCase(updateMenuItem.pending, (state) => {
        state.saving = true;
        state.error = null;
        state.notice = null;
      })
      .addCase(updateMenuItem.fulfilled, (state, action) => {
        state.saving = false;
        state.error = null;
        state.notice = action.payload.notice;

        if (action.payload.menuItems) {
          state.menuItems = action.payload.menuItems;
          state.editDrafts = toDraftMap(action.payload.menuItems);
        }
      })
      .addCase(updateMenuItem.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload ?? "Failed to update menu item";
      })
      .addCase(assignMenuItem.pending, (state) => {
        state.saving = true;
        state.error = null;
        state.notice = null;
      })
      .addCase(assignMenuItem.fulfilled, (state, action) => {
        state.saving = false;
        state.error = null;
        state.notice = "Menu item assignment updated.";
        state.selectedOutletId = action.payload.selectedOutletId;
        state.outletMenu = action.payload.outletMenu;
      })
      .addCase(assignMenuItem.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload ?? "Failed to assign menu item";
      });
  },
});

export const {
  setActiveTab,
  setSelectedOutletId,
  updateNewMenuItemField,
  updateEditDraftField,
  updateAssignmentFormField,
} = appSlice.actions;

export default appSlice.reducer;
