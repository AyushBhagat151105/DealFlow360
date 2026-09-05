import { z } from "zod";

export const recordPaymentSchema = z.object({
  amount: z.coerce.number().positive("Payment amount must be positive"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  reference: z.string().optional(),
});

export const modifySeatsSchema = z.object({
  newSeatCount: z.coerce.number().int().positive("Seats must be at least 1"),
});

export const invoiceIdParamSchema = z.object({
  invoiceId: z.string().min(1, "Invoice ID is required"),
});

export const contractIdParamSchema = z.object({
  contractId: z.string().min(1, "Contract ID is required"),
});

export const billingIdParamSchema = z.object({
  id: z.string().min(1, "ID is required"),
});

export const listInvoicesQuerySchema = z.object({
  status: z.enum(["DRAFT", "ISSUED", "PAID", "CANCELLED"]).optional(),
  type: z.enum(["ONE_TIME", "RECURRING", "PRORATED_SUPPLEMENTAL", "CREDIT_NOTE"]).optional(),
  customerId: z.string().optional(),
  search: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export const exportInvoicesQuerySchema = z.object({
  format: z.enum(["csv", "json"]).default("csv").optional(),
  status: z.enum(["DRAFT", "ISSUED", "PAID", "CANCELLED"]).optional(),
  type: z.enum(["ONE_TIME", "RECURRING", "PRORATED_SUPPLEMENTAL", "CREDIT_NOTE"]).optional(),
  customerId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
export type ModifySeatsInput = z.infer<typeof modifySeatsSchema>;
export type ListInvoicesQueryInput = z.infer<typeof listInvoicesQuerySchema>;
export type ExportInvoicesQueryInput = z.infer<typeof exportInvoicesQuerySchema>;
