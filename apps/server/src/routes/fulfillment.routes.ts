import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import {
  getFulfillmentSplitController,
  confirmFulfillmentController,
  replenishStockController,
} from "../controllers/fulfillment.controller";
import { requireAuth, requireRole } from "../middlewares/auth";
import {
  confirmFulfillmentSchema,
  replenishStockSchema,
  warehouseIdParamSchema,
  fulfillmentQuoteIdParamSchema,
} from "../validators/fulfillment.validator";

export const fulfillmentRoutes = new OpenAPIHono();

const getFulfillmentSplitRoute = createRoute({
  method: "get",
  path: "/quotes/{id}/fulfillment-split",
  tags: ["Fulfillment"],
  summary: "Compute multi-warehouse split using greedy minimum-shipment heuristic",
  request: {
    params: fulfillmentQuoteIdParamSchema,
  },
  responses: {
    200: { description: "Computed multi-warehouse fulfillment split" },
  },
});

const confirmFulfillmentRoute = createRoute({
  method: "post",
  path: "/quotes/{id}/fulfillment-split/confirm",
  tags: ["Fulfillment"],
  summary: "Confirm fulfillment allocations and reserve warehouse inventory",
  request: {
    params: fulfillmentQuoteIdParamSchema,
    body: {
      content: {
        "application/json": {
          schema: confirmFulfillmentSchema,
        },
      },
    },
  },
  responses: {
    200: { description: "Fulfillment confirmed and inventory reserved" },
  },
});

const replenishStockRoute = createRoute({
  method: "post",
  path: "/warehouses/{warehouseId}/replenish",
  tags: ["Fulfillment"],
  summary: "Replenish warehouse inventory stock levels",
  request: {
    params: warehouseIdParamSchema,
    body: {
      content: {
        "application/json": {
          schema: replenishStockSchema,
        },
      },
    },
  },
  responses: {
    200: { description: "Warehouse inventory replenished successfully" },
  },
});

fulfillmentRoutes.openapi(getFulfillmentSplitRoute, async (c) => {
  await requireAuth(c, async () => { });
  return getFulfillmentSplitController(c);
});

fulfillmentRoutes.openapi(confirmFulfillmentRoute, async (c) => {
  await requireAuth(c, async () => { });
  await requireRole(["manager", "finance", "admin", "operations"])(c, async () => { });
  return confirmFulfillmentController(c);
});

fulfillmentRoutes.openapi(replenishStockRoute, async (c) => {
  await requireAuth(c, async () => { });
  await requireRole(["manager", "admin", "operations"])(c, async () => { });
  return replenishStockController(c);
});
