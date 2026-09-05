import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import {
  getDealHealthOverviewController,
  nudgeDealRepController,
  escalateDealAlertController,
  getSalesReportController,
} from "../controllers/deal-health.controller";
import { requireAuth, requireRole } from "../middlewares/auth";

export const dealHealthRoutes = new OpenAPIHono();

const getOverviewRoute = createRoute({
  method: "get",
  path: "/overview",
  tags: ["Deal Health"],
  summary: "Get deal health dashboard overview and active anomaly alerts",
  responses: {
    200: { description: "Deal health anomaly alerts and KPI summary" },
  },
});

const getSalesReportRoute = createRoute({
  method: "get",
  path: "/reports/sales",
  tags: ["Deal Health"],
  summary: "Export aggregated sales performance and discount margin reports",
  responses: {
    200: { description: "Sales performance metrics report" },
  },
});

const nudgeRepRoute = createRoute({
  method: "post",
  path: "/alerts/{alertId}/nudge",
  tags: ["Deal Health"],
  summary: "Send 1-click automated notification nudge to assigned sales rep",
  request: {
    params: z.object({
      alertId: z.string().openapi({ param: { name: "alertId", in: "path" } }),
    }),
  },
  responses: {
    200: { description: "Nudge sent and audit logged" },
  },
});

const escalateAlertRoute = createRoute({
  method: "post",
  path: "/alerts/{alertId}/escalate",
  tags: ["Deal Health"],
  summary: "Escalate deal anomaly to management / finance review",
  request: {
    params: z.object({
      alertId: z.string().openapi({ param: { name: "alertId", in: "path" } }),
    }),
  },
  responses: {
    200: { description: "Alert escalated to management" },
  },
});

dealHealthRoutes.openapi(getOverviewRoute, async (c) => {
  await requireAuth(c, async () => { });
  return getDealHealthOverviewController(c);
});

dealHealthRoutes.openapi(getSalesReportRoute, async (c) => {
  await requireAuth(c, async () => { });
  return getSalesReportController(c);
});

dealHealthRoutes.openapi(nudgeRepRoute, async (c) => {
  await requireAuth(c, async () => { });
  return nudgeDealRepController(c);
});

dealHealthRoutes.openapi(escalateAlertRoute, async (c) => {
  await requireAuth(c, async () => { });
  await requireRole(["manager", "finance", "admin"])(c, async () => { });
  return escalateDealAlertController(c);
});
