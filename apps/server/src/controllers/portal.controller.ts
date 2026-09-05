import type { Context } from "hono";
import { sendSuccess } from "../utils/api-response";
import {
  getPortalQuote,
  addPortalComment,
  submitPortalCounterOffer,
  confirmPortalQuote,
  sendQuotePortalLink,
  requestCustomerMagicLink,
  verifyPortalToken,
} from "../services/portal.service";
import {
  addPortalCommentSchema,
  submitCounterOfferSchema,
  confirmPortalQuoteSchema,
  portalTokenParamSchema,
  requestMagicLinkSchema,
  sendPortalLinkSchema,
} from "../validators/portal.validator";

export async function getPortalQuoteController(c: Context) {
  const { token } = portalTokenParamSchema.parse({ token: c.req.param("token") });
  const quote = await getPortalQuote(token);
  return sendSuccess(c, quote);
}

export async function addPortalCommentController(c: Context) {
  const { token } = portalTokenParamSchema.parse({ token: c.req.param("token") });
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
  const { token } = portalTokenParamSchema.parse({ token: c.req.param("token") });
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
  const { token } = portalTokenParamSchema.parse({ token: c.req.param("token") });
  const body = await c.req.json().catch(() => ({}));
  confirmPortalQuoteSchema.parse(body);
  const confirmed = await confirmPortalQuote(token);
  return sendSuccess(c, confirmed, 200, "Quotation accepted and confirmed.");
}

export async function sendQuotePortalLinkController(c: Context) {
  const token = c.req.param("token") || c.req.param("id");
  const { token: validatedToken } = portalTokenParamSchema.parse({ token });
  let body: Record<string, unknown> = {};
  try {
    body = await c.req.json();
  } catch {
    body = {};
  }
  const validated = sendPortalLinkSchema.parse(body);
  const result = await sendQuotePortalLink(
    validatedToken,
    validated.recipientEmail,
    validated.customMessage,
  );
  return sendSuccess(c, result, 200, "Customer portal magic link dispatched.");
}

export async function requestMagicLinkController(c: Context) {
  const body = await c.req.json();
  const validated = requestMagicLinkSchema.parse(body);
  const result = await requestCustomerMagicLink(validated.email, validated.quoteNumber);
  return sendSuccess(c, result, 200, result.message);
}

export async function verifyPortalTokenController(c: Context) {
  const { token } = portalTokenParamSchema.parse({ token: c.req.param("token") });
  const result = await verifyPortalToken(token);
  return sendSuccess(c, result, 200, "Portal token is valid.");
}
