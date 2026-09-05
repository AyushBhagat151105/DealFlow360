export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: "HARDWARE" | "SERVICE" | "SUBSCRIPTION";
  costPrice: number;
  basePrice: number;
  taxRate: number;
  isPromoted: boolean;
  minMarginThreshold: number;
  totalStock: number;
}

export interface Customer {
  id: string;
  name: string;
  contactName: string;
  email: string;
  tier: "BRONZE" | "SILVER" | "GOLD";
  allowedDiscountCeiling: number;
  historicalAvgDiscount: number;
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
  shippingCostWeight: number;
  stocks: WarehouseStock[];
}

export interface QuoteLine {
  id: string;
  productId: string;
  productName: string;
  category: "HARDWARE" | "SERVICE" | "SUBSCRIPTION";
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
  customerTier: "BRONZE" | "SILVER" | "GOLD";
  notes: string;
  status:
    | "DRAFT"
    | "PENDING_APPROVAL"
    | "APPROVED"
    | "UNDER_NEGOTIATION"
    | "CONFIRMED"
    | "REJECTED"
    | "FULFILLED";
  blendedRiskScore: number;
  requiredApprovalLevel: "NONE" | "SALES_MANAGER" | "FINANCE";
  portalAccessToken: string;
  totalSubtotal: number;
  totalCost: number;
  totalMarginAmount: number;
  totalMarginPercent: number;
  createdAt: string;
  updatedAt: string;
  lines: QuoteLine[];
}

export interface UpsellSuggestion {
  productId: string;
  name: string;
  category: "HARDWARE" | "SERVICE" | "SUBSCRIPTION";
  basePrice: number;
  costPrice: number;
  marginPercent: number;
  isPromoted: boolean;
  promotionTag: string;
  marginDeltaPercent: number;
  reason: string;
}

export interface AnomalyAlert {
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

export const MOCK_PRODUCTS: Product[] = [
  {
    id: "prod_laptop_01",
    sku: "HW-LAPTOP-PRO",
    name: "Enterprise Pro Laptop 16\"",
    description: "32GB RAM, 1TB SSD Workstation",
    category: "HARDWARE",
    costPrice: 1200.0,
    basePrice: 1800.0,
    taxRate: 10.0,
    isPromoted: true,
    minMarginThreshold: 20.0,
    totalStock: 15,
  },
  {
    id: "prod_dock_02",
    sku: "HW-DOCK-TB4",
    name: "Thunderbolt 4 Quad-Display Dock",
    description: "Dual 4K support, 100W Power Delivery",
    category: "HARDWARE",
    costPrice: 120.0,
    basePrice: 250.0,
    taxRate: 10.0,
    isPromoted: true,
    minMarginThreshold: 30.0,
    totalStock: 40,
  },
  {
    id: "prod_monitor_03",
    sku: "HW-MONITOR-4K",
    name: "32\" 4K Ergonomic Workstation Monitor",
    description: "IPS panel, USB-C hub, height adjustable",
    category: "HARDWARE",
    costPrice: 350.0,
    basePrice: 650.0,
    taxRate: 10.0,
    isPromoted: false,
    minMarginThreshold: 25.0,
    totalStock: 25,
  },
  {
    id: "prod_service_01",
    sku: "SRV-SETUP-ONBOARD",
    name: "Enterprise Onboarding & Migration",
    description: "Dedicated engineer 2-week deployment",
    category: "SERVICE",
    costPrice: 1600.0,
    basePrice: 2000.0,
    taxRate: 10.0,
    isPromoted: false,
    minMarginThreshold: 15.0,
    totalStock: 999,
  },
  {
    id: "prod_service_02",
    sku: "SRV-SUPP-247",
    name: "24/7 Priority SLA Support (1-Year)",
    description: "15-min response SLA & dedicated TAM",
    category: "SERVICE",
    costPrice: 2000.0,
    basePrice: 4000.0,
    taxRate: 10.0,
    isPromoted: true,
    minMarginThreshold: 35.0,
    totalStock: 999,
  },
  {
    id: "prod_sub_01",
    sku: "SUB-SAAS-PLATFORM",
    name: "DealFlow Cloud Platform License",
    description: "Per user monthly SaaS license",
    category: "SUBSCRIPTION",
    costPrice: 15.0,
    basePrice: 60.0,
    taxRate: 10.0,
    isPromoted: true,
    minMarginThreshold: 40.0,
    totalStock: 9999,
  },
  {
    id: "prod_sub_02",
    sku: "SUB-SECURITY-ADDON",
    name: "Advanced Threat Security Addon",
    description: "Per user monthly zero-trust security module",
    category: "SUBSCRIPTION",
    costPrice: 5.0,
    basePrice: 25.0,
    taxRate: 10.0,
    isPromoted: true,
    minMarginThreshold: 50.0,
    totalStock: 9999,
  },
];

export const MOCK_CUSTOMERS: Customer[] = [
  {
    id: "cust_acme_01",
    name: "Acme Technologies",
    contactName: "Alice Johnson",
    email: "alice@acmetech.io",
    tier: "GOLD",
    allowedDiscountCeiling: 15.0,
    historicalAvgDiscount: 8.5,
  },
  {
    id: "cust_beta_02",
    name: "Beta Industries",
    contactName: "Bob Smith",
    email: "bob@betaind.com",
    tier: "SILVER",
    allowedDiscountCeiling: 10.0,
    historicalAvgDiscount: 6.0,
  },
  {
    id: "cust_startup_03",
    name: "StartupX Labs",
    contactName: "Charlie Davis",
    email: "charlie@startupx.co",
    tier: "BRONZE",
    allowedDiscountCeiling: 5.0,
    historicalAvgDiscount: 4.0,
  },
];

export const MOCK_WAREHOUSES: Warehouse[] = [
  {
    id: "wh_main_01",
    code: "WH-CHI",
    name: "Main Warehouse (Chicago)",
    shippingCostWeight: 1.0,
    stocks: [
      { productId: "prod_laptop_01", quantityOnHand: 10, reserved: 0 },
      { productId: "prod_dock_02", quantityOnHand: 30, reserved: 0 },
      { productId: "prod_monitor_03", quantityOnHand: 20, reserved: 0 },
    ],
  },
  {
    id: "wh_east_02",
    code: "WH-NYC",
    name: "East Depot (New York)",
    shippingCostWeight: 1.5,
    stocks: [
      { productId: "prod_laptop_01", quantityOnHand: 5, reserved: 0 },
      { productId: "prod_dock_02", quantityOnHand: 10, reserved: 0 },
      { productId: "prod_monitor_03", quantityOnHand: 5, reserved: 0 },
    ],
  },
];

export const MOCK_QUOTES: Quote[] = [
  {
    id: "quote_42",
    quoteNumber: "QT-2026-0042",
    customerId: "cust_acme_01",
    customerName: "Acme Technologies",
    customerTier: "GOLD",
    notes: "Q1 Workstation & Platform Refresh",
    status: "PENDING_APPROVAL",
    blendedRiskScore: 11,
    requiredApprovalLevel: "FINANCE",
    portalAccessToken: "demo-token-acme",
    totalSubtotal: 9920.0,
    totalCost: 7600.0,
    totalMarginAmount: 2320.0,
    totalMarginPercent: 23.39,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lines: [
      {
        id: "line_01",
        productId: "prod_laptop_01",
        productName: "Enterprise Pro Laptop 16\"",
        category: "HARDWARE",
        quantity: 5,
        unitPrice: 1800.0,
        discountPercent: 12.0,
        lineSubtotal: 7920.0,
        costPrice: 1200.0,
        minMarginThreshold: 20.0,
      },
      {
        id: "line_02",
        productId: "prod_service_01",
        productName: "Enterprise Onboarding & Migration",
        category: "SERVICE",
        quantity: 1,
        unitPrice: 2000.0,
        discountPercent: 18.0,
        lineSubtotal: 1640.0,
        costPrice: 1600.0,
        minMarginThreshold: 15.0,
      },
      {
        id: "line_03",
        productId: "prod_sub_01",
        productName: "DealFlow Cloud Platform License",
        category: "SUBSCRIPTION",
        quantity: 10,
        unitPrice: 60.0,
        discountPercent: 5.0,
        lineSubtotal: 570.0,
        costPrice: 15.0,
        minMarginThreshold: 40.0,
      },
    ],
  },
  {
    id: "quote_19",
    quoteNumber: "QT-2026-0019",
    customerId: "cust_beta_02",
    customerName: "Beta Industries",
    customerTier: "SILVER",
    notes: "Secondary Depot Expansion",
    status: "DRAFT",
    blendedRiskScore: 4,
    requiredApprovalLevel: "SALES_MANAGER",
    portalAccessToken: "demo-token-beta",
    totalSubtotal: 15400.0,
    totalCost: 11000.0,
    totalMarginAmount: 4400.0,
    totalMarginPercent: 28.57,
    createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 6).toISOString(),
    lines: [
      {
        id: "line_04",
        productId: "prod_laptop_01",
        productName: "Enterprise Pro Laptop 16\"",
        category: "HARDWARE",
        quantity: 8,
        unitPrice: 1800.0,
        discountPercent: 8.0,
        lineSubtotal: 13248.0,
        costPrice: 1200.0,
        minMarginThreshold: 20.0,
      },
    ],
  },
];

