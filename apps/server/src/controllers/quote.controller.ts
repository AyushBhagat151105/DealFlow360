import type { Context } from "hono";
import { sendSuccess } from "../utils/api-response";
import { calculateQuotePricing } from "../services/pricing.service";
import {
  createQuote,
  listQuotes,
  getQuoteById,
  submitQuoteForApproval,
  reviewQuote,
} from "../services/quote.service";
import {
  calculatePreviewSchema,
  createQuoteSchema,
  listQuotesQuerySchema,
  reviewQuoteSchema,
  submitApprovalSchema,
  quoteIdParamSchema,
} from "../validators/quote.validator";

export async function calculatePreviewController(c: Context) {
  const body = await c.req.json();
  const validated = calculatePreviewSchema.parse(body);
  const result = await calculateQuotePricing(validated.customerId, validated.lines);
  return sendSuccess(c, result);
}

export async function createQuoteController(c: Context) {
  const body = await c.req.json();
  const validated = createQuoteSchema.parse(body);
  const repUserId = c.get("userId") as string | undefined;
  const quote = await createQuote(validated, repUserId);
  return sendSuccess(c, quote, 201, "Quotation created successfully.");
}

export async function listQuotesController(c: Context) {
  const query = c.req.query();
  const validated = listQuotesQuerySchema.parse(query);
  const quotes = await listQuotes(validated);
  return sendSuccess(c, quotes);
}

export async function getQuoteByIdController(c: Context) {
  const { id } = quoteIdParamSchema.parse({ id: c.req.param("id") });
  const quote = await getQuoteById(id);
  return sendSuccess(c, quote);
}

export async function submitApprovalController(c: Context) {
  const { id } = quoteIdParamSchema.parse({ id: c.req.param("id") });
  const body = await c.req.json().catch(() => ({}));
  const { actorName, actorRole } = submitApprovalSchema.parse(body);
  const updated = await submitQuoteForApproval(id, actorName, actorRole);
  return sendSuccess(c, updated, 200, "Quotation submitted for approval.");
}

export async function reviewQuoteController(c: Context) {
  const { id } = quoteIdParamSchema.parse({ id: c.req.param("id") });
  const body = await c.req.json();
  const validated = reviewQuoteSchema.parse(body);
  const updated = await reviewQuote(
    id,
    validated.action,
    validated.actorName,
    validated.actorRole,
    validated.reason,
  );
  return sendSuccess(c, updated, 200, `Quotation ${validated.action.toLowerCase()} completed.`);
}
