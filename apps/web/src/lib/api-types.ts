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

export type FulfillmentAllocation = {
  quotationLineId?: string;
  warehouseId: string | null;
  warehouseName: string;
  productId: string;
  productName: string;
  quantityRequested?: number;
  quantityAllocated: number;
  quantityBackordered: number;
  status: "ALLOCATED" | "PARTIALLY_ALLOCATED" | "BACKORDER" | "SHIPPED";
};

export type FulfillmentPlan = {
  quoteId?: string;
  totalRequiredShipments: number;
  totalEstimatedShippingCost: number;
  hasBackorders: boolean;
  allocations: FulfillmentAllocation[];
};

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
  repName?: string;
  type: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  message: string;
  metricDelta?: number | null;
  isNudged?: boolean;
  isEscalated?: boolean;
  escalatedTo?: string | null;
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

export type UpdateCustomerInput = Partial<CreateCustomerInput> & {
  phone?: string;
  address?: string;
};

export type UserItem = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
};

export type RequestMagicLinkInput = {
  email: string;
  quoteNumber?: string;
};

export type SendPortalLinkInput = {
  recipientEmail: string;
  customMessage?: string;
};

export type SubmitCounterInput = {
  authorName: string;
  proposedDiscounts: Array<{
    lineId: string;
    counterDiscountPercent: number;
  }>;
  comment?: string;
};

export type SalesReportItem = {
  quoteNumber: string;
  customerName: string;
  customerTier: CustomerTier;
  status: QuoteStatus;
  totalAmount: number;
  totalCost: number;
  totalMarginPercent: number;
  blendedRiskScore: number;
  requiredApprovalLevel: ApprovalLevel;
  lineCount: number;
  createdAt: string;
};

export type InvoiceListItem = {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customer: {
    id: string;
    name: string;
    contactName?: string | null;
    email: string;
    tier: CustomerTier;
  };
  quotationId?: string | null;
  quotation?: {
    id: string;
    quoteNumber: string;
    status: QuoteStatus;
  } | null;
  type: "ONE_TIME" | "RECURRING" | "PRORATED_SUPPLEMENTAL" | "CREDIT_NOTE";
  status: "DRAFT" | "ISSUED" | "PAID" | "CANCELLED";
  amount: number;
  dueDate: string;
  paidAt?: string | null;
  createdAt: string;
  lines: Array<{
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>;
  payments: Array<{
    id: string;
    amount: number;
    paymentMethod: string;
    reference?: string | null;
    paidAt: string;
  }>;
};

export type InvoicesSummary = {
  totalInvoiced: number;
  totalPaid: number;
  totalOutstanding: number;
  overdueCount: number;
};

export type InvoicesListResponse = {
  invoices: InvoiceListItem[];
  total: number;
  summary: InvoicesSummary;
};

export type CategoryRevenueStat = {
  category: ProductCategory;
  revenue: number;
  cost: number;
  marginPercent: number;
  lineCount: number;
};

export type TierGovernanceStat = {
  tier: string;
  quoteCount: number;
  actualAvgDiscount: number;
  ceilingPercent: number;
  breachCount: number;
  variance: number;
};

export type RepPerformanceStat = {
  repId: string;
  repName: string;
  quoteCount: number;
  totalPipeline: number;
  wonRevenue: number;
  avgMarginPercent: number;
};

export type SalesAnalyticsReport = {
  summary: {
    totalQuotes: number;
    totalRevenue: number;
    totalCost: number;
    avgMarginPercent: number;
    avgRiskScore: number;
  };
  categoryBreakdown: CategoryRevenueStat[];
  tierGovernance: TierGovernanceStat[];
  repPerformance: RepPerformanceStat[];
};
