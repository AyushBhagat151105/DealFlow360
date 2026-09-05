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

export const confirmPortalQuoteSchema = z.object({
  customerSignature: z.string().optional(),
});

export const portalTokenParamSchema = z.object({
  token: z.string().min(1, "Portal token is required"),
});

export const requestMagicLinkSchema = z.object({
  email: z.string().email("Valid email address is required"),
  quoteNumber: z.string().optional(),
});

export const sendPortalLinkSchema = z.object({
  recipientEmail: z.string().email().optional(),
  customMessage: z.string().max(500).optional(),
});

export type AddPortalCommentInput = z.infer<typeof addPortalCommentSchema>;
export type SubmitCounterOfferInput = z.infer<typeof submitCounterOfferSchema>;
export type ConfirmPortalQuoteInput = z.infer<typeof confirmPortalQuoteSchema>;
export type RequestMagicLinkInput = z.infer<typeof requestMagicLinkSchema>;
export type SendPortalLinkInput = z.infer<typeof sendPortalLinkSchema>;
