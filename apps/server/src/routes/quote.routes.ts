import { Hono } from "hono";
import {
  calculatePreviewController,
  createQuoteController,
  listQuotesController,
  getQuoteByIdController,
  submitApprovalController,
  reviewQuoteController,
} from "../controllers/quote.controller";
import { getQuoteUpsellSuggestionsController } from "../controllers/upsell.controller";
import { requireAuth, requireRole, optionalAuth } from "../middlewares/auth";

export const quoteRoutes = new Hono();

quoteRoutes.post("/calculate-preview", optionalAuth, calculatePreviewController);
quoteRoutes.post("/", requireAuth, createQuoteController);
quoteRoutes.get("/", requireAuth, listQuotesController);
quoteRoutes.get("/:id", requireAuth, getQuoteByIdController);
quoteRoutes.post("/:id/submit-approval", requireAuth, submitApprovalController);
quoteRoutes.post(
  "/:id/review",
  requireAuth,
  requireRole(["manager", "finance", "admin"]),
  reviewQuoteController,
);
quoteRoutes.get("/:id/upsell-suggestions", requireAuth, getQuoteUpsellSuggestionsController);

