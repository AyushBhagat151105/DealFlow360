import { z } from "zod";

export const addPortalCommentSchema = z.object({
  quotationLineId: z.string().optional().nullable(),
  authorName: z.string().min(1, "Author name is required"),
  comment: z.string().min(1, "Comment text is required"),
  proposedDiscountPercent: z.number().min(0).max(100).optional(),
});

export const proposedLineDiscountSchema = z.object({
  lineId: z.string().min(1),
  counterDiscountPercent: z.number().min(0).max(100),
});

export const submitCounterOfferSchema = z.object({
  authorName: z.string().min(1, "Author name is required"),
  proposedDiscounts: z
    .array(proposedLineDiscountSchema)
    .min(1, "At least one line discount counter is required"),
  comment: z.string().optional(),
});

