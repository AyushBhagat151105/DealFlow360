# DealFlow360 — Intelligent Sales Operations Platform
> **Odoo 2026 Grand Finale Hackathon Project**  
> An intelligent, self-governing sales operations platform handling multi-tier discount governance, live upsell with real-time margin impact, multi-warehouse fulfillment splitting, hybrid billing (one-time + recurring subscriptions), and customer portal negotiation.

---

## 🚀 2-Developer Collaboration Guide & Context Bridge

To ensure seamless collaboration across two different machines and two separate AI agents without losing context, consult these dedicated plans:

1. **[API_CONTRACTS.md](./API_CONTRACTS.md)** — **The Core Bridge**: Single source of truth for all data models, enums, calculation formulas (Blended Risk Score, Warehouse Split algorithm, Proration), API routes, request/response JSON schemas, and seed data.
2. **[DEV1_BACKEND_PLAN.md](./DEV1_BACKEND_PLAN.md)** — **Developer 1 (Backend Lead)**: Prisma DB schema, core business logic engines, Hono API routes, validators, controllers, and seed scripts.
3. **[DEV2_FRONTEND_PLAN.md](./DEV2_FRONTEND_PLAN.md)** — **Developer 2 (Frontend Lead)**: TanStack Router routes, shadcn/ui components, Quotation Builder with live reactive margin meter, Customer Portal negotiation view, and Dashboards.
4. **[AGENTS.md](./AGENTS.md)** — **Engineering Standards**: Strict guidelines on coding style, architectural boundaries, zero AI slop, and type safety.

---

## 🛠 Quick Start

### 1. Install Dependencies
```bash
bun install
```

### 2. Start Local Database (Docker Compose)
```bash
docker-compose up -d db
```

### 3. Database Migration & Seed
```bash
# Push schema & seed default Odoo demo data
bun run db:push
bun run db:seed
```

### 4. Run Development Servers
```bash
# In terminal 1 (Backend Hono server on port 3001)
bun run dev:server

# In terminal 2 (Frontend Vite client on port 3000)
bun run dev:web
```

---

## 🏆 The 8-Step Quick Test Flow (Verification Checklist)

1. **Sign In**: Log into DealFlow360 with demo credentials (`rep@dealflow360.com`).
2. **Breach Discount**: Create a quote with Gold customer, add Hardware (12% discount) and Service (18% discount).
3. **Auto-Approval Routing**: Verify Live Margin drops and Blended Risk Score routes to Sales Manager + Finance approval.
4. **Live Upsell**: Add suggested docking station accessory; confirm instant order total and margin % bump.
5. **Approve & Warehouse Split**: Approve quote; verify automatic split between Chicago Main Warehouse (10 units) and East Depot (2 units).
6. **Hybrid Billing**: Inspect billing view showing separate one-time invoice and recurring subscription schedule.
7. **Customer Portal**: Open customer negotiation portal via token link; submit counter-offer discount; verify quote automatically re-enters approval workflow.
8. **Confirmation & Payment**: Confirm order, record payment, and verify invoice transitions to `PAID`.
