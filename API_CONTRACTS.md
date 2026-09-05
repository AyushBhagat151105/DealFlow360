# DealFlow360 — API & Data Contracts Specification
> **Bridge Document for Multi-Machine Collaboration (Dev 1 & Dev 2)**  
> This document is the single source of truth for all data models, API endpoints, JSON request/response payloads, calculation formulas, and seed data. Both developers' AI agents should consult this file to ensure zero integration mismatches.

---

## 🌟 Live Interactive API Documentation & LLM Reference
- **Interactive Scalar UI (for Judges & Frontend Dev)**: [http://localhost:3001/scalar](http://localhost:3001/scalar) (or `/docs`) — Interactive try-it-out API explorer with cURL and JS code snippets.
- **OpenAPI 3.1 Document**: [http://localhost:3001/doc](http://localhost:3001/doc)
- **Machine-Readable Markdown for LLMs & AI Agents**: [http://localhost:3001/llms.txt](http://localhost:3001/llms.txt) — Any AI agent can query this directly for endpoint definitions.

---

## 1. Global Conventions & Response Envelope

All API endpoints live under `http://localhost:3001/api/*` (or configured `VITE_API_URL`).  
Every response strictly follows the standard API envelope:

### Success Response (`200 OK`, `201 Created`)
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional descriptive success message"
}
```

### Error Response (`400`, `401`, `403`, `404`, `500`)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR | NOT_FOUND | UNAUTHORIZED | APPROVAL_REQUIRED",
    "message": "Human readable error description",
    "details": null
  }
}
```

---

## 2. Core Enums & Business Constants

```typescript
// Customer Tiers & Default Ceilings
export type CustomerTier = "BRONZE" | "SILVER" | "GOLD";
export const CUSTOMER_TIER_CEILINGS: Record<CustomerTier, number> = {
  BRONZE: 5,   // 5% max discount without approval
  SILVER: 10,  // 10% max discount without approval
  GOLD: 15,    // 15% max discount without approval
};

// Product Categories & Discretionary Ceilings
export type ProductCategory = "HARDWARE" | "SERVICE" | "SUBSCRIPTION";
export const CATEGORY_CEILINGS: Record<ProductCategory, number> = {
  HARDWARE: 15,     // 15% discount ceiling (healthier margin)
  SERVICE: 10,      // 10% discount ceiling (thin margin)
  SUBSCRIPTION: 12, // 12% discount ceiling
};

// Quotation Stages
export type QuotationStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "UNDER_NEGOTIATION"
  | "CONFIRMED"
  | "REJECTED"
  | "FULFILLED";

// Approval Tiers & Routing
export type ApprovalLevel = "NONE" | "SALES_MANAGER" | "FINANCE";

export type ApprovalAction =
  | "SUBMIT"
  | "APPROVE_MANAGER"
  | "APPROVE_FINANCE"
  | "REJECT"
  | "RETURN_FOR_REVISION"
  | "CUSTOMER_COUNTER";

// Warehouse Fulfillment
export type FulfillmentStatus = "ALLOCATED" | "PARTIALLY_ALLOCATED" | "BACKORDER" | "SHIPPED";

// Billing & Subscriptions
export type BillingInterval = "MONTHLY" | "QUARTERLY" | "YEARLY";
export type InvoiceType = "ONE_TIME" | "RECURRING" | "PRORATED_SUPPLEMENTAL" | "CREDIT_NOTE";
export type InvoiceStatus = "DRAFT" | "ISSUED" | "PAID" | "CANCELLED";
export type SubscriptionStatus = "ACTIVE" | "PAUSED" | "CANCELLED";

// Deal Health
export type AnomalyType = "STALLED_DEAL" | "DISCOUNT_ANOMALY" | "DELIVERY_SLIPPAGE";
export type AnomalySeverity = "LOW" | "MEDIUM" | "HIGH";
```

---

## 3. Mathematical Calculations & Business Algorithms

### A. Blended Discount Risk Score
For a quotation with $N$ lines:
For each line $i$:
1. Base Price = $P_i$, Quantity = $Q_i$, Discount % = $D_i$
2. Line Effective Subtotal $S_i = P_i \times Q_i \times (1 - D_i / 100)$
3. Allowed Ceiling $C_i = \min(\text{CustomerTierCeiling}, \text{CategoryCeiling}_i)$
4. Line Excess Violation $\Delta_i = \max(0, D_i - C_i)$
5. Order Total Subtotal $S_{\text{total}} = \sum_{i=1}^N S_i$
6. Line Weight $W_i = S_{\text{total}} > 0 ? (S_i / S_{\text{total}}) : (1 / N)$

**Blended Risk Score Formula**:
$$\text{Risk Score} = \text{round}\left( \sum_{i=1}^N (W_i \times \Delta_i \times 2) + \max_{1 \le i \le N}(\Delta_i) \right)$$

**Routing Thresholds**:
- `Risk Score == 0`: **`NONE`** (Auto-Approved $\rightarrow$ straight to Customer Portal / Fulfillment)
- `1 <= Risk Score <= 10`: **`SALES_MANAGER`** (Requires 1-tier Manager Approval)
- `Risk Score > 10`: **`FINANCE`** (Requires sequential 2-tier approval: Sales Manager, then Finance)

---

### B. Multi-Warehouse Auto-Split Heuristic
1. Check each Warehouse $W_k$. If $W_k$ has `available_stock >= Q_i` for **all** hardware lines $i$:
   - Select $W_k$ with the lowest `shipping_cost_weight` $\rightarrow$ **1 shipment, 0 splits**.
2. If no single warehouse has all items:
   - Rank warehouses by available stock quantity descending, breaking ties with lowest shipping cost.
   - Allocate line quantity up to warehouse available stock until line demand is met.
   - If total stock across all warehouses $< Q_i$, allocate available stock and assign remainder as `BACKORDER`.
3. Allow manual override: Rep or Finance can adjust quantities per warehouse before confirming dispatch.
4. When stock arrives at any warehouse (simulation action), if unfulfilled backorders exist, set prompt: `has_backorders_to_consolidate: true`.

---

### C. Hybrid Billing & Daily Proration
- **Order Confirmation**:
  - One-time items (Hardware + Service) $\rightarrow$ Generated as an `Invoice` (`type: "ONE_TIME"`, `status: "ISSUED"`).
  - Subscription items $\rightarrow$ Created as a `SubscriptionContract` (`status: "ACTIVE"`), generating billing schedule with next billing date.
- **Mid-Cycle Seat Addition**:
  - Days in current monthly period = $T_{\text{total}}$ (e.g. 30 days).
  - Days remaining in period = $T_{\text{remaining}}$ (e.g. 15 days).
  - Additional Seats = $\Delta Q$, Unit Subscription Price = $P_{\text{sub}}$.
  - **Prorated Charge** = $\text{round}\left( \Delta Q \times P_{\text{sub}} \times \frac{T_{\text{remaining}}}{T_{\text{total}}}, 2 \right)$.
  - Generated as an immediate `Invoice` (`type: "PRORATED_SUPPLEMENTAL"`).
- **Subscription Cancellation**:
  - **Credit Note Amount** = $\text{round}\left( Q_{\text{active}} \times P_{\text{sub}} \times \frac{T_{\text{remaining}}}{T_{\text{total}}}, 2 \right)$.
  - Generated as a `CreditNote` (`type: "CREDIT_NOTE"`).

---

## 4. REST API Endpoint Specifications

### 4.1 Master Data & Catalog

#### `GET /api/catalog/products`
Returns active catalog items with categories, costs, base prices, and stock summaries.
```json
{
  "success": true,
  "data": [
    {
      "id": "prod_laptop_01",
      "sku": "HW-LAPTOP-PRO",
      "name": "Enterprise Pro Laptop 16\"",
      "description": "32GB RAM, 1TB SSD Workstation",
      "category": "HARDWARE",
      "costPrice": 1200.00,
      "basePrice": 1800.00,
      "taxRate": 10.0,
      "isPromoted": true,
      "minMarginThreshold": 20.0,
      "totalStock": 15
    },
    {
      "id": "prod_service_01",
      "sku": "SRV-SETUP-ONBOARD",
      "name": "Enterprise Onboarding & Migration",
      "description": "Dedicated engineer 2-week setup",
      "category": "SERVICE",
      "costPrice": 1600.00,
      "basePrice": 2000.00,
      "taxRate": 10.0,
      "isPromoted": false,
      "minMarginThreshold": 15.0,
      "totalStock": 999
    },
    {
      "id": "prod_sub_01",
      "sku": "SUB-SAAS-PLATFORM",
      "name": "DealFlow Cloud Platform License",
      "description": "Per user monthly SaaS license",
      "category": "SUBSCRIPTION",
      "costPrice": 15.00,
      "basePrice": 60.00,
      "taxRate": 10.0,
      "isPromoted": true,
      "minMarginThreshold": 40.0,
      "totalStock": 9999
    }
  ]
}
```

#### `GET /api/catalog/customers`
Returns customer accounts with tier information.
```json
{
  "success": true,
  "data": [
    {
      "id": "cust_acme_01",
      "name": "Acme Technologies",
      "contactName": "Alice Johnson",
      "email": "alice@acmetech.io",
      "tier": "GOLD",
      "allowedDiscountCeiling": 15.0,
      "historicalAvgDiscount": 8.5
    },
    {
      "id": "cust_beta_02",
      "name": "Beta Industries",
      "contactName": "Bob Smith",
      "email": "bob@betaind.com",
      "tier": "SILVER",
      "allowedDiscountCeiling": 10.0,
      "historicalAvgDiscount": 6.0
    },
    {
      "id": "cust_startup_03",
      "name": "StartupX Labs",
      "contactName": "Charlie Davis",
      "email": "charlie@startupx.co",
      "tier": "BRONZE",
      "allowedDiscountCeiling": 5.0,
      "historicalAvgDiscount": 4.0
    }
  ]
}
```

#### `GET /api/catalog/warehouses`
Returns warehouses with active inventory.
```json
{
  "success": true,
  "data": [
    {
      "id": "wh_main_01",
      "code": "WH-CHI",
      "name": "Main Warehouse (Chicago)",
      "shippingCostWeight": 1.0,
      "stocks": [
        { "productId": "prod_laptop_01", "quantityOnHand": 10, "reserved": 0 }
      ]
    },
    {
      "id": "wh_east_02",
      "code": "WH-NYC",
      "name": "East Depot (New York)",
      "shippingCostWeight": 1.5,
      "stocks": [
        { "productId": "prod_laptop_01", "quantityOnHand": 5, "reserved": 0 }
      ]
    }
  ]
}
```

---

### 4.2 Quotation Management & Live Calculation

#### `POST /api/quotes/calculate-preview`
Allows the UI to instantly recalculate totals, margin %, line excess, and blended risk score as the rep changes quantities or discounts on the fly.
**Request Body**:
```json
{
  "customerId": "cust_acme_01",
  "lines": [
    {
      "productId": "prod_laptop_01",
      "quantity": 5,
      "unitPrice": 1800.00,
      "discountPercent": 12.0
    },
    {
      "productId": "prod_service_01",
      "quantity": 1,
      "unitPrice": 2000.00,
      "discountPercent": 18.0
    }
  ]
}
```
**Response Body**:
```json
{
  "success": true,
  "data": {
    "totalSubtotal": 9920.00,
    "totalCost": 7600.00,
    "totalMarginAmount": 2320.00,
    "totalMarginPercent": 23.39,
    "blendedRiskScore": 11,
    "requiredApprovalLevel": "FINANCE",
    "lineBreakdowns": [
      {
        "productId": "prod_laptop_01",
        "category": "HARDWARE",
        "categoryCeiling": 15.0,
        "customerTierCeiling": 15.0,
        "effectiveCeiling": 15.0,
        "discountPercent": 12.0,
        "isBreached": false,
        "excessPercent": 0,
        "lineSubtotal": 7920.00,
        "lineMarginPercent": 24.24
      },
      {
        "productId": "prod_service_01",
        "category": "SERVICE",
        "categoryCeiling": 10.0,
        "customerTierCeiling": 15.0,
        "effectiveCeiling": 10.0,
        "discountPercent": 18.0,
        "isBreached": true,
        "excessPercent": 8.0,
        "lineSubtotal": 1640.00,
        "lineMarginPercent": 2.44
      }
    ]
  }
}
```

#### `POST /api/quotes`
Creates a quotation and computes its initial risk & approval requirements.
**Request Body**:
```json
{
  "customerId": "cust_acme_01",
  "notes": "Q1 Refresh Bundle",
  "lines": [
    {
      "productId": "prod_laptop_01",
      "quantity": 8,
      "unitPrice": 1800.00,
      "discountPercent": 12.0
    },
    {
      "productId": "prod_service_01",
      "quantity": 1,
      "unitPrice": 2000.00,
      "discountPercent": 18.0
    },
    {
      "productId": "prod_sub_01",
      "quantity": 10,
      "unitPrice": 60.00,
      "discountPercent": 5.0,
      "subscriptionPlanId": "plan_monthly_01"
    }
  ]
}
```
**Response Body**: Returns full Quote object with generated `quoteNumber` (e.g. `QT-2026-0042`), `portalAccessToken`, `blendedRiskScore`, and `status: "DRAFT"`.

#### `GET /api/quotes`
List quotes for Pipeline Kanban / Table with filters:
`?status=PENDING_APPROVAL&repId=usr_01&search=Acme`

#### `GET /api/quotes/:id`
Returns the full quotation record including lines, customer info, fulfillment allocations, invoices, and approval audit log history.

---

### 4.3 Approval Workflow

#### `POST /api/quotes/:id/submit-approval`
Moves quote from `DRAFT` or `UNDER_NEGOTIATION` to `PENDING_APPROVAL` (or straight to `APPROVED` if Risk Score is 0).

#### `POST /api/quotes/:id/review`
Sales Manager or Finance user approves, rejects, or returns the quote.
**Request Body**:
```json
{
  "action": "APPROVE_MANAGER | APPROVE_FINANCE | REJECT | RETURN_FOR_REVISION",
  "reason": "Approved due to Q1 strategic account expansion."
}
```
**Response Body**:
Updates quote status (`APPROVED`, `PENDING_APPROVAL` (if Finance still needed), or `REJECTED`) and writes to `ApprovalAuditLog`.

---

### 4.4 Live Upsell & Cross-Sell Suggestions

#### `GET /api/quotes/:id/upsell-suggestions`
Calculates real-time suggestions based on products currently in the quote.
```json
{
  "success": true,
  "data": [
    {
      "productId": "prod_dock_02",
      "name": "Thunderbolt 4 Quad-Display Dock",
      "category": "HARDWARE",
      "basePrice": 250.00,
      "costPrice": 120.00,
      "marginPercent": 52.0,
      "isPromoted": true,
      "promotionTag": "Hardware Pairing Bundle",
      "marginDeltaPercent": 3.42,
      "reason": "Frequently bought with Enterprise Laptop"
    }
  ]
}
```

---

### 4.5 Fulfillment & Multi-Warehouse Auto-Split

#### `GET /api/quotes/:id/fulfillment-split`
Returns the recommended warehouse allocation and shipment breakdown.
```json
{
  "success": true,
  "data": {
    "totalRequiredShipments": 2,
    "totalEstimatedShippingCost": 42.50,
    "hasBackorders": false,
    "allocations": [
      {
        "warehouseId": "wh_main_01",
        "warehouseName": "Main Warehouse (Chicago)",
        "productId": "prod_laptop_01",
        "productName": "Enterprise Pro Laptop 16\"",
        "quantityAllocated": 10,
        "quantityBackordered": 0,
        "status": "ALLOCATED"
      },
      {
        "warehouseId": "wh_east_02",
        "warehouseName": "East Depot (New York)",
        "productId": "prod_laptop_01",
        "productName": "Enterprise Pro Laptop 16\"",
        "quantityAllocated": 2,
        "quantityBackordered": 0,
        "status": "ALLOCATED"
      }
    ]
  }
}
```

#### `POST /api/quotes/:id/fulfillment-split/confirm`
Locks the warehouse split and creates physical shipment records.

#### `POST /api/warehouses/:id/replenish`
Simulates receiving stock into warehouse, returning whether backorders can now be consolidated.

---

### 4.6 Hybrid Billing & Subscriptions

#### `GET /api/quotes/:id/billing`
Returns itemized one-time invoices, subscription contracts, and upcoming billing schedules.
```json
{
  "success": true,
  "data": {
    "invoices": [
      {
        "id": "inv_001",
        "invoiceNumber": "INV-2026-0081",
        "type": "ONE_TIME",
        "status": "ISSUED",
        "amount": 9920.00,
        "dueDate": "2026-09-20T00:00:00.000Z",
        "lines": [
          { "description": "Enterprise Pro Laptop 16\" x 8", "amount": 7920.00 },
          { "description": "Enterprise Onboarding & Migration x 1", "amount": 2000.00 }
        ]
      }
    ],
    "subscriptions": [
      {
        "id": "sub_contract_01",
        "planName": "DealFlow Cloud Platform (Monthly)",
        "status": "ACTIVE",
        "seats": 10,
        "unitPrice": 57.00,
        "recurringMonthlyAmount": 570.00,
        "currentPeriodStart": "2026-09-05T00:00:00.000Z",
        "currentPeriodEnd": "2026-10-05T00:00:00.000Z",
        "schedules": [
          { "billingDate": "2026-10-05T00:00:00.000Z", "amount": 570.00, "status": "PENDING" },
          { "billingDate": "2026-11-05T00:00:00.000Z", "amount": 570.00, "status": "PENDING" }
        ]
      }
    ]
  }
}
```

#### `POST /api/invoices/:id/payment`
Records manual or card payment for an invoice.
**Request Body**:
```json
{
  "amount": 9920.00,
  "paymentMethod": "CREDIT_CARD",
  "reference": "TXN-998273"
}
```
**Response**: Sets invoice `status: "PAID"`, returns payment confirmation.

#### `POST /api/subscriptions/:id/modify-seats`
Simulates mid-cycle seat alteration and returns prorated invoice.
**Request Body**: `{ "newSeatCount": 15 }`
**Response**: Generates `PRORATED_SUPPLEMENTAL` invoice for remaining cycle days.

---

### 4.7 Customer Portal Negotiation (External Secure View)

#### `GET /api/portal/quote/:token`
Client-safe representation. **Strictly omits** cost price, margin %, and internal risk score formulas.
```json
{
  "success": true,
  "data": {
    "quoteNumber": "QT-2026-0042",
    "customerName": "Acme Technologies",
    "status": "SENT",
    "totalAmount": 10490.00,
    "lines": [
      {
        "id": "line_01",
        "productName": "Enterprise Pro Laptop 16\"",
        "quantity": 8,
        "unitPrice": 1800.00,
        "discountPercent": 12.0,
        "lineTotal": 7920.00
      },
      {
        "id": "line_02",
        "productName": "Enterprise Onboarding & Migration",
        "quantity": 1,
        "unitPrice": 2000.00,
        "discountPercent": 18.0,
        "lineTotal": 1640.00
      }
    ],
    "negotiationComments": [
      { "id": "c1", "author": "Alice (Customer)", "lineId": "line_02", "comment": "Can we get 20% on onboarding?", "createdAt": "..." }
    ]
  }
}
```

#### `POST /api/portal/quote/:token/counter`
Customer submits counter discount and message.
**Request Body**:
```json
{
  "proposedDiscounts": [
    { "lineId": "line_02", "counterDiscountPercent": 22.0 }
  ],
  "customerComment": "We can sign immediately today if onboarding is discounted to 22%."
}
```
**Business Rule Triggered**:
- System sets quote status to `UNDER_NEGOTIATION`.
- Re-runs Blended Risk Score. Since 22% exceeds ceiling, sets flag `requiresReapproval: true`.
- Automatically re-enqueues quote into Manager/Finance approval pipeline.

#### `POST /api/portal/quote/:token/confirm`
Customer 1-click confirmation when satisfied with terms.

---

### 4.8 Deal Health & Anomaly Dashboard

#### `GET /api/dashboard/deal-health`
Returns aggregated metrics and live anomalies.
```json
{
  "success": true,
  "data": {
    "kpis": {
      "activePipelineValue": 142000.00,
      "pendingApprovalCount": 4,
      "stalledDealsCount": 2,
      "marginAtRisk": 18400.00
    },
    "alerts": [
      {
        "id": "alt_01",
        "quoteId": "quote_42",
        "quoteNumber": "QT-2026-0042",
        "customerName": "Acme Technologies",
        "repName": "Alice Rep",
        "type": "DISCOUNT_ANOMALY",
        "severity": "HIGH",
        "message": "Quotation discount (18%) is +11.5% above Alice's historical average (6.5%)",
        "createdAt": "2026-09-04T12:00:00.000Z"
      },
      {
        "id": "alt_02",
        "quoteId": "quote_19",
        "quoteNumber": "QT-2026-0019",
        "customerName": "Beta Industries",
        "repName": "Bob Rep",
        "type": "STALLED_DEAL",
        "severity": "MEDIUM",
        "message": "Quotation has been in DRAFT with no customer interaction for 6 days",
        "createdAt": "2026-08-30T10:00:00.000Z"
      }
    ]
  }
}
```

#### `POST /api/dashboard/alerts/:id/nudge`
Sends an automated reminder/nudge to the assigned sales rep.

#### `POST /api/dashboard/alerts/:id/escalate`
Escalates the deal directly to VP Sales.

---

## 5. Standard Seed Data Matrix (Odoo Demo Setup)

When `bun run db:seed` is executed, the following baseline data is guaranteed to exist:

1. **Users**:
   - `rep@dealflow360.com` (Role: `rep`, Password: `Password123!`)
   - `manager@dealflow360.com` (Role: `manager`, Password: `Password123!`)
   - `finance@dealflow360.com` (Role: `finance`, Password: `Password123!`)
   - `admin@dealflow360.com` (Role: `admin`, Password: `Password123!`)
2. **Customers**:
   - `Acme Corp` (`GOLD` - 15% discount limit, Email: `alice@acme.com`)
   - `Beta Industries` (`SILVER` - 10% discount limit, Email: `bob@beta.com`)
   - `StartupX` (`BRONZE` - 5% discount limit, Email: `ceo@startupx.com`)
3. **Warehouses**:
   - `Main Warehouse (Chicago)`: 10 units `Enterprise Pro Laptop 16"` (Weight 1.0)
   - `East Depot (New York)`: 5 units `Enterprise Pro Laptop 16"` (Weight 1.5)
4. **Subscription Plans**:
   - `DealFlow Platform Monthly`: $60/user/mo, daily proration.
   - `DealFlow Platform Annual`: $600/user/yr, 30-day refund policy.