export const MOCK_UPSELL_SUGGESTIONS: UpsellSuggestion[] = [
  {
    productId: "prod_dock_02",
    name: "Thunderbolt 4 Quad-Display Dock",
    category: "HARDWARE",
    basePrice: 250.0,
    costPrice: 120.0,
    marginPercent: 52.0,
    isPromoted: true,
    promotionTag: "Hardware Pairing Bundle",
    marginDeltaPercent: 3.42,
    reason: "Frequently bought with Enterprise Laptop",
  },
  {
    productId: "prod_service_02",
    name: "24/7 Priority SLA Support (1-Year)",
    category: "SERVICE",
    basePrice: 4000.0,
    costPrice: 2000.0,
    marginPercent: 50.0,
    isPromoted: true,
    promotionTag: "High Margin SLA",
    marginDeltaPercent: 6.85,
    reason: "Guarantees 15-minute emergency response time",
  },
];

export const MOCK_DASHBOARD_DATA = {
  kpis: {
    activePipelineValue: 142000.0,
    pendingApprovalCount: 4,
    stalledDealsCount: 2,
    marginAtRisk: 18400.0,
  },
  alerts: [
    {
      id: "alt_01",
      quoteId: "quote_42",
      quoteNumber: "QT-2026-0042",
      customerName: "Acme Technologies",
      repName: "Alice Rep",
      type: "DISCOUNT_ANOMALY",
      severity: "HIGH",
      message: "Quotation discount (18%) is +11.5% above Alice's historical average (6.5%)",
      createdAt: new Date().toISOString(),
    },
    {
      id: "alt_02",
      quoteId: "quote_19",
      quoteNumber: "QT-2026-0019",
      customerName: "Beta Industries",
      repName: "Bob Rep",
      type: "STALLED_DEAL",
      severity: "MEDIUM",
      message: "Quotation has been in DRAFT with no customer interaction for 6 days",
      createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
    },
  ] as AnomalyAlert[],
};
