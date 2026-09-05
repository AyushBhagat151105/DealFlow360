import { Hono } from "hono";
import {
  getDealHealthOverviewController,
  nudgeDealRepController,
  escalateDealAlertController,
  getSalesReportController,
} from "../controllers/deal-health.controller";
import { requireAuth, requireRole } from "../middlewares/auth";

export const dealHealthRoutes = new Hono();

dealHealthRoutes.get("/overview", requireAuth, getDealHealthOverviewController);
dealHealthRoutes.get("/reports/sales", requireAuth, getSalesReportController);
dealHealthRoutes.post("/alerts/:alertId/nudge", requireAuth, nudgeDealRepController);
dealHealthRoutes.post(
  "/alerts/:alertId/escalate",
  requireAuth,
  requireRole(["manager", "finance", "admin"]),
  escalateDealAlertController,
);

