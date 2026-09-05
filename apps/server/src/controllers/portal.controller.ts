import type { Context } from "hono";
import { sendSuccess } from "../utils/api-response";
import { ValidationError } from "../utils/errors";
import {
  getPortalQuote,
  addPortalComment,
  submitPortalCounterOffer,
  confirmPortalQuote,
} from "../services/portal.service";
import {
  addPortalCommentSchema,
  submitCounterOfferSchema,
} from "../validators/portal.validator";

export async function getPortalQuoteController(c: Context) {
  const token = c.req.param("token");
  if (!token) {
    throw new ValidationError("Portal token is required.");
  }
  const quote = await getPortalQuote(token);
  return sendSuccess(c, quote);
}

export async function addPortalCommentController(c: Context) {
  const token = c.req.param("token");
  if (!token) {
    throw new ValidationError("Portal token is required.");
  }
  const body = await c.req.json();
  const validated = addPortalCommentSchema.parse(body);
  const comment = await addPortalComment(
    token,
    validated.quotationLineId ?? null,
    validated.authorName,
    validated.comment,
    validated.proposedDiscountPercent,
  );
  return sendSuccess(c, comment, 201, "Comment recorded.");
}

export async function submitPortalCounterController(c: Context) {
  const token = c.req.param("token");
  if (!token) {
    throw new ValidationError("Portal token is required.");
  }
  const body = await c.req.json();
  const validated = submitCounterOfferSchema.parse(body);
  const updated = await submitPortalCounterOffer(
    token,
    validated.authorName,
    validated.proposedDiscounts,
    validated.comment,
  );
  return sendSuccess(c, updated, 200, "Counter-offer submitted.");
}

export async function confirmPortalQuoteController(c: Context) {
  const token = c.req.param("token");
  if (!token) {
    throw new ValidationError("Portal token is required.");
  }
  const confirmed = await confirmPortalQuote(token);
  return sendSuccess(c, confirmed, 200, "Quotation accepted and confirmed.");
}

