# DealFlow360 — Developer 1 Execution Plan (Backend, Engines & DB)
> **Assignee: Developer 1 (Backend Lead)**  
> **Role:** Database Schema, Core Business Engines, Hono REST API, Authentication, and Automation Workflows.  
> **Reference Contract:** Read [API_CONTRACTS.md](./API_CONTRACTS.md) before implementing any endpoint.  
> **Architecture Rules:** Strictly obey [AGENTS.md](./AGENTS.md) (layered architecture, zero AI slop, no inline business logic in routes, strict typing).

---

## 1. Objectives & Deliverables for Dev 1

1. **Prisma Database Schema (`packages/db/prisma/schema/schema.prisma`)**: Define all models for Products, Variants, Customer Tiers, Warehouses, Stocks, Quotations, Quotation Lines, Approval Matrix, Audit Logs, Invoices, Subscriptions, and Deal Anomalies.
2. **Realistic Seed Script (`packages/db/prisma/seed.ts`)**: Generate the exact Odoo Demo baseline data (Users, Customers with tiers, Products across Hardware/Services/Subscriptions, Warehouses with initial stocks).
3. **Core Business Logic Engines (`apps/server/src/services/*`)**:
   - `pricing.service.ts`: Line-level ceiling calculation, blended discount risk score, live margin calculator.
   - `fulfillment.service.ts`: Greedy minimum-shipment warehouse splitting heuristic, backorder detector, stock replenishment consolidation.
   - `billing.service.ts`: Split invoicing, subscription contract creation, daily proration calculation for mid-cycle seat additions, credit note creation for cancellations.
   - `upsell.service.ts`: Co-purchase pairing rules, promotion ranking, minimum margin thresholds, real-time margin delta computation.
   - `deal-health.service.ts`: Real-time detector for stalled deals (>3 days), discount anomalies (>1.5x rep avg), and lead-time slippages.
4. **Hono Routes, Validators & Controllers (`apps/server/src/*`)**:
   - Follow strict flow: `routes/` $\rightarrow$ `validators/` (Zod) $\rightarrow$ `controllers/` $\rightarrow$ `services/`.
   - Wrap all responses in `utils/api-response.ts`.
5. **Customer Portal API**:
   - Token-secured quotation endpoint (strips costs and margins).
   - Line-level customer comment creation.
   - Customer counter-discount proposal handler (auto recalculates risk & re-triggers approval).
   - Customer 1-click confirmation endpoint.
6. **Interactive Scalar API Docs & LLM Endpoint**:
   - Serve live Scalar API reference at `/scalar` and `/docs` for judges and Dev 2.
   - Serve `/llms.txt` generated from OpenAPI document for AI agents.
7. **Automated Test Suite (`vitest`)**:
   - Unit tests for the 5 calculation engines.

---

## 2. 16-Hour Step-by-Step Execution Checklist

### Block 1: Hours 0 – 3 (Schema, Migration & Seed Data) [COMPLETED]
- [x] Review [API_CONTRACTS.md](./API_CONTRACTS.md) for enums and field types.
- [x] Add all models to `packages/db/prisma/schema/schema.prisma`.
- [x] Run `bun run db:push` or `bun run db:migrate` against PostgreSQL (`docker-compose up -d db`).
- [x] Create `apps/server/src/scripts/seed.ts` to populate:
  - 4 Users: Rep (`rep@dealflow360.com`), Manager (`manager@dealflow360.com`), Finance (`finance@dealflow360.com`), Admin (`admin@dealflow360.com`).
  - 3 Customers: Acme Corp (Gold - 15%), Beta Industries (Silver - 10%), StartupX (Bronze - 5%).
  - 4 Products: Enterprise Pro Laptop 16" (Hardware), Thunderbolt Dock (Hardware), Onboarding & Setup (Service), DealFlow Cloud Platform (Subscription).
  - 2 Warehouses: Main Warehouse (Chicago, 10 laptops, weight 1.0), East Depot (NYC, 5 laptops, weight 1.5).
  - 2 Subscription Plans: Monthly ($60/mo, daily proration), Annual ($600/yr).
- [x] Run `bun run db:seed` and verify database records in Prisma Studio (`bun run db:studio`).
- [x] Verified database counts: 4 users, 3 customers, 4 products, 2 warehouses, 2 plans, 2 quotes, 2 alerts.

---

### Block 2: Hours 3 – 7 (Core Engines & Quotation APIs)
- [ ] Implement `apps/server/src/utils/api-response.ts`:
  - `sendSuccess(c, data, message?)`
  - `sendError(c, code, message, statusCode, details?)`
- [ ] Implement `apps/server/src/services/pricing.service.ts`:
  - `calculateLineMargin(price, cost, discountPercent)`
  - `calculateBlendedRiskScore(lines, customerTier)` implementing the exact formula from [API_CONTRACTS.md](./API_CONTRACTS.md).
- [ ] Create `apps/server/src/validators/quote.validator.ts`:
  - `calculatePreviewSchema`
  - `createQuoteSchema`
  - `reviewQuoteSchema`
- [ ] Create `apps/server/src/controllers/quote.controller.ts` and `apps/server/src/routes/quote.routes.ts`:
  - `POST /api/quotes/calculate-preview` (Used by Quotation Builder for live reactive margin bar)
  - `POST /api/quotes` (Create new quote)
  - `GET /api/quotes` (List quotes with filter params)
  - `GET /api/quotes/:id` (Get quote details with line items and audit history)
  - `POST /api/quotes/:id/submit-approval` (Transitions to `PENDING_APPROVAL` or auto-approves if risk = 0)
  - `POST /api/quotes/:id/review` (Approves as Manager/Finance or returns for revision)
