# DealFlow360 — Developer 2 Execution Plan (Frontend, UX & Customer Portal)
> **Assignee: Developer 2 (Frontend & UX Lead)**  
> **Role:** TanStack Router Routes, shadcn/ui Components, Quotation Builder UX, Live Margin & Risk Badges, Customer Portal, and Dashboards.  
> **Reference Contract:** Read [API_CONTRACTS.md](./API_CONTRACTS.md) for all API payloads, field names, and calculations.  
> **Architecture Rules:** Strictly obey [AGENTS.md](./AGENTS.md) (no raw `axios` in components, use TanStack Query hooks, PascalCase exports, zero AI slop, strict typing).  
> **Interactive API Reference:** Test and inspect all endpoints live at [http://localhost:3001/scalar](http://localhost:3001/scalar) or query [http://localhost:3001/llms.txt](http://localhost:3001/llms.txt).

---

## 1. Objectives & Deliverables for Dev 2

1. **Top Navigation & App Shell (`apps/web/src/components/header.tsx` & layout)**:
   - Navigation links: Quotations, Pipeline (Kanban), Deal Health, Admin Config.
   - **Hackathon Quick-Switch Toolbar**: A dedicated demo bar allowing the judge or evaluator to switch between internal roles (Sales Rep, Sales Manager, Finance, Admin) or launch the **Customer Portal View** with 1 click.
2. **Quotation Builder Screen (`apps/web/src/routes/workspace.builder.$id.tsx` or `/builder`)**:
   - Product Catalog selector (filterable tabs: Hardware, Services, Subscriptions).
   - Reactive Shopping Cart with quantity adjustments (+/-), line discounts (%), and price calculations.
   - **Live Margin Indicator Bar**: Dynamic visual meter (Green $\ge 30\%$, Amber $15-29\%$, Red $< 15\%$) updating in real-time.
   - **Blended Risk Score & Approval Tier Pill**: Dynamic badge showing real-time risk score and whether `Sales Manager` or `Finance` approval will be required before submission!
   - **Live Upsell / Cross-Sell Panel**: Drawer alongside the cart displaying recommended items, promotion badges, and live Margin Delta (+X.X% margin if added).
3. **Discount Approval Screen (`apps/web/src/routes/workspace.approvals.tsx`)**:
   - Lists quotes requiring review.
   - Shows Blended Risk Score breakdown, line-item discount violations, and full audit trail timeline.
   - 1-click actions: Approve, Reject, Return for Revision.
4. **Warehouse Split & Fulfillment Screen (`apps/web/src/routes/workspace.fulfillment.$id.tsx`)**:
   - Visual breakdown of warehouse split (e.g. 10 from Chicago Main, 2 from NYC East Depot).
   - Shipment count and cost estimation indicator.
   - Backorder warning banner if stock is insufficient.
   - Manual split override controls.
   - "Consolidate Remaining Backorders" simulation trigger.
5. **Hybrid Billing & Subscription Screen (`apps/web/src/routes/workspace.billing.$id.tsx`)**:
   - Displays One-Time Invoices vs Recurring Subscription Contracts side-by-side.
   - Upcoming billing schedule table.
   - Mid-cycle proration simulator (adjust seats slider $\rightarrow$ shows immediate prorated invoice).
   - "Record Payment" modal with instant status transition to `PAID`.
6. **Customer Portal Negotiation View (`apps/web/src/routes/portal.quote.$token.tsx`)**:
   - Separate, restricted customer theme (no internal navigation, **zero** cost or margin data shown).
   - Interactive line-by-line comment drawer.
   - Counter Discount Proposal input + "Submit Request" button.
   - "Confirm Quotation" 1-click accept button.
7. **Deal Health & Anomaly Dashboard (`apps/web/src/routes/dashboard.tsx`)**:
   - Metric summary cards: Active Pipeline Value, Pending Approvals, Stalled Deals, Margin at Risk.
   - Live Anomaly Alert Feed: Stalled Deals, Discount Anomalies (>1.5x rep avg), Delivery Slippage.
   - Interactive 1-click action buttons: "Nudge Rep" and "Escalate to VP".
   - Filterable table + "Export to CSV / PDF" button.

---

## 2. 16-Hour Step-by-Step Execution Checklist

### Block 1: Hours 0 – 3 (Shell, Layout, Navigation & UI Primitives)
- [ ] Review [API_CONTRACTS.md](./API_CONTRACTS.md) for data shapes.
- [ ] Set up required shadcn/ui components:
  - Check existing UI primitives in `apps/web/src/components/ui/`.
  - Ensure Button, Card, Badge, Table, Dialog, Sheet, Tabs, Input, Label, Tooltip, Sonner, and Separator are ready.
- [ ] Build global Top Navigation Header (`apps/web/src/components/header.tsx`):
  - Brand Logo ("DealFlow360").
  - Navigation tabs: Quotations, Pipeline, Deal Health, Admin.
  - **Demo Quick-Switch bar**: Select Role (Rep, Manager, Finance, Admin) + "Open Active Customer Portal" button.
- [ ] Set up HTTP client & TanStack Query wrapper in `apps/web/src/lib/http-client.ts` and `apps/web/src/hooks/use-catalog.ts`.
- [ ] Create mock data fallback in `apps/web/src/lib/mock-data.ts` matching [API_CONTRACTS.md](./API_CONTRACTS.md) Section 5 so UI development proceeds unblocked even before backend endpoints are deployed.

---

### Block 2: Hours 3 – 7 (Quotation Builder, Live Margin & Approval Screen)
- [ ] Create route `apps/web/src/routes/workspace/builder.tsx`:
  - Customer selector (shows customer tier badge: Gold / Silver / Bronze with discount ceilings).
  - Product Catalog tab picker (Hardware, Services, Subscriptions).
  - Cart Table: SKU, Name, Quantity (+/- buttons), Unit Price, Discount % input, Net Total, Line Margin %.
- [ ] Build **Live Margin Indicator Component**:
  - Prominent horizontal progress bar with percentage readout and color shift (Green, Amber, Red).
  - Display Blended Risk Score pill:
    - If score = 0: "Auto-Approved (Within Limits)" (Green).
    - If 1-10: "Manager Approval Required (Risk: X)" (Amber).
    - If >10: "Finance Approval Required (Risk: X)" (Red).
- [ ] Add "Submit for Approval" button with modal showing the breakdown of line ceiling violations.
- [ ] Build **Discount Approval Queue Screen** (`apps/web/src/routes/workspace/approvals.tsx`):
  - Table of pending quotes with risk scores.
  - Detail drawer with line item violation highlights, customer tier, and approval action buttons (Approve, Reject, Return).
  - Audit trail event timeline showing past approvals and customer comments.

---

### Block 3: Hours 7 – 10 (Live Upsell Drawer & Customer Portal View)
- [ ] Build **Live Upsell / Cross-Sell Panel**:
  - Slide-out drawer or right-hand column in Quotation Builder.
  - Lists recommendations returned by `use-upsell-suggestions.ts`.
  - Shows Promoted badge, Margin Delta pill (e.g. `+3.4% Margin`), and "Add to Quote" button.
  - Adding an upsell instantly updates the Cart, Live Margin Bar, and Blended Risk Score!
- [ ] Build **Customer Portal Negotiation View** (`apps/web/src/routes/portal/quote.$token.tsx`):
  - Dedicated layout: clean customer-facing design with company logo.
  - Quote summary: items, quantities, discounted prices, total.
  - **Zero leakage**: strictly ensure no cost prices, margin %, or risk scores are rendered.
  - Line-level comment drawer: click any line to add a customer comment/question.
  - Counter Discount input: customer can propose a counter discount %.
  - "Submit Negotiation Request" button $\rightarrow$ calls `/api/portal/quote/:token/counter`.
  - "Confirm Quotation" button $\rightarrow$ 1-click formal customer sign-off.
- [ ] Connect Demo Toolbar "Open Customer Portal View" button to open this page in a new tab with the active quote token.

---

### Block 4: Hours 10 – 13 (Fulfillment, Billing & Deal Health Dashboard)
- [ ] Build **Warehouse Fulfillment Split View** (`apps/web/src/routes/workspace/fulfillment.$id.tsx`):
  - Visual allocation cards: Main Warehouse (Chicago) vs East Depot (New York).
  - Displays shipment count (e.g. "2 Shipments required") and estimated shipping cost.
  - Manual override sliders/inputs for fine-tuning split quantities.
  - Backorder alert banner and "Receive Stock & Consolidate" simulation button.
- [ ] Build **Hybrid Billing & Subscriptions Screen** (`apps/web/src/routes/workspace/billing.$id.tsx`):
  - Card 1: One-Time Product Invoices (Hardware + Onboarding) with "Record Payment" button.
  - Card 2: Recurring Subscription Contract with billing intervals, active seats, and upcoming billing schedule dates.
  - Mid-cycle proration simulator: "Change Seats" button $\rightarrow$ displays immediate calculated prorated invoice amount.
- [ ] Build **Deal Health & Anomaly Dashboard** (`apps/web/src/routes/dashboard.tsx`):
  - 4 KPI metric cards: Active Pipeline Value, Pending Approvals, Stalled Deals (>3 days), Margin Leakage Risk.
  - Live Anomaly Alert Feed: Stalled deal alerts, discount anomaly alerts (>1.5x rep avg), delivery promise slippages.
  - Interactive Action buttons: "Nudge Rep" and "Escalate to VP" (shows instant confirmation toast via `sonner`).
  - Table of all quotes with search/filter bar and "Export CSV / PDF" button.
- [ ] Build **Pipeline Kanban Board** (`apps/web/src/routes/workspace/pipeline.tsx`):
  - Columns: Draft, Under Negotiation, Pending Approval, Approved, Confirmed, Fulfilled.
  - Drag or click to inspect deal cards.

---

### Block 5: Hours 13 – 15 (8-Step Quick Test Flow Verification & Polish)
- [ ] Walk through the exact 8-Step Quick Test Flow together with Dev 1:
  1. Login with demo credentials (`rep@dealflow360.com`).
  2. Create quote with Gold customer, add Hardware (12% discount) and Service (18% discount).
  3. Verify Live Margin Bar drops and Blended Risk Score indicates Finance approval required.
  4. Click "Add to Quote" on the suggested Docking Station upsell, verify margin increases.
  5. Switch role to Sales Manager / Finance in Demo Toolbar $\rightarrow$ Approve quote.
  6. Inspect Warehouse Split screen: verify 10 laptops from Chicago and 2 from NYC.
  7. Open Customer Portal in new tab via Demo Toolbar $\rightarrow$ counter discount to 22% $\rightarrow$ verify it automatically re-enters the approval queue.
  8. Confirm quote $\rightarrow$ record payment on one-time invoice $\rightarrow$ verify status = PAID.
- [ ] Add loading skeletons and toast notifications for all async mutations.
- [ ] Run `bun run check-types` in web workspace.

---

### Block 6: Hours 15 – 16 (Live Demo Rehearsal)
- [ ] Rehearse the 5-Minute Live Presentation:
  - **Minute 1**: Problem overview & login to DealFlow360 workspace.
  - **Minute 2**: Building a complex quote with blended discount governance, live margin meter, and live upsell recommendations.
  - **Minute 3**: Multi-level approval routing with audit trail + Multi-warehouse auto-split & backorder handling.
  - **Minute 4**: Customer Portal live negotiation & automatic re-approval trigger.
  - **Minute 5**: Hybrid billing & proration, Deal Health anomaly dashboard with 1-click escalation.

---

## 3. Recommended Directory Structure (`apps/web/src/`)

```
apps/web/src/
├── components/
│   ├── header.tsx                  # Top nav + Demo Quick-Switch Toolbar
│   ├── live-margin-indicator.tsx   # Reactive margin meter & risk score pill
│   ├── cart-table.tsx              # Quotation cart line items with +/- and discount %
│   ├── upsell-drawer.tsx           # Upsell recommendations & margin delta
│   ├── approval-modal.tsx          # Manager/Finance review dialog with audit trail
│   ├── warehouse-split-view.tsx    # Multi-warehouse allocation cards & override
│   ├── customer-portal-view.tsx    # Clean client-facing negotiation view
│   ├── deal-health-alerts.tsx      # Anomaly alert feed with Nudge/Escalate
│   └── ui/                         # shadcn primitives
├── hooks/
│   ├── use-catalog.ts              # TanStack Query for products, customers, warehouses
│   ├── use-quotes.ts               # Quote creation, updates, submission, preview
│   ├── use-fulfillment.ts          # Warehouse split & stock allocations
│   ├── use-billing.ts              # Invoices, subscriptions, proration & payment
│   ├── use-portal.ts               # Customer portal fetch, comments & counter
│   └── use-deal-health.ts          # Deal health metrics, alerts & actions
├── lib/
│   ├── http-client.ts              # Axios instance with VITE_API_URL
│   ├── mock-data.ts                # Mock fallback data matching contracts
│   └── utils.ts                    # cn helper, currency formatting
└── routes/
    ├── __root.tsx
    ├── login.tsx
    ├── dashboard.tsx               # Deal Health & Anomaly dashboard
    ├── workspace/
    │   ├── builder.tsx             # Quotation builder
    │   ├── pipeline.tsx            # Kanban pipeline
    │   ├── approvals.tsx           # Approval queue
    │   ├── fulfillment.$id.tsx     # Warehouse split screen
    │   └── billing.$id.tsx         # Hybrid billing screen
    ├── portal/
    │   └── quote.$token.tsx        # Customer Portal view
    └── admin.tsx                   # Admin backend configuration tabs
```

