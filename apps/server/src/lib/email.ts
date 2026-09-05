import { Resend } from "resend";
import { env } from "@DealFlow360/env/server";
import {
  QuoteMagicLinkEmail,
  CounterOfferAlertEmail,
  OrderConfirmationEmail,
} from "../emails";

const resend = new Resend(env.RESEND_API_KEY);

export type SendEmailOptions = {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  react?: React.ReactElement;
  from?: string;
  replyTo?: string;
  idempotencyKey?: string;
};

export async function sendEmail(options: SendEmailOptions) {
  const { to, subject, html, text, react, from, replyTo } = options;
  const fromAddress = from || env.RESEND_FROM_EMAIL;
  const { to, subject, html, text, react, from, replyTo, idempotencyKey } = options;
  const fromAddress = from || env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

  const { data, error } = await resend.emails.send({
    from: fromAddress,
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
    text,
    react,
    replyTo,
  });
  const { data, error } = await resend.emails.send(
    {
      from: fromAddress,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
      react,
      replyTo,
    },
    idempotencyKey ? { idempotencyKey } : undefined
  );

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
    return { success: false, error: error.message, data: null };
  }

  return { success: true, data };
  return { success: true, data, error: null };
}

export function getResendClient() {
  return resend;
}

export type SendQuoteMagicLinkParams = {
  quoteId: string;
  recipientEmail: string;
  customerName: string;
  quoteNumber: string;
  totalAmount: number;
  token: string;
  customMessage?: string;
  lineItemCount?: number;
};

export async function sendQuoteMagicLink(params: SendQuoteMagicLinkParams) {
  const portalBaseUrl = env.CORS_ORIGIN.replace(/\/$/, "");
  const portalUrl = `${portalBaseUrl}/portal/quote/${params.token}`;

  return sendEmail({
    to: params.recipientEmail,
    subject: `Quotation ${params.quoteNumber} Ready for Review — DealFlow360`,
    react: QuoteMagicLinkEmail({
      customerName: params.customerName,
      quoteNumber: params.quoteNumber,
      totalAmount: params.totalAmount,
      portalUrl,
      customMessage: params.customMessage,
      lineItemCount: params.lineItemCount,
    }),
    idempotencyKey: `quote-magic-link/${params.quoteId}/${Date.now()}`,
  });
}

export type SendCounterOfferAlertParams = {
  repEmail: string;
  repName?: string;
  customerName: string;
  quoteNumber: string;
  blendedRiskScore: number;
  customerComment?: string;
  proposedDiscountSummary: string;
};

export async function sendCounterOfferAlert(params: SendCounterOfferAlertParams) {
  const portalBaseUrl = env.CORS_ORIGIN.replace(/\/$/, "");
  const reviewUrl = `${portalBaseUrl}/workspace/approvals`;

  return sendEmail({
    to: params.repEmail,
    subject: `[Counter-Offer] ${params.customerName} countered on Quote ${params.quoteNumber}`,
    react: CounterOfferAlertEmail({
      repName: params.repName,
      customerName: params.customerName,
      quoteNumber: params.quoteNumber,
      blendedRiskScore: params.blendedRiskScore,
      reviewUrl,
      customerComment: params.customerComment,
      proposedDiscountSummary: params.proposedDiscountSummary,
    }),
    idempotencyKey: `counter-alert/${params.quoteNumber}/${Date.now()}`,
  });
}

export type SendOrderConfirmationReceiptParams = {
  customerEmail: string;
  customerName: string;
  quoteNumber: string;
  totalAmount: number;
  token: string;
  invoiceCount?: number;
  subscriptionCount?: number;
};

export async function sendOrderConfirmationReceipt(params: SendOrderConfirmationReceiptParams) {
  const portalBaseUrl = env.CORS_ORIGIN.replace(/\/$/, "");
  const portalUrl = `${portalBaseUrl}/portal/quote/${params.token}`;

  return sendEmail({
    to: params.customerEmail,
    subject: `Order Confirmed: ${params.quoteNumber} — DealFlow360`,
    react: OrderConfirmationEmail({
      customerName: params.customerName,
      quoteNumber: params.quoteNumber,
      totalAmount: params.totalAmount,
      portalUrl,
      invoiceCount: params.invoiceCount,
      subscriptionCount: params.subscriptionCount,
    }),
    idempotencyKey: `order-confirmation/${params.quoteNumber}/${Date.now()}`,
  });
}

export { resend };
