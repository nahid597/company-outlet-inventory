import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

import { apiRequest } from "../api/client";
import type {
  AssignmentFormState,
  EditDraft,
  InventoryFormState,
  MenuItem,
  NewMenuItemForm,
  Outlet,
  OutletInventoryItem,
  OutletInventoryResponse,
  OutletMenuResponse,
  RevenueByOutletReport,
  RecentSalesResponse,
  SaleCartItem,
  SaleReceipt,
  SalesFormState,
  TopItemsReport,
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
  outletInventory: OutletInventoryResponse | null;
  salesInventory: OutletInventoryResponse | null;
  recentSales: RecentSalesResponse | null;
  reportsRevenue: RevenueByOutletReport | null;
  reportsTopItems: TopItemsReport | null;
  reportsOutletId: string;
  newMenuItem: NewMenuItemForm;
  editDrafts: Record<string, EditDraft>;
  assignmentForm: AssignmentFormState;
  inventoryForm: InventoryFormState;
  salesForm: SalesFormState;
  saleCart: SaleCartItem[];
  lastReceipt: SaleReceipt | null;
  initialized: boolean;
};

const EMPTY_NEW_ITEM: NewMenuItemForm = {
  name: "",
  category: "",
  basePrice: "",
  description: "",
  isActive: true,
};

const EMPTY_INVENTORY_FORM: InventoryFormState = {
  outletId: "",
  outletMenuItemId: "",
  quantity: "",
  delta: "",
};

const EMPTY_SALES_FORM: SalesFormState = {
  outletId: "",
  outletMenuItemId: "",
  quantity: "1",
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
  outletInventory: null,
  salesInventory: null,
  recentSales: null,
  reportsRevenue: null,
  reportsTopItems: null,
  reportsOutletId: "",
  newMenuItem: EMPTY_NEW_ITEM,
  editDrafts: {},
  assignmentForm: {
    outletId: "",
    menuItemId: "",
    overridePrice: "",
    isAvailable: true,
  },
  inventoryForm: EMPTY_INVENTORY_FORM,
  salesForm: EMPTY_SALES_FORM,
  saleCart: [],
  lastReceipt: null,
  initialized: false,
};

