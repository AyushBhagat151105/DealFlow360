import { z } from "zod";

export const alertIdParamSchema = z.object({
  alertId: z.string().min(1, "Alert ID is required"),
});

export const escalateAlertSchema = z.object({
  targetRole: z.string().min(1, "Target role is required").default("VP_SALES"),
});

export const salesReportQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  repUserId: z.string().optional(),
  status: z
    .enum([
      "DRAFT",
      "PENDING_APPROVAL",
      "APPROVED",
      "UNDER_NEGOTIATION",
      "CONFIRMED",
      "REJECTED",
      "FULFILLED",
    ])
    .optional(),
  category: z.enum(["HARDWARE", "SERVICE", "SUBSCRIPTION"]).optional(),
});

export const salesAnalyticsQuerySchema = salesReportQuerySchema;

export const exportSalesReportQuerySchema = salesReportQuerySchema.extend({
  format: z.enum(["csv", "json"]).default("csv"),
});

export type EscalateAlertInput = z.infer<typeof escalateAlertSchema>;
export type SalesReportQueryInput = z.infer<typeof salesReportQuerySchema>;
export type ExportSalesReportQueryInput = z.infer<typeof exportSalesReportQuerySchema>;
