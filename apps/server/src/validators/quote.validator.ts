import { z } from "zod";

export const quoteLineInputSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  variantId: z.string().optional().nullable(),
  subscriptionPlanId: z.string().optional().nullable(),
  quantity: z.number().int().positive("Quantity must be at least 1"),
  unitPrice: z.number().nonnegative("Unit price must be non-negative"),
  discountPercent: z
    .number()
    .min(0, "Discount cannot be negative")
    .max(100, "Discount cannot exceed 100%"),
});

export const calculatePreviewSchema = z.object({
  customerId: z.string().min(1, "Customer ID is required"),
  lines: z
    .array(quoteLineInputSchema)
    .min(1, "At least one line item is required"),
});

export const createQuoteSchema = z.object({
  customerId: z.string().min(1, "Customer ID is required"),
  notes: z.string().optional(),
  deliveryPromiseDate: z.string().datetime().optional().nullable(),
  lines: z
    .array(quoteLineInputSchema)
    .min(1, "At least one line item is required"),
});

export const reviewQuoteSchema = z.object({
  action: z.enum([
    "APPROVE_MANAGER",
    "APPROVE_FINANCE",
    "REJECT",
    "RETURN_FOR_REVISION",
  ]),
  reason: z.string().optional(),
  actorName: z.string().optional().default("Reviewer"),
  actorRole: z.string().optional().default("manager"),
});

export const listQuotesQuerySchema = z.object({
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
  customerId: z.string().optional(),
  repUserId: z.string().optional(),
  search: z.string().optional(),
});