- [ ] Implement `apps/server/src/services/fulfillment.service.ts`:
  - `computeWarehouseSplit(quoteId)` using the Greedy Minimum-Shipment Heuristic.
  - `allocateWarehouseStock(quoteId, allocations)`
- [ ] Mount quote routes in `apps/server/src/index.ts`.

---

### Block 3: Hours 7 – 10 (Fulfillment, Billing & Customer Portal APIs)
- [ ] Implement `apps/server/src/services/billing.service.ts`:
  - `generateOrderInvoicesAndSubscriptions(quoteId)` (Splits one-time vs recurring lines).
  - `calculateDailyProration(contractId, newSeatCount)`.
  - `recordInvoicePayment(invoiceId, amount, method)`.
- [ ] Create billing & fulfillment routes:
  - `GET /api/quotes/:id/fulfillment-split`
  - `POST /api/quotes/:id/fulfillment-split/confirm`
  - `POST /api/warehouses/:id/replenish`
  - `GET /api/quotes/:id/billing`
  - `POST /api/invoices/:id/payment`
  - `POST /api/subscriptions/:id/modify-seats`
- [ ] Implement `apps/server/src/services/upsell.service.ts`:
  - `getUpsellSuggestions(quoteId)` computing live `marginDeltaPercent`.
  - `GET /api/quotes/:id/upsell-suggestions`.
- [ ] Implement Customer Portal Endpoints in `apps/server/src/routes/portal.routes.ts`:
  - `GET /api/portal/quote/:token` (Strips confidential cost/margin fields).
  - `POST /api/portal/quote/:token/comment` (Appends customer line comment).
  - `POST /api/portal/quote/:token/counter` (Re-calculates risk, triggers re-approval if bounds breached).
  - `POST /api/portal/quote/:token/confirm` (Final customer sign-off).

---

### Block 4: Hours 10 – 13 (Deal Health Anomaly Detector & Reporting)
- [ ] Implement `apps/server/src/services/deal-health.service.ts`:
  - Stalled deals query: quotes with status in `['DRAFT', 'UNDER_NEGOTIATION']` and `updatedAt < now - 3 days`.
  - Discount anomaly query: quote average discount $> 1.5 \times$ rep's historical discount rate.
  - Delivery slippage query: hardware items with backorders or lead time $> 7$ days.
- [ ] Implement endpoints:
  - `GET /api/dashboard/deal-health`
  - `POST /api/dashboard/alerts/:id/nudge` (Logs activity event)
  - `POST /api/dashboard/alerts/:id/escalate` (Assigns escalation flag)
  - `GET /api/dashboard/reports/export` (Returns JSON or CSV payload for reports table)
- [ ] Implement Admin Catalog endpoints:
  - `GET /api/catalog/products`, `POST /api/catalog/products`
  - `GET /api/catalog/customers`, `POST /api/catalog/customers`
  - `GET /api/catalog/warehouses`, `GET /api/catalog/plans`

---

### Block 5: Hours 13 – 15 (Testing, Golden Path Verification & Edge Cases)
- [ ] Write Vitest unit tests in `apps/server/src/tests/`:
  - `tests/services/pricing.test.ts`: Verify blended score math with multiple line scenarios (e.g. Gold customer + Hardware 12% + Service 18% = Risk Score 11 -> Finance approval required).
  - `tests/services/fulfillment.test.ts`: Verify multi-warehouse split when order qty = 12 (10 from Chicago, 2 from NYC).
  - `tests/services/billing.test.ts`: Verify proration calculation for seat changes mid-month.
- [ ] Run `bun run test` in server workspace.
- [ ] Test the 8-Step Quick Test Flow with Dev 2:
  1. Login as Rep & Admin
  2. Create quote with breach discount (18% on service)
  3. Verify automatic Manager + Finance approval routing
  4. Accept upsell suggestion, check margin update
  5. Approve quote, check warehouse stock split across 2 warehouses
  6. Check one-time vs recurring split invoicing
  7. Open customer portal via token, submit counter-offer, verify auto re-approval
  8. Customer confirms, record payment, invoice status = PAID.

---

### Block 6: Hours 15 – 16 (Demo Support & Architecture Documentation)
- [ ] Prepare PostgreSQL database reset command (`bun run db:seed`) so demo state can be restored in 5 seconds.
- [ ] Write the 1-page Architecture note showing the data model and business logic flow.
- [ ] Support Dev 2 during live demo rehearsal.

---

## 3. Recommended Directory Structure (`apps/server/src/`)

```
apps/server/src/
├── controllers/
│   ├── catalog.controller.ts
│   ├── quote.controller.ts
│   ├── fulfillment.controller.ts
│   ├── billing.controller.ts
│   ├── portal.controller.ts
│   └── dashboard.controller.ts
├── routes/
│   ├── catalog.routes.ts
│   ├── quote.routes.ts
│   ├── fulfillment.routes.ts
│   ├── billing.routes.ts
│   ├── portal.routes.ts
│   └── dashboard.routes.ts
├── services/
│   ├── pricing.service.ts
│   ├── fulfillment.service.ts
│   ├── billing.service.ts
│   ├── upsell.service.ts
│   └── deal-health.service.ts
├── validators/
│   ├── quote.validator.ts
│   ├── fulfillment.validator.ts
│   ├── billing.validator.ts
│   └── portal.validator.ts
├── utils/
│   └── api-response.ts
├── tests/
│   ├── services/
│   │   ├── pricing.test.ts
│   │   ├── fulfillment.test.ts
│   │   └── billing.test.ts
│   └── controllers/
└── index.ts
```

