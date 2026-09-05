import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import {
  getQuoteBillingController,
  generateBillingController,
  recordPaymentController,
  modifySubscriptionSeatsController,
  cancelSubscriptionController,
} from "../controllers/billing.controller";
import { requireAuth, requireRole } from "../middlewares/auth";
import {
  recordPaymentSchema,
  modifySeatsSchema,
} from "../validators/billing.validator";

export const billingRoutes = new OpenAPIHono();

const getQuoteBillingRoute = createRoute({
  method: "get",
  path: "/quotes/{id}",
  tags: ["Billing"],
  summary: "Get invoices and subscription contracts for a quotation",
  request: {
    params: z.object({
      id: z.string().openapi({ param: { name: "id", in: "path" } }),
    }),
  },
  responses: {
    200: { description: "Quote billing records (invoices and contracts)" },
  },
});

const generateBillingRoute = createRoute({
  method: "post",
  path: "/quotes/{id}/generate",
  tags: ["Billing"],
  summary: "Auto-generate split invoices (one-time vs recurring) and subscription contracts",
  request: {
    params: z.object({
      id: z.string().openapi({ param: { name: "id", in: "path" } }),
    }),
  },
  responses: {
    201: { description: "Invoices and subscription contracts generated" },
  },
});

const recordPaymentRoute = createRoute({
  method: "post",
  path: "/invoices/{invoiceId}/payment",
  tags: ["Billing"],
  summary: "Record payment against an invoice (updates status to PAID)",
  request: {
    params: z.object({
      invoiceId: z.string().openapi({ param: { name: "invoiceId", in: "path" } }),
    }),
    body: {
      content: {
        "application/json": {
          schema: recordPaymentSchema,
        },
      },
    },
  },
  responses: {
    200: { description: "Payment recorded successfully" },
  },
});

const modifySubscriptionSeatsRoute = createRoute({
  method: "post",
  path: "/subscriptions/{contractId}/modify-seats",
  tags: ["Billing"],
  summary: "Modify subscription seats with daily proration for mid-cycle changes",
  request: {
    params: z.object({
      contractId: z.string().openapi({ param: { name: "contractId", in: "path" } }),
    }),
    body: {
      content: {
        "application/json": {
          schema: modifySeatsSchema,
        },
      },
    },
  },
  responses: {
    200: { description: "Subscription seats modified and prorated invoice created" },
  },
});

const cancelSubscriptionRoute = createRoute({
  method: "post",
  path: "/subscriptions/{contractId}/cancel",
  tags: ["Billing"],
  summary: "Cancel subscription contract and issue credit note for unused balance",
  request: {
    params: z.object({
      contractId: z.string().openapi({ param: { name: "contractId", in: "path" } }),
    }),
  },
  responses: {
    200: { description: "Subscription cancelled and credit note generated" },
  },
});

billingRoutes.openapi(getQuoteBillingRoute, async (c) => {
  await requireAuth(c, async () => { });
  return getQuoteBillingController(c);
});

billingRoutes.openapi(generateBillingRoute, async (c) => {
  await requireAuth(c, async () => { });
  return generateBillingController(c);
});

billingRoutes.openapi(recordPaymentRoute, async (c) => {
  await requireAuth(c, async () => { });
  return recordPaymentController(c);
});

billingRoutes.openapi(modifySubscriptionSeatsRoute, async (c) => {
  await requireAuth(c, async () => { });
  return modifySubscriptionSeatsController(c);
});

billingRoutes.openapi(cancelSubscriptionRoute, async (c) => {
  await requireAuth(c, async () => { });
  await requireRole(["manager", "finance", "admin"])(c, async () => { });
  return cancelSubscriptionController(c);
});
