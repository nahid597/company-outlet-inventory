export type TabId = "menu" | "assignment" | "outlet" | "inventory";

export type MenuItem = {
  id: string;
  name: string;
  category: string | null;
  basePrice: string;
  description: string | null;
  isActive: boolean;
};

export type Outlet = {
  id: string;
  code: string;
  name: string;
};

export type OutletMenuItem = {
  assignmentId: string;
  menuItemId: string;
  name: string;
  category: string | null;
  basePrice: string;
  overridePrice: string | null;
  effectivePrice: string;
  description: string | null;
};

export type OutletMenuResponse = {
  outlet: Outlet;
  items: OutletMenuItem[];
};

export type EditDraft = {
  name: string;
  category: string;
  basePrice: string;
  description: string;
  isActive: boolean;
};

export type NewMenuItemForm = {
  name: string;
  category: string;
  basePrice: string;
  description: string;
  isActive: boolean;
};

export type AssignmentFormState = {
  outletId: string;
  menuItemId: string;
  overridePrice: string;
  isAvailable: boolean;
};

export type OutletInventoryItem = {
  outletMenuItemId: string;
  menuItemId: string;
  name: string;
  category: string | null;
  basePrice: string;
  overridePrice: string | null;
  effectivePrice: string;
  isAvailable: boolean;
  quantity: number;
  updatedAt: string | null;
};

export type OutletInventoryResponse = {
  outlet: Outlet;
  items: OutletInventoryItem[];
};

export type InventoryFormState = {
  outletId: string;
  outletMenuItemId: string;
  quantity: string;
  delta: string;
};
