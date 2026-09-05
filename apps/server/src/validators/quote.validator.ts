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

export const submitApprovalSchema = z.object({
  actorName: z.string().optional().default("Sales Rep"),
  actorRole: z.string().optional().default("rep"),
});

export const quoteIdParamSchema = z.object({
  id: z.string().min(1, "Quotation ID is required"),
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
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  all: z.coerce.boolean().optional(),
});

export type CalculatePreviewInput = z.infer<typeof calculatePreviewSchema>;
export type CreateQuoteInput = z.infer<typeof createQuoteSchema>;
export type ReviewQuoteInput = z.infer<typeof reviewQuoteSchema>;
export type SubmitApprovalInput = z.infer<typeof submitApprovalSchema>;
export type ListQuotesQueryInput = z.infer<typeof listQuotesQuerySchema>;
