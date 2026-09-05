import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import {
  getPortalQuoteController,
  addPortalCommentController,
  submitPortalCounterController,
  confirmPortalQuoteController,
  sendQuotePortalLinkController,
  requestMagicLinkController,
  verifyPortalTokenController,
} from "../controllers/portal.controller";
import {
  addPortalCommentSchema,
  submitCounterOfferSchema,
  confirmPortalQuoteSchema,
  portalTokenParamSchema,
  requestMagicLinkSchema,
  sendPortalLinkSchema,
} from "../validators/portal.validator";

export const portalRoutes = new OpenAPIHono();

const getPortalQuoteRoute = createRoute({
  method: "get",
  path: "/quote/{token}",
  tags: ["Customer Portal"],
  summary: "Get sanitized customer portal quotation (costs and margins omitted)",
  request: {
    params: portalTokenParamSchema,
  },
  responses: {
    200: { description: "Sanitized quotation details for customer review" },
  },
});

const addPortalCommentRoute = createRoute({
  method: "post",
  path: "/quote/{token}/comment",
  tags: ["Customer Portal"],
  summary: "Add customer comment or note to quotation or line item",
  request: {
    params: portalTokenParamSchema,
    body: {
      content: {
        "application/json": {
          schema: addPortalCommentSchema,
        },
      },
    },
  },
  responses: {
    201: { description: "Comment recorded successfully" },
  },
});

const submitPortalCounterRoute = createRoute({
  method: "post",
  path: "/quote/{token}/counter",
  tags: ["Customer Portal"],
  summary: "Propose customer discount counter-offer (triggers risk re-evaluation and approval re-entry)",
  request: {
    params: portalTokenParamSchema,
    body: {
      content: {
        "application/json": {
          schema: submitCounterOfferSchema,
        },
      },
    },
  },
  responses: {
    200: { description: "Counter-offer recorded and approval routing evaluated" },
  },
});

const confirmPortalQuoteRoute = createRoute({
  method: "post",
  path: "/quote/{token}/confirm",
  tags: ["Customer Portal"],
  summary: "Customer 1-click quotation acceptance and confirmation",
  request: {
    params: portalTokenParamSchema,
    body: {
      content: {
        "application/json": {
          schema: confirmPortalQuoteSchema,
        },
      },
    },
  },
  responses: {
    200: { description: "Quotation confirmed by customer" },
  },
});

const requestMagicLinkRoute = createRoute({
  method: "post",
  path: "/magic-link",
  tags: ["Customer Portal"],
  summary: "Request a secure magic link to access customer quotations via email",
  request: {
    body: {
      content: {
        "application/json": {
          schema: requestMagicLinkSchema,
        },
      },
    },
  },
  responses: {
    200: { description: "Magic link dispatched if account exists" },
  },
});

const sendQuotePortalLinkRoute = createRoute({
  method: "post",
  path: "/quote/{token}/send",
  tags: ["Customer Portal"],
  summary: "Dispatch quotation magic link directly to customer email",
  request: {
    params: portalTokenParamSchema,
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

const verifyPortalTokenRoute = createRoute({
  method: "get",
  path: "/quote/{token}/verify",
  tags: ["Customer Portal"],
  summary: "Verify customer portal access token validity",
  request: {
    params: portalTokenParamSchema,
  },
  responses: {
    200: { description: "Portal token is valid" },
    404: { description: "Invalid or expired token" },
  },
});

portalRoutes.openapi(getPortalQuoteRoute, getPortalQuoteController);
portalRoutes.openapi(addPortalCommentRoute, addPortalCommentController);
portalRoutes.openapi(submitPortalCounterRoute, submitPortalCounterController);
portalRoutes.openapi(confirmPortalQuoteRoute, confirmPortalQuoteController);
portalRoutes.openapi(requestMagicLinkRoute, requestMagicLinkController);
portalRoutes.openapi(sendQuotePortalLinkRoute, sendQuotePortalLinkController);
portalRoutes.openapi(verifyPortalTokenRoute, verifyPortalTokenController);
