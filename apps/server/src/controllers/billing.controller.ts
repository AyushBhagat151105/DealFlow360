import type { Context } from "hono";
import { sendSuccess } from "../utils/api-response";
import { ValidationError } from "../utils/errors";
import {
  generateOrderInvoicesAndSubscriptions,
  getQuoteBilling,
  recordInvoicePayment,
  modifySubscriptionSeats,
  cancelSubscription,
} from "../services/billing.service";
import {
  recordPaymentSchema,
  modifySeatsSchema,
} from "../validators/billing.validator";

export async function getQuoteBillingController(c: Context) {
  const quoteId = c.req.param("id");
  if (!quoteId) {
    throw new ValidationError("Quotation ID is required.");
  }
  const billing = await getQuoteBilling(quoteId);
  return sendSuccess(c, billing);
}

export async function generateBillingController(c: Context) {
  const quoteId = c.req.param("id");
  if (!quoteId) {
    throw new ValidationError("Quotation ID is required.");
  }
  const result = await generateOrderInvoicesAndSubscriptions(quoteId);
  return sendSuccess(c, result, 201, "Billing and subscriptions generated.");
}

export async function recordPaymentController(c: Context) {
  const invoiceId = c.req.param("invoiceId");
  if (!invoiceId) {
    throw new ValidationError("Invoice ID is required.");
  }
  const body = await c.req.json();
  const validated = recordPaymentSchema.parse(body);
  const result = await recordInvoicePayment({
    invoiceId,
    amount: validated.amount,
    paymentMethod: validated.paymentMethod,
    reference: validated.reference,
  });
  return sendSuccess(c, result, 200, "Payment recorded successfully.");
}

export async function modifySubscriptionSeatsController(c: Context) {
  const contractId = c.req.param("contractId");
  if (!contractId) {
    throw new ValidationError("Contract ID is required.");
  }
  const body = await c.req.json();
  const validated = modifySeatsSchema.parse(body);
  const result = await modifySubscriptionSeats(contractId, validated.newSeatCount);
  return sendSuccess(c, result, 200, "Subscription updated with proration.");
}

export async function cancelSubscriptionController(c: Context) {
  const contractId = c.req.param("contractId");
  if (!contractId) {
    throw new ValidationError("Contract ID is required.");
  }
  const result = await cancelSubscription(contractId);
  return sendSuccess(c, result, 200, "Subscription cancelled.");
}
