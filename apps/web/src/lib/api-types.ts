export type ProductCategory = "HARDWARE" | "SERVICE" | "SUBSCRIPTION" | "SOFTWARE_SUBSCRIPTION";
export type CustomerTier = "STANDARD" | "BRONZE" | "SILVER" | "GOLD";
export type QuoteStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "UNDER_NEGOTIATION"
  | "CONFIRMED"
  | "REJECTED"
  | "FULFILLED";
export type ApprovalLevel = "NONE" | "SALES_MANAGER" | "FINANCE";

export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  category: ProductCategory;
  costPrice: number;
  basePrice: number;
  taxRate?: number;
  isPromoted?: boolean;
  minMarginThreshold?: number;
  totalStock?: number;
}

export interface Customer {
  id: string;
  name: string;
  contactName?: string;
  company?: string;
  email: string;
  tier: CustomerTier;
  allowedDiscountCeiling?: number;
  historicalAvgDiscount?: number;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  code?: string;
  billingInterval: string;
  unitPrice: number;
  description?: string;
}

export interface CreateProductInput {
  name: string;
  sku: string;
  category: ProductCategory;
  listPrice: number;
  standardCost: number;
  description?: string;
  taxRate?: number;
  isPromoted?: boolean;
  minMarginThreshold?: number;
}

export interface CreateCustomerInput {
  name: string;
  email: string;
  contactName?: string;
  company?: string;
  tier: CustomerTier;
}

export interface CreateWarehouseInput {
  name: string;
  code: string;
  location: string;
  preferenceWeight?: number;
}

export interface ReplenishStockInput {
  productId: string;
  quantityAdded: number;
  variantId?: string | null;
}

export interface WarehouseStock {
  productId: string;
  quantityOnHand: number;
  reserved: number;
}

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  location?: string;
  shippingCostWeight?: number;
  stocks?: WarehouseStock[];
}

export interface QuoteLine {
  id: string;
  productId: string;
  productName: string;
  category: ProductCategory;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  lineSubtotal: number;
  costPrice: number;
  minMarginThreshold: number;
}

export interface Quote {
  id: string;
  quoteNumber: string;
  customerId: string;
  customerName: string;
  customerTier: CustomerTier;
  notes: string;
  status: QuoteStatus;
  blendedRiskScore: number;
  requiredApprovalLevel: ApprovalLevel;
  portalAccessToken: string;
  totalSubtotal: number;
  totalCost: number;
  totalMarginAmount: number;
  totalMarginPercent: number;
  createdAt: string;
  updatedAt: string;
  lines: QuoteLine[];
  auditLogs: Array<{
    id: string;
    action: string;
    actorName: string;
    actorRole: string;
    reason?: string | null;
    createdAt: string;
  }>;
}

export interface UpsellSuggestion {
  productId: string;
  name: string;
  category: ProductCategory;
  basePrice: number;
  costPrice: number;
  marginPercent: number;
  isPromoted: boolean;
  promotionTag: string;
  marginDeltaPercent: number;
  reason: string;
}

export interface QuotePreviewLine {
  productId: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  lineSubtotal: number;
  marginPercent: number;
  discountCeiling: number;
  discountViolation: number;
}

export interface QuotePreview {
  totalSubtotal: number;
  totalCost: number;
  totalMarginAmount: number;
  totalMarginPercent: number;
  blendedRiskScore: number;
  requiredApprovalLevel: ApprovalLevel;
  lines: QuotePreviewLine[];
}

export interface FulfillmentAllocation {
  warehouseId: string;
  warehouseName: string;
  productId: string;
  productName: string;
  quantityAllocated: number;
  quantityBackordered: number;
  status: "ALLOCATED" | "PARTIALLY_ALLOCATED" | "BACKORDER" | "SHIPPED";
}

export interface FulfillmentPlan {
  totalRequiredShipments: number;
  totalEstimatedShippingCost: number;
  hasBackorders: boolean;
  allocations: FulfillmentAllocation[];
}

export interface BillingInvoiceLine {
  description: string;
  amount: number;
}

export interface BillingInvoice {
  id: string;
  invoiceNumber: string;
  type: "ONE_TIME" | "RECURRING" | "PRORATED_SUPPLEMENTAL" | "CREDIT_NOTE";
  status: "DRAFT" | "ISSUED" | "PAID" | "CANCELLED";
  amount: number;
  dueDate: string;
  lines: BillingInvoiceLine[];
}

export interface BillingSchedule {
  billingDate: string;
  amount: number;
  status: string;
}

export interface SubscriptionContract {
  id: string;
  planName: string;
  status: "ACTIVE" | "PAUSED" | "CANCELLED";
  seats: number;
  unitPrice: number;
  recurringMonthlyAmount: number;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  schedules: BillingSchedule[];
}

export interface BillingSummary {
  invoices: BillingInvoice[];
  subscriptions: SubscriptionContract[];
}

export interface DealHealthAlert {
  id: string;
  quoteId: string;
  quoteNumber: string;
  customerName: string;
  repName: string;
  type: "STALLED_DEAL" | "DISCOUNT_ANOMALY" | "DELIVERY_SLIPPAGE";
  severity: "LOW" | "MEDIUM" | "HIGH";
  message: string;
  createdAt: string;
}

export interface DealHealthOverview {
  kpis: {
    activePipelineValue: number;
    pendingApprovalCount: number;
    stalledDealsCount: number;
    marginAtRisk: number;
  };
  alerts: DealHealthAlert[];
}