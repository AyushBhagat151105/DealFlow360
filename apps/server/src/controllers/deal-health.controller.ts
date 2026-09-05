import type { Context } from "hono";
import { sendSuccess } from "../utils/api-response";
import { ValidationError } from "../utils/errors";
import {
  getDealHealthOverview,
  nudgeDealRep,
  escalateDealAlert,
  getSalesReportData,
  getSalesAnalyticsReport,
  exportSalesReportCsv,
} from "../services/deal-health.service";

export async function getDealHealthOverviewController(c: Context) {
  const overview = await getDealHealthOverview();
  return sendSuccess(c, overview);
}

export async function nudgeDealRepController(c: Context) {
  const alertId = c.req.param("alertId");
  if (!alertId) {
    throw new ValidationError("Alert ID is required.");
  }
  const updated = await nudgeDealRep(alertId);
  return sendSuccess(c, updated, 200, "Nudge dispatched to sales representative.");
}

export async function escalateDealAlertController(c: Context) {
  const alertId = c.req.param("alertId");
  if (!alertId) {
    throw new ValidationError("Alert ID is required.");
  }
  const body = await c.req.json().catch(() => ({}));
  const targetRole = (body?.targetRole as string) ?? "VP_SALES";
  const updated = await escalateDealAlert(alertId, targetRole);
  return sendSuccess(c, updated, 200, `Alert escalated to ${targetRole}.`);
}

export async function getSalesReportController(c: Context) {
  const query = c.req.query();
  const startDate = query.startDate ? new Date(query.startDate) : undefined;
  const endDate = query.endDate ? new Date(query.endDate) : undefined;
  const repUserId = query.repUserId;
  const status = query.status as never;
  const category = query.category as never;

  const data = await getSalesReportData({
    startDate,
    endDate,
    repUserId,
    status,
    category,
  });

  return sendSuccess(c, data);
}

export async function getSalesAnalyticsReportController(c: Context) {
  const query = c.req.query();
  const startDate = query.startDate ? new Date(query.startDate) : undefined;
  const endDate = query.endDate ? new Date(query.endDate) : undefined;
  const repUserId = query.repUserId;
  const status = query.status as never;
  const category = query.category as never;

  const report = await getSalesAnalyticsReport({
    startDate,
    endDate,
    repUserId,
    status,
    category,
  });

  return sendSuccess(c, report);
}

export async function exportSalesReportController(c: Context) {
  const query = c.req.query();
  const format = query.format ?? "csv";
  const startDate = query.startDate ? new Date(query.startDate) : undefined;
  const endDate = query.endDate ? new Date(query.endDate) : undefined;
  const repUserId = query.repUserId;
  const status = query.status as never;
  const category = query.category as never;

  if (format === "csv") {
    const csv = await exportSalesReportCsv({
      startDate,
      endDate,
      repUserId,
      status,
      category,
    });

    return c.text(csv, 200, {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="sales-performance-report.csv"',
    });
  }

  const data = await getSalesReportData({
    startDate,
    endDate,
    repUserId,
    status,
    category,
  });

  return sendSuccess(c, data);
}
