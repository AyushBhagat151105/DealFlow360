import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import {
  getQuoteBillingController,
  generateBillingController,
  recordPaymentController,
  modifySubscriptionSeatsController,
  cancelSubscriptionController,
  listInvoicesController,
  getInvoiceByIdController,
  getInvoicePrintHtmlController,
  exportInvoicesCsvController,
} from "../controllers/billing.controller";
import { requireAuth, requireRole } from "../middlewares/auth";
import {
  recordPaymentSchema,
  modifySeatsSchema,
  listInvoicesQuerySchema,
  exportInvoicesQuerySchema,
  invoiceIdParamSchema,
  contractIdParamSchema,
  billingIdParamSchema,
} from "../validators/billing.validator";

export const billingRoutes = new OpenAPIHono();

const getQuoteBillingRoute = createRoute({
  method: "get",
  path: "/quotes/{id}",
  tags: ["Billing"],
  summary: "Get invoices and subscription contracts for a quotation",
  request: {
    params: billingIdParamSchema,
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
    params: billingIdParamSchema,
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
    params: invoiceIdParamSchema,
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
    params: contractIdParamSchema,
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
    params: contractIdParamSchema,
  },
  responses: {
    200: { description: "Subscription cancelled and credit note generated" },
  },
});

const listInvoicesRoute = createRoute({
  method: "get",
  path: "/invoices",
  tags: ["Billing"],
  summary: "List all invoices across accounts with financial receivables summary and filters",
  request: {
    query: listInvoicesQuerySchema,
  },
  responses: {
    200: { description: "List of invoices and receivables KPIs" },
  },
});

const exportInvoicesRoute = createRoute({
  method: "get",
  path: "/invoices/export",
  tags: ["Billing"],
  summary: "Export invoices data in CSV format for accounting and auditing",
  request: {
    query: exportInvoicesQuerySchema,
  },
  responses: {
    200: { description: "Downloadable CSV file of invoices" },
  },
});

const getInvoiceByIdRoute = createRoute({
  method: "get",
  path: "/invoices/{id}",
  tags: ["Billing"],
  summary: "Get single invoice details with line items and payment ledger",
  request: {
    params: billingIdParamSchema,
  },
  responses: {
    200: { description: "Invoice details" },
    404: { description: "Invoice not found" },
  },
});

const getInvoicePrintHtmlRoute = createRoute({
  method: "get",
  path: "/invoices/{id}/html",
  tags: ["Billing"],
  summary: "Get branded, printable HTML invoice template",
  request: {
    params: billingIdParamSchema,
  },
  responses: {
    200: { description: "Printable HTML invoice page" },
    404: { description: "Invoice not found" },
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

billingRoutes.openapi(listInvoicesRoute, async (c) => {
  await requireAuth(c, async () => { });
  return listInvoicesController(c);
});

billingRoutes.openapi(exportInvoicesRoute, async (c) => {
  await requireAuth(c, async () => { });
  return exportInvoicesCsvController(c);
});

billingRoutes.openapi(getInvoiceByIdRoute, async (c) => {
  await requireAuth(c, async () => { });
  return getInvoiceByIdController(c);
});

billingRoutes.openapi(getInvoicePrintHtmlRoute, async (c) => {
  await requireAuth(c, async () => { });
  return getInvoicePrintHtmlController(c);
});
