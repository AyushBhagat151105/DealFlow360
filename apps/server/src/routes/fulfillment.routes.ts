import { Hono } from "hono";
import {
  getFulfillmentSplitController,
  confirmFulfillmentController,
  replenishStockController,
} from "../controllers/fulfillment.controller";
import { requireAuth, requireRole } from "../middlewares/auth";

export const fulfillmentRoutes = new Hono();

fulfillmentRoutes.get(
  "/quotes/:id/fulfillment-split",
  requireAuth,
  getFulfillmentSplitController,
);
fulfillmentRoutes.post(
  "/quotes/:id/fulfillment-split/confirm",
  requireAuth,
  requireRole(["manager", "finance", "admin", "operations"]),
  confirmFulfillmentController,
);
fulfillmentRoutes.post(
  "/warehouses/:warehouseId/replenish",
  requireAuth,
  requireRole(["manager", "admin", "operations"]),
  replenishStockController,
);

