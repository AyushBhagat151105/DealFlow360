import type { Context } from "hono";
import { sendSuccess } from "../utils/api-response";
import {
  getDealHealthOverview,
  nudgeDealRep,
  escalateDealAlert,
  getSalesReportData,
  getSalesAnalyticsReport,
  exportSalesReportCsv,
} from "../services/deal-health.service";
import {
  alertIdParamSchema,
  escalateAlertSchema,
  salesReportQuerySchema,
  salesAnalyticsQuerySchema,
  exportSalesReportQuerySchema,
} from "../validators/deal-health.validator";

export async function getDealHealthOverviewController(c: Context) {
  const overview = await getDealHealthOverview();
  return sendSuccess(c, overview);
}

export async function nudgeDealRepController(c: Context) {
  const { alertId } = alertIdParamSchema.parse({ alertId: c.req.param("alertId") });
  const updated = await nudgeDealRep(alertId);
  return sendSuccess(c, updated, 200, "Nudge dispatched to sales representative.");
}

export async function escalateDealAlertController(c: Context) {
  const { alertId } = alertIdParamSchema.parse({ alertId: c.req.param("alertId") });
  const body = await c.req.json().catch(() => ({}));
  const { targetRole } = escalateAlertSchema.parse(body);
  const updated = await escalateDealAlert(alertId, targetRole);
  return sendSuccess(c, updated, 200, `Alert escalated to ${targetRole}.`);
}

export async function getSalesReportController(c: Context) {
  const query = salesReportQuerySchema.parse(c.req.query());
  const startDate = query.startDate ? new Date(query.startDate) : undefined;
  const endDate = query.endDate ? new Date(query.endDate) : undefined;

  const data = await getSalesReportData({
    startDate,
    endDate,
    repUserId: query.repUserId,
    status: query.status,
    category: query.category,
  });

  return sendSuccess(c, data);
}

export async function getSalesAnalyticsReportController(c: Context) {
  const query = salesAnalyticsQuerySchema.parse(c.req.query());
  const startDate = query.startDate ? new Date(query.startDate) : undefined;
  const endDate = query.endDate ? new Date(query.endDate) : undefined;

  const report = await getSalesAnalyticsReport({
    startDate,
    endDate,
    repUserId: query.repUserId,
    status: query.status,
    category: query.category,
  });

  return sendSuccess(c, report);
}

export async function exportSalesReportController(c: Context) {
  const query = exportSalesReportQuerySchema.parse(c.req.query());
  const startDate = query.startDate ? new Date(query.startDate) : undefined;
  const endDate = query.endDate ? new Date(query.endDate) : undefined;

  if (query.format === "csv") {
    const csv = await exportSalesReportCsv({
      startDate,
      endDate,
      repUserId: query.repUserId,
      status: query.status,
      category: query.category,
    });

    return c.text(csv, 200, {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="sales-performance-report.csv"',
    });
  }

  const data = await getSalesReportData({
    startDate,
    endDate,
    repUserId: query.repUserId,
    status: query.status,
    category: query.category,
  });

  return sendSuccess(c, data);
}
