import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import {
  calculatePreviewController,
  createQuoteController,
  listQuotesController,
  getQuoteByIdController,
  submitApprovalController,
  reviewQuoteController,
} from "../controllers/quote.controller";
import { sendQuotePortalLinkController } from "../controllers/portal.controller";
import { getQuoteUpsellSuggestionsController } from "../controllers/upsell.controller";
import { requireAuth, requireRole, optionalAuth } from "../middlewares/auth";
import {
  calculatePreviewSchema,
  createQuoteSchema,
  listQuotesQuerySchema,
  reviewQuoteSchema,
  submitApprovalSchema,
  quoteIdParamSchema,
} from "../validators/quote.validator";
import { sendPortalLinkSchema } from "../validators/portal.validator";

export const quoteRoutes = new OpenAPIHono();

const calculatePreviewRoute = createRoute({
  method: "post",
  path: "/calculate-preview",
  tags: ["Quotes"],
  summary: "Calculate quote pricing and blended discount risk score",
  request: {
    body: {
      content: {
        "application/json": {
          schema: calculatePreviewSchema,
        },
      },
    },
  },
  responses: {
    200: { description: "Calculated preview with margins, ceilings, and blended risk score" },
  },
});

const createQuoteRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["Quotes"],
  summary: "Create a new quotation",
  request: {
    body: {
      content: {
        "application/json": {
          schema: createQuoteSchema,
        },
      },
    },
  },
  responses: {
    201: { description: "Quotation created successfully" },
  },
});

const listQuotesRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Quotes"],
  summary: "List all quotations with optional filters",
  request: {
    query: listQuotesQuerySchema,
  },
  responses: {
    200: { description: "List of quotations" },
  },
});

const getQuoteByIdRoute = createRoute({
  method: "get",
  path: "/{id}",
  tags: ["Quotes"],
  summary: "Get quotation details with line items and audit history",
  request: {
    params: quoteIdParamSchema,
  },
  responses: {
    200: { description: "Quotation details" },
  },
});

const submitApprovalRoute = createRoute({
  method: "post",
  path: "/{id}/submit-approval",
  tags: ["Quotes"],
  summary: "Submit quotation for approval (or auto-approve if risk score is 0)",
  request: {
    params: quoteIdParamSchema,
    body: {
      content: {
        "application/json": {
          schema: submitApprovalSchema,
        },
      },
    },
  },
  responses: {
    200: { description: "Quotation approval status updated" },
  },
});

const reviewQuoteRoute = createRoute({
  method: "post",
  path: "/{id}/review",
  tags: ["Quotes"],
  summary: "Review quotation (Manager / Finance approval or rejection)",
  request: {
    params: quoteIdParamSchema,
    body: {
      content: {
        "application/json": {
          schema: reviewQuoteSchema,
        },
      },
    },
  },
  responses: {
    200: { description: "Quotation reviewed successfully" },
  },
});

const upsellSuggestionsRoute = createRoute({
  method: "get",
  path: "/{id}/upsell-suggestions",
  tags: ["Quotes"],
  summary: "Get intelligent upsell and cross-sell recommendations with margin delta %",
  request: {
    params: quoteIdParamSchema,
  },
  responses: {
    200: { description: "Upsell recommendations with live margin delta" },
  },
});

const sendQuotePortalLinkRoute = createRoute({
  method: "post",
  path: "/{id}/send-portal-link",
  tags: ["Quotes"],
  summary: "Dispatch quotation magic link directly to customer email",
  request: {
    params: quoteIdParamSchema,
    body: {
      content: {
        "application/json": {
          schema: sendPortalLinkSchema,
        },
      },
    },
  },
  responses: {
    200: { description: "Quotation magic link dispatched successfully" },
    404: { description: "Quotation not found" },
  },
});

quoteRoutes.openapi(calculatePreviewRoute, async (c) => {
  await optionalAuth(c, async () => { });
  return calculatePreviewController(c);
});

quoteRoutes.openapi(createQuoteRoute, async (c) => {
  await requireAuth(c, async () => { });
  return createQuoteController(c);
});

quoteRoutes.openapi(listQuotesRoute, async (c) => {
  await requireAuth(c, async () => { });
  return listQuotesController(c);
});

quoteRoutes.openapi(getQuoteByIdRoute, async (c) => {
  await requireAuth(c, async () => { });
  return getQuoteByIdController(c);
});

quoteRoutes.openapi(submitApprovalRoute, async (c) => {
  await requireAuth(c, async () => { });
  return submitApprovalController(c);
});

quoteRoutes.openapi(reviewQuoteRoute, async (c) => {
  await requireAuth(c, async () => { });
  await requireRole(["manager", "finance", "admin"])(c, async () => { });
  return reviewQuoteController(c);
});

quoteRoutes.openapi(upsellSuggestionsRoute, async (c) => {
  await requireAuth(c, async () => { });
  return getQuoteUpsellSuggestionsController(c);
});

quoteRoutes.openapi(sendQuotePortalLinkRoute, async (c) => {
  await requireAuth(c, async () => { });
  return sendQuotePortalLinkController(c);
});
