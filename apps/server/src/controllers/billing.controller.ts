import type { Context } from "hono";
import { sendSuccess } from "../utils/api-response";
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
  invoiceIdParamSchema,
  contractIdParamSchema,
  billingIdParamSchema,
} from "../validators/billing.validator";

export async function getQuoteBillingController(c: Context) {
  const { id } = billingIdParamSchema.parse({ id: c.req.param("id") });
  const billing = await getQuoteBilling(id);
  return sendSuccess(c, billing);
}

export async function generateBillingController(c: Context) {
  const { id } = billingIdParamSchema.parse({ id: c.req.param("id") });
  const result = await generateOrderInvoicesAndSubscriptions(id);
  return sendSuccess(c, result, 201, "Billing and subscriptions generated.");
}

export async function recordPaymentController(c: Context) {
  const { invoiceId } = invoiceIdParamSchema.parse({ invoiceId: c.req.param("invoiceId") });
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
  const { contractId } = contractIdParamSchema.parse({ contractId: c.req.param("contractId") });
  const body = await c.req.json();
  const validated = modifySeatsSchema.parse(body);
  const result = await modifySubscriptionSeats(contractId, validated.newSeatCount);
  return sendSuccess(c, result, 200, "Subscription updated with proration.");
}

export async function cancelSubscriptionController(c: Context) {
  const { contractId } = contractIdParamSchema.parse({ contractId: c.req.param("contractId") });
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
  const { id } = billingIdParamSchema.parse({ id: c.req.param("id") });
  const invoice = await getInvoiceById(id);
  return sendSuccess(c, invoice);
}

export async function getInvoicePrintHtmlController(c: Context) {
  const { id } = billingIdParamSchema.parse({ id: c.req.param("id") });
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