export const loadInitialData = createAsyncThunk<
  {
    menuItems: MenuItem[];
    outlets: Outlet[];
    selectedOutletId: string;
    outletMenu: OutletMenuResponse | null;
    outletInventory: OutletInventoryResponse | null;
    recentSales: RecentSalesResponse | null;
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
    if (!selectedOutletId) {
      return {
        menuItems,
        outlets,
        selectedOutletId,
        outletMenu: null,
        outletInventory: null,
        recentSales: null,
      };
    }

    const [outletMenu, outletInventory, recentSales] = await Promise.all([
      apiRequest<OutletMenuResponse>(`/outlets/${selectedOutletId}/menu-items`),
      apiRequest<OutletInventoryResponse>(
        `/outlets/${selectedOutletId}/inventory`,
      ),
      apiRequest<RecentSalesResponse>(`/outlets/${selectedOutletId}/sales`),
    ]);

    return {
      menuItems,
      outlets,
      selectedOutletId,
      outletMenu,
      outletInventory,
      recentSales,
    };
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

export const fetchOutletInventory = createAsyncThunk<
  OutletInventoryResponse | null,
  string,
  { rejectValue: string }
>("app/fetchOutletInventory", async (outletId, { rejectWithValue }) => {
  try {
    if (!outletId) {
      return null;
    }

    return await apiRequest<OutletInventoryResponse>(
      `/outlets/${outletId}/inventory`,
    );
  } catch (err) {
    return rejectWithValue(
      err instanceof Error ? err.message : "Failed to load outlet inventory",
    );
  }
});

export const fetchSalesInventory = createAsyncThunk<
  OutletInventoryResponse | null,
  string,
  { rejectValue: string }
>("app/fetchSalesInventory", async (outletId, { rejectWithValue }) => {
  try {
    if (!outletId) {
      return null;
    }

    return await apiRequest<OutletInventoryResponse>(
      `/outlets/${outletId}/inventory`,
    );
  } catch (err) {
    return rejectWithValue(
      err instanceof Error ? err.message : "Failed to load POS inventory",
    );
  }
});

export const fetchRecentSales = createAsyncThunk<
  RecentSalesResponse | null,
  string,
  { rejectValue: string }
>("app/fetchRecentSales", async (outletId, { rejectWithValue }) => {
  try {
    if (!outletId) {
      return null;
    }

    return await apiRequest<RecentSalesResponse>(`/outlets/${outletId}/sales`);
  } catch (err) {
    return rejectWithValue(
      err instanceof Error ? err.message : "Failed to load recent sales",
    );
  }
});

export const fetchRevenueReport = createAsyncThunk<
  RevenueByOutletReport,
  void,
  { rejectValue: string }
>("app/fetchRevenueReport", async (_, { rejectWithValue }) => {
  try {
    return await apiRequest<RevenueByOutletReport>(
      "/hq/reports/revenue-by-outlet",
    );
  } catch (err) {
    return rejectWithValue(
      err instanceof Error ? err.message : "Failed to load revenue report",
    );
  }
});

export const fetchTopItemsReport = createAsyncThunk<
  TopItemsReport | null,
  string,
  { rejectValue: string }
>("app/fetchTopItemsReport", async (outletId, { rejectWithValue }) => {
  try {
    if (!outletId) {
      return null;
    }

    return await apiRequest<TopItemsReport>(
      `/hq/reports/outlets/${outletId}/top-items`,
    );
  } catch (err) {
    return rejectWithValue(
      err instanceof Error ? err.message : "Failed to load top items report",
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

    if ((draft.category || null) !== menuItem.category) {
      payload.category = draft.category.trim() ? draft.category.trim() : null;
    }

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
  {
    selectedOutletId: string;
    outletMenu: OutletMenuResponse | null;
    outletInventory: OutletInventoryResponse | null;
  },
  void,
  { state: { app: AppState }; rejectValue: string }
>("app/assignMenuItem", async (_, { getState, rejectWithValue }) => {
  try {
    const { assignmentForm, inventoryForm, salesForm } = getState().app;

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

    const shouldRefreshInventory =
      inventoryForm.outletId === assignmentForm.outletId ||
      salesForm.outletId === assignmentForm.outletId;

    const outletInventory = shouldRefreshInventory
      ? await apiRequest<OutletInventoryResponse>(
          `/outlets/${assignmentForm.outletId}/inventory`,
        )
      : null;

    return {
      selectedOutletId: assignmentForm.outletId,
      outletMenu,
      outletInventory,
    };
  } catch (err) {
    return rejectWithValue(
      err instanceof Error ? err.message : "Failed to assign menu item",
    );
  }
});

export const setInventoryQuantity = createAsyncThunk<
  OutletInventoryResponse,
  void,
  { state: { app: AppState }; rejectValue: string }
>("app/setInventoryQuantity", async (_, { getState, rejectWithValue }) => {
  try {
    const { inventoryForm } = getState().app;

    if (!inventoryForm.outletId || !inventoryForm.outletMenuItemId) {
      return rejectWithValue(
        "Select outlet and menu item before setting stock",
      );
    }

    if (inventoryForm.quantity.trim() === "") {
      return rejectWithValue("Quantity is required");
    }

    await apiRequest(
      `/outlets/${inventoryForm.outletId}/inventory/${inventoryForm.outletMenuItemId}`,
      {
        method: "PUT",
        body: JSON.stringify({
          quantity: Number(inventoryForm.quantity),
        }),
      },
    );

    return await apiRequest<OutletInventoryResponse>(
      `/outlets/${inventoryForm.outletId}/inventory`,
    );
  } catch (err) {
    return rejectWithValue(
      err instanceof Error ? err.message : "Failed to set inventory quantity",
    );
  }
});

export const adjustInventoryQuantity = createAsyncThunk<
  OutletInventoryResponse,
  void,
  { state: { app: AppState }; rejectValue: string }
>("app/adjustInventoryQuantity", async (_, { getState, rejectWithValue }) => {
  try {
    const { inventoryForm } = getState().app;

    if (!inventoryForm.outletId || !inventoryForm.outletMenuItemId) {
      return rejectWithValue(
        "Select outlet and menu item before adjusting stock",
      );
    }

    if (inventoryForm.delta.trim() === "") {
      return rejectWithValue("Delta is required");
    }

    await apiRequest(
      `/outlets/${inventoryForm.outletId}/inventory/${inventoryForm.outletMenuItemId}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          delta: Number(inventoryForm.delta),
        }),
      },
    );

    return await apiRequest<OutletInventoryResponse>(
      `/outlets/${inventoryForm.outletId}/inventory`,
    );
  } catch (err) {
    return rejectWithValue(
      err instanceof Error
        ? err.message
        : "Failed to adjust inventory quantity",
    );
  }
});

export const createSale = createAsyncThunk<
  {
    receipt: SaleReceipt;
    salesInventory: OutletInventoryResponse;
    recentSales: RecentSalesResponse;
    outletInventory: OutletInventoryResponse | null;
  },
  void,
  { state: { app: AppState }; rejectValue: string }
>("app/createSale", async (_, { getState, rejectWithValue }) => {
  try {
    const { saleCart, salesForm, inventoryForm } = getState().app;

    if (!salesForm.outletId) {
      return rejectWithValue("Select an outlet before creating a sale");
    }

    if (saleCart.length === 0) {
      return rejectWithValue(
        "Add at least one item to the cart before checkout",
      );
    }

    const receipt = await apiRequest<SaleReceipt>(
      `/outlets/${salesForm.outletId}/sales`,
      {
        method: "POST",
        body: JSON.stringify({
          items: saleCart.map((item) => ({
            outletMenuItemId: item.outletMenuItemId,
            quantity: item.quantity,
          })),
        }),
      },
    );

    const salesInventory = await apiRequest<OutletInventoryResponse>(
      `/outlets/${salesForm.outletId}/inventory`,
    );
    const recentSales = await apiRequest<RecentSalesResponse>(
      `/outlets/${salesForm.outletId}/sales`,
    );

    return {
      receipt,
      salesInventory,
      recentSales,
      outletInventory:
        inventoryForm.outletId === salesForm.outletId ? salesInventory : null,
    };
  } catch (err) {
    return rejectWithValue(
      err instanceof Error ? err.message : "Failed to create sale",
    );
  }
});

const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    setActiveTab: (state, action: PayloadAction<TabId>) => {
      state.activeTab = action.payload;
      state.error = null;
      state.notice = null;
    },
    setSelectedOutletId: (state, action: PayloadAction<string>) => {
      state.selectedOutletId = action.payload;
    },
    setInventoryOutletId: (state, action: PayloadAction<string>) => {
      state.inventoryForm.outletId = action.payload;
      state.inventoryForm.outletMenuItemId = "";
      state.error = null;
      state.notice = null;
    },
    setReportsOutletId: (state, action: PayloadAction<string>) => {
      state.reportsOutletId = action.payload;
      state.error = null;
      state.notice = null;
    },
    setSalesOutletId: (state, action: PayloadAction<string>) => {
      state.salesForm.outletId = action.payload;
      state.salesForm.outletMenuItemId = "";
      state.salesForm.quantity = "1";
      state.saleCart = [];
      state.lastReceipt = null;
      state.recentSales = null;
      state.error = null;
      state.notice = null;
    },
    updateNewMenuItemField: (
      state,
      action: PayloadAction<{
        field: keyof NewMenuItemForm;
        value: string | boolean;
      }>,
    ) => {
      state.newMenuItem[action.payload.field] = action.payload.value as never;
    },
    updateEditDraftField: (
      state,
      action: PayloadAction<{
        id: string;
        field: keyof EditDraft;
        value: string | boolean;
      }>,
    ) => {
      const current = state.editDrafts[action.payload.id];
      if (!current) {
        return;
      }

      current[action.payload.field] = action.payload.value as never;
    },
    updateAssignmentFormField: (
      state,
      action: PayloadAction<{
        field: keyof AssignmentFormState;
        value: string | boolean;
      }>,
    ) => {
      state.assignmentForm[action.payload.field] = action.payload
        .value as never;
    },
    updateInventoryFormField: (
      state,
      action: PayloadAction<{
        field: keyof InventoryFormState;
        value: string;
      }>,
    ) => {
      state.inventoryForm[action.payload.field] = action.payload.value as never;
    },
    updateSalesFormField: (
      state,
      action: PayloadAction<{
        field: keyof SalesFormState;
        value: string;
      }>,
    ) => {
      state.salesForm[action.payload.field] = action.payload.value as never;
    },
    addSaleCartItem: (
      state,
      action: PayloadAction<{ item: OutletInventoryItem; quantity: number }>,
    ) => {
      const normalizedQuantity = Number.isInteger(action.payload.quantity)
        ? Math.max(1, action.payload.quantity)
        : 1;

      const existing = state.saleCart.find(
        (item) =>
          item.outletMenuItemId === action.payload.item.outletMenuItemId,
      );

      if (existing) {
        existing.quantity = Math.min(
          existing.quantity + normalizedQuantity,
          action.payload.item.quantity,
        );
        existing.availableStock = action.payload.item.quantity;
        return;
      }

      state.saleCart.push({
        outletMenuItemId: action.payload.item.outletMenuItemId,
        menuItemId: action.payload.item.menuItemId,
        name: action.payload.item.name,
        unitPrice: action.payload.item.effectivePrice,
        quantity: Math.min(normalizedQuantity, action.payload.item.quantity),
        availableStock: action.payload.item.quantity,
      });
    },
    removeSaleCartItem: (state, action: PayloadAction<string>) => {
      state.saleCart = state.saleCart.filter(
        (item) => item.outletMenuItemId !== action.payload,
      );
    },
    updateSaleCartItemQuantity: (
      state,
      action: PayloadAction<{ outletMenuItemId: string; quantity: number }>,
    ) => {
      const item = state.saleCart.find(
        (entry) => entry.outletMenuItemId === action.payload.outletMenuItemId,
      );

      if (!item) {
        return;
      }

      item.quantity = Math.max(
        1,
        Math.min(action.payload.quantity, item.availableStock),
      );
    },
    clearSaleCart: (state) => {
      state.saleCart = [];
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
        state.outletInventory = action.payload.outletInventory;
        state.salesInventory = action.payload.outletInventory;
        state.recentSales = action.payload.recentSales;
        state.reportsOutletId = action.payload.selectedOutletId;
        state.inventoryForm.outletId = action.payload.selectedOutletId;
        state.salesForm.outletId = action.payload.selectedOutletId;
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
      .addCase(fetchOutletInventory.pending, (state) => {
        state.error = null;
      })
      .addCase(fetchOutletInventory.fulfilled, (state, action) => {
        state.error = null;
        state.outletInventory = action.payload;
      })
      .addCase(fetchOutletInventory.rejected, (state, action) => {
        state.error = action.payload ?? "Failed to load outlet inventory";
      })
      .addCase(fetchSalesInventory.pending, (state) => {
        state.error = null;
      })
      .addCase(fetchSalesInventory.fulfilled, (state, action) => {
        state.error = null;
        state.salesInventory = action.payload;
      })
      .addCase(fetchSalesInventory.rejected, (state, action) => {
        state.error = action.payload ?? "Failed to load POS inventory";
      })
      .addCase(fetchRecentSales.pending, (state) => {
        state.error = null;
      })
      .addCase(fetchRecentSales.fulfilled, (state, action) => {
        state.error = null;
        state.recentSales = action.payload;
      })
      .addCase(fetchRecentSales.rejected, (state, action) => {
        state.error = action.payload ?? "Failed to load recent sales";
      })
      .addCase(fetchRevenueReport.pending, (state) => {
        state.error = null;
      })
      .addCase(fetchRevenueReport.fulfilled, (state, action) => {
        state.error = null;
        state.reportsRevenue = action.payload;
      })
      .addCase(fetchRevenueReport.rejected, (state, action) => {
        state.error = action.payload ?? "Failed to load revenue report";
      })
      .addCase(fetchTopItemsReport.pending, (state) => {
        state.error = null;
      })
      .addCase(fetchTopItemsReport.fulfilled, (state, action) => {
        state.error = null;
        state.reportsTopItems = action.payload;
      })
      .addCase(fetchTopItemsReport.rejected, (state, action) => {
        state.error = action.payload ?? "Failed to load top items report";
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
        if (action.payload.outletInventory) {
          if (
            state.inventoryForm.outletId === action.payload.selectedOutletId
          ) {
            state.outletInventory = action.payload.outletInventory;
          }

          if (state.salesForm.outletId === action.payload.selectedOutletId) {
            state.salesInventory = action.payload.outletInventory;
          }
        }
      })
      .addCase(assignMenuItem.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload ?? "Failed to assign menu item";
      })
      .addCase(setInventoryQuantity.pending, (state) => {
        state.saving = true;
        state.error = null;
        state.notice = null;
      })
      .addCase(setInventoryQuantity.fulfilled, (state, action) => {
        state.saving = false;
        state.error = null;
        state.notice = "Inventory quantity updated.";
        state.outletInventory = action.payload;
        if (state.salesForm.outletId === action.payload.outlet.id) {
          state.salesInventory = action.payload;
        }
        state.inventoryForm.quantity = "";
      })
      .addCase(setInventoryQuantity.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload ?? "Failed to set inventory quantity";
      })
      .addCase(adjustInventoryQuantity.pending, (state) => {
        state.saving = true;
        state.error = null;
        state.notice = null;
      })
      .addCase(adjustInventoryQuantity.fulfilled, (state, action) => {
        state.saving = false;
        state.error = null;
        state.notice = "Inventory quantity adjusted.";
        state.outletInventory = action.payload;
        if (state.salesForm.outletId === action.payload.outlet.id) {
          state.salesInventory = action.payload;
        }
        state.inventoryForm.delta = "";
      })
      .addCase(adjustInventoryQuantity.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload ?? "Failed to adjust inventory quantity";
      })
      .addCase(createSale.pending, (state) => {
        state.saving = true;
        state.error = null;
        state.notice = null;
      })
      .addCase(createSale.fulfilled, (state, action) => {
        state.saving = false;
        state.error = null;
        state.notice = `Sale ${action.payload.receipt.receiptNumber} created.`;
        state.lastReceipt = action.payload.receipt;
        state.salesInventory = action.payload.salesInventory;
        state.recentSales = action.payload.recentSales;
        if (action.payload.outletInventory) {
          state.outletInventory = action.payload.outletInventory;
        }
        state.saleCart = [];
        state.salesForm.outletMenuItemId = "";
        state.salesForm.quantity = "1";
      })
      .addCase(createSale.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload ?? "Failed to create sale";
      });
  },
});

export const {
  addSaleCartItem,
  clearSaleCart,
  removeSaleCartItem,
  setActiveTab,
  setInventoryOutletId,
  setReportsOutletId,
  setSalesOutletId,
  setSelectedOutletId,
  updateSaleCartItemQuantity,
  updateAssignmentFormField,
  updateEditDraftField,
  updateInventoryFormField,
  updateNewMenuItemField,
  updateSalesFormField,
} = appSlice.actions;

export default appSlice.reducer;
