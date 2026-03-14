export type TabId =
  | "menu"
  | "assignment"
  | "outlet"
  | "inventory"
  | "sales"
  | "reports";

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

export type SalesFormState = {
  outletId: string;
  outletMenuItemId: string;
  quantity: string;
};

export type SaleCartItem = {
  outletMenuItemId: string;
  menuItemId: string;
  name: string;
  unitPrice: string;
  quantity: number;
  availableStock: number;
};

export type SaleReceiptItem = {
  outletMenuItemId: string;
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: string;
  subtotal: string;
  remainingStock: number;
};

export type SaleReceipt = {
  saleId: string;
  receiptNumber: string;
  totalAmount: string;
  createdAt: string;
  outlet: Outlet;
  items: SaleReceiptItem[];
};

export type RecentSaleItem = SaleReceiptItem & {
  saleItemId: string;
};

export type RecentSale = {
  saleId: string;
  receiptNumber: string;
  totalAmount: string;
  createdAt: string;
  itemCount: number;
  items: RecentSaleItem[];
};

export type RecentSalesResponse = {
  outlet: Outlet;
  sales: RecentSale[];
};

export type RevenueByOutletRow = {
  outletId: string;
  outletCode: string;
  outletName: string;
  saleCount: number;
  totalRevenue: string;
};

export type RevenueByOutletReport = {
  generatedAt: string;
  outlets: RevenueByOutletRow[];
};

export type TopItemRow = {
  menuItemId: string;
  name: string;
  quantitySold: number;
  revenue: string;
};

export type TopItemsReport = {
  generatedAt: string;
  outlet: Outlet;
  items: TopItemRow[];
};
