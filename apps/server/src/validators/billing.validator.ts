import { z } from "zod";

export const recordPaymentSchema = z.object({
  amount: z.number().positive("Payment amount must be positive"),
  paymentMethod: z.enum(["CREDIT_CARD", "WIRE_TRANSFER", "CASH"]),
  reference: z.string().optional(),
});

export const modifySeatsSchema = z.object({
  newSeatCount: z.number().int().positive("Seats must be at least 1"),
});

export const listInvoicesQuerySchema = z.object({
  status: z.enum(["DRAFT", "ISSUED", "PAID", "CANCELLED"]).optional(),
  type: z.enum(["ONE_TIME", "RECURRING", "PRORATED_SUPPLEMENTAL", "CREDIT_NOTE"]).optional(),
  customerId: z.string().optional(),
  search: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50).optional(),
  offset: z.coerce.number().min(0).default(0).optional(),
});

export const exportInvoicesQuerySchema = z.object({
  format: z.enum(["csv", "json"]).default("csv").optional(),
  status: z.enum(["DRAFT", "ISSUED", "PAID", "CANCELLED"]).optional(),
  type: z.enum(["ONE_TIME", "RECURRING", "PRORATED_SUPPLEMENTAL", "CREDIT_NOTE"]).optional(),
  customerId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});
