import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import {
  getPortalQuoteController,
  addPortalCommentController,
  submitPortalCounterController,
  confirmPortalQuoteController,
} from "../controllers/portal.controller";
import {
  addPortalCommentSchema,
  submitCounterOfferSchema,
} from "../validators/portal.validator";

export const portalRoutes = new OpenAPIHono();

const getPortalQuoteRoute = createRoute({
  method: "get",
  path: "/quote/{token}",
  tags: ["Customer Portal"],
  summary: "Get sanitized customer portal quotation (costs and margins omitted)",
  request: {
    params: z.object({
      token: z.string().openapi({ param: { name: "token", in: "path" } }),
    }),
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
    params: z.object({
      token: z.string().openapi({ param: { name: "token", in: "path" } }),
    }),
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
    params: z.object({
      token: z.string().openapi({ param: { name: "token", in: "path" } }),
    }),
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
    params: z.object({
      token: z.string().openapi({ param: { name: "token", in: "path" } }),
    }),
    body: {
      content: {
        "application/json": {
          schema: z.object({
            customerSignature: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: { description: "Quotation confirmed by customer" },
  },
});

portalRoutes.openapi(getPortalQuoteRoute, getPortalQuoteController);
portalRoutes.openapi(addPortalCommentRoute, addPortalCommentController);
portalRoutes.openapi(submitPortalCounterRoute, submitPortalCounterController);
portalRoutes.openapi(confirmPortalQuoteRoute, confirmPortalQuoteController);
