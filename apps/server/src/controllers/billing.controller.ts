import type { Context } from "hono";
import { sendSuccess } from "../utils/api-response";
import { ValidationError } from "../utils/errors";
import {
  generateOrderInvoicesAndSubscriptions,
  getQuoteBilling,
  recordInvoicePayment,
  modifySubscriptionSeats,
  cancelSubscription,
  listInvoices,
  getInvoiceById,
  generateInvoicePrintHtml,
  exportInvoicesCsv,
} from "../services/billing.service";
import {
  recordPaymentSchema,
  modifySeatsSchema,
  listInvoicesQuerySchema,
  exportInvoicesQuerySchema,
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

export async function listInvoicesController(c: Context) {
  const query = c.req.query();
  const validated = listInvoicesQuerySchema.parse(query);
  const result = await listInvoices(validated);
  return sendSuccess(c, result);
}

export async function getInvoiceByIdController(c: Context) {
  const id = c.req.param("id");
  if (!id) {
    throw new ValidationError("Invoice ID is required.");
  }
  const invoice = await getInvoiceById(id);
  return sendSuccess(c, invoice);
}

export async function getInvoicePrintHtmlController(c: Context) {
  const id = c.req.param("id");
  if (!id) {
    throw new ValidationError("Invoice ID is required.");
  }
  const html = await generateInvoicePrintHtml(id);
  return c.html(html);
}

export async function exportInvoicesCsvController(c: Context) {
  const query = c.req.query();
  const validated = exportInvoicesQuerySchema.parse(query);
  const csv = await exportInvoicesCsv({
    status: validated.status,
    type: validated.type,
    customerId: validated.customerId,
    startDate: validated.startDate,
    endDate: validated.endDate,
  });

  return c.text(csv, 200, {
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": 'attachment; filename="dealflow360-invoices.csv"',
  });
}
