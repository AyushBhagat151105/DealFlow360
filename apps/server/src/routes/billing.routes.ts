import { Hono } from "hono";
import {
  getQuoteBillingController,
  generateBillingController,
  recordPaymentController,
  modifySubscriptionSeatsController,
  cancelSubscriptionController,
} from "../controllers/billing.controller";
import { requireAuth, requireRole } from "../middlewares/auth";

export const billingRoutes = new Hono();

billingRoutes.get("/quotes/:id", requireAuth, getQuoteBillingController);
billingRoutes.post("/quotes/:id/generate", requireAuth, generateBillingController);
billingRoutes.post("/invoices/:invoiceId/payment", requireAuth, recordPaymentController);
billingRoutes.post(
  "/subscriptions/:contractId/modify-seats",
  requireAuth,
  modifySubscriptionSeatsController,
);
billingRoutes.post(
  "/subscriptions/:contractId/cancel",
  requireAuth,
  requireRole(["manager", "finance", "admin"]),
  cancelSubscriptionController,
);

