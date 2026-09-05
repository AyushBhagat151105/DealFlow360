import type { Context } from "hono";
import { sendSuccess } from "../utils/api-response";
import { ValidationError } from "../utils/errors";
import { getQuoteUpsellSuggestions } from "../services/upsell.service";

export async function getQuoteUpsellSuggestionsController(c: Context) {
  const quoteId = c.req.param("id");
  if (!quoteId) {
    throw new ValidationError("Quotation ID is required.");
  }
  const suggestions = await getQuoteUpsellSuggestions(quoteId);
  return sendSuccess(c, suggestions);
}
