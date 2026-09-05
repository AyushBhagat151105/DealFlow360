import prisma, {
  QuotationStatus,
  ApprovalAction,
} from "@DealFlow360/db";
import { NotFoundError, ValidationError } from "../utils/errors";
import { calculateQuotePricing } from "./pricing.service";
import { generateOrderInvoicesAndSubscriptions } from "./billing.service";
import {
  sendQuoteMagicLink,
  sendCounterOfferAlert,
  sendOrderConfirmationReceipt,
} from "../lib/email";

export async function getPortalQuote(token: string) {
  const quote = await prisma.quotation.findUnique({
    where: { portalAccessToken: token },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          contactName: true,
          email: true,
          tier: true,
        },
      },
      lines: {
        select: {
          id: true,
          productId: true,
          product: {
            select: {
              id: true,
              sku: true,
              name: true,
              description: true,
              category: true,
              unit: true,
            },
          },
          variant: {
            select: {
              id: true,
              attribute: true,
              value: true,
            },
          },
          subscriptionPlan: {
            select: {
              id: true,
              name: true,
              interval: true,
            },
          },
          quantity: true,
          unitPrice: true,
          discountPercent: true,
          effectivePrice: true,
          subtotal: true,
          customerComment: true,
        },
      },
      negotiationComments: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!quote) {
    throw new NotFoundError("Quotation token", token);
  }

  return {
    id: quote.id,
    quoteNumber: quote.quoteNumber,
    customer: quote.customer,
    status: quote.status,
    totalAmount: quote.totalAmount,
    deliveryPromiseDate: quote.deliveryPromiseDate,
    notes: quote.notes,
    createdAt: quote.createdAt,
    updatedAt: quote.updatedAt,
    lines: quote.lines,
    comments: quote.negotiationComments,
  };
}

export async function addPortalComment(
  token: string,
  quotationLineId: string | null,
  authorName: string,
  comment: string,
  proposedDiscountPercent?: number,
) {
  const quote = await prisma.quotation.findUnique({
    where: { portalAccessToken: token },
  });

  if (!quote) {
    throw new NotFoundError("Quotation token", token);
  }

  return prisma.negotiationComment.create({
    data: {
      quotationId: quote.id,
      quotationLineId: quotationLineId ?? null,
      authorName,
      isCustomer: true,
      comment,
      proposedDiscountPercent: proposedDiscountPercent ?? null,
    },
  });
}

export type ProposedLineDiscount = {
  lineId: string;
  counterDiscountPercent: number;
};

export async function submitPortalCounterOffer(
  token: string,
  authorName: string,
  proposedDiscounts: ProposedLineDiscount[],
  comment?: string,
) {
  const quote = await prisma.quotation.findUnique({
    where: { portalAccessToken: token },
    include: {
      lines: true,
      customer: true,
    },
  });

  if (!quote) {
    throw new NotFoundError("Quotation token", token);
  }

  if (quote.status === QuotationStatus.CONFIRMED || quote.status === QuotationStatus.FULFILLED) {
    throw new ValidationError("Cannot negotiate an order that has already been confirmed.");
  }

  const discountMap = new Map(
    proposedDiscounts.map((d) => [d.lineId, d.counterDiscountPercent]),
  );

  const updatedCalculationInputs = quote.lines.map((line) => {
    const proposed = discountMap.get(line.id);
    const newDiscount = proposed !== undefined ? proposed : line.discountPercent;
    return {
      productId: line.productId,
      variantId: line.variantId,
      subscriptionPlanId: line.subscriptionPlanId,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      discountPercent: newDiscount,
    };
  });

  const pricing = await calculateQuotePricing(
    quote.customerId,
    updatedCalculationInputs,
  );

  const updatedQuote = await prisma.$transaction(async (tx) => {
    for (const line of quote.lines) {
      const proposed = discountMap.get(line.id);
      if (proposed !== undefined) {
        const calculated = pricing.lines.find((pl) => pl.productId === line.productId);
        if (calculated) {
          await tx.quotationLine.update({
            where: { id: line.id },
            data: {
              discountPercent: calculated.discountPercent,
              effectivePrice: calculated.effectivePrice,
              subtotal: calculated.subtotal,
              totalCost: calculated.totalCost,
              marginPercent: calculated.marginPercent,
              lineExcessPercent: calculated.lineExcessPercent,
            },
          });
        }
      }
    }

    const requiresApproval = pricing.blendedRiskScore > 0;
    const nextStatus = requiresApproval
      ? QuotationStatus.PENDING_APPROVAL
      : QuotationStatus.UNDER_NEGOTIATION;
    const nextStep = requiresApproval ? "SALES_MANAGER" : null;

    const result = await tx.quotation.update({
      where: { id: quote.id },
      data: {
        totalAmount: pricing.totalSubtotal,
        totalCost: pricing.totalCost,
        totalMarginPercent: pricing.totalMarginPercent,
        blendedRiskScore: pricing.blendedRiskScore,
        requiredApprovalLevel: pricing.requiredApprovalLevel,
        currentApprovalStep: nextStep,
        status: nextStatus,
      },
    });

    if (comment) {
      await tx.negotiationComment.create({
        data: {
          quotationId: quote.id,
          authorName,
          isCustomer: true,
          comment,
        },
      });
    }

    await tx.approvalAuditLog.create({
      data: {
        quotationId: quote.id,
        action: ApprovalAction.CUSTOMER_COUNTER,
        actorName: authorName,
        actorRole: "customer",
        blendedRiskScore: pricing.blendedRiskScore,
        reason: requiresApproval
          ? `Customer counter-offer breached discount thresholds. Re-routed to approval (Risk: ${pricing.blendedRiskScore}).`
          : "Customer counter-offer within permitted limits.",
      },
    });

    return result;
  });

  const discountSummary = proposedDiscounts
    .map((d) => `Line ${d.lineId.slice(-4)}: ${d.counterDiscountPercent}%`)
    .join(", ");

  let repEmail = "rep@dealflow360.internal";
  if (quote.repUserId) {
    const repUser = await prisma.user.findUnique({ where: { id: quote.repUserId } });
    if (repUser?.email) repEmail = repUser.email;
  } else {
    const firstRep = await prisma.member.findFirst({
      where: { role: { in: ["rep", "manager", "admin"] } },
      include: { user: true },
    });
    if (firstRep?.user?.email) repEmail = firstRep.user.email;
  }

  await sendCounterOfferAlert({
    repEmail,
    customerName: quote.customer.name,
    quoteNumber: quote.quoteNumber,
    blendedRiskScore: pricing.blendedRiskScore,
    customerComment: comment,
    proposedDiscountSummary: discountSummary,
  });

  return updatedQuote;
}

export async function confirmPortalQuote(token: string) {
  const quote = await prisma.quotation.findUnique({
    where: { portalAccessToken: token },
    include: { customer: true },
  });

  if (!quote) {
    throw new NotFoundError("Quotation token", token);
  }

  if (quote.status === QuotationStatus.PENDING_APPROVAL) {
    throw new ValidationError(
      "Quotation is currently pending manager review and cannot be confirmed yet.",
    );
  }

  const updatedQuote = await prisma.quotation.update({
    where: { id: quote.id },
    data: { status: QuotationStatus.CONFIRMED },
  });

  const billingResult = await generateOrderInvoicesAndSubscriptions(quote.id);

  await sendOrderConfirmationReceipt({
    customerEmail: quote.customer.email,
    customerName: quote.customer.contactName || quote.customer.name,
    quoteNumber: quote.quoteNumber,
    totalAmount: quote.totalAmount,
    token: quote.portalAccessToken,
    invoiceCount: billingResult.invoice ? 1 : 0,
    subscriptionCount: billingResult.contracts.length,
  });

  return updatedQuote;
}

export async function sendQuotePortalLink(
  quoteIdentifier: string,
  recipientOverride?: string,
  customMessage?: string,
) {
  const quote = await prisma.quotation.findFirst({
    where: {
      OR: [
        { id: quoteIdentifier },
        { portalAccessToken: quoteIdentifier },
        { quoteNumber: quoteIdentifier },
      ],
    },
    include: {
      customer: true,
      lines: true,
    },
  });

  if (!quote) {
    throw new NotFoundError("Quotation", quoteIdentifier);
  }

  const recipient = recipientOverride || quote.customer.email;

  const emailResult = await sendQuoteMagicLink({
    quoteId: quote.id,
    recipientEmail: recipient,
    customerName: quote.customer.contactName || quote.customer.name,
    quoteNumber: quote.quoteNumber,
    totalAmount: quote.totalAmount,
    token: quote.portalAccessToken,
    customMessage,
    lineItemCount: quote.lines.length,
  });

  await prisma.approvalAuditLog.create({
    data: {
      quotationId: quote.id,
      action: ApprovalAction.SUBMIT,
      actorName: "Sales Rep",
      actorRole: "rep",
      reason: `Customer portal magic link dispatched to ${recipient}.${emailResult.error ? ` (Delivery notice: ${emailResult.error})` : ""}`,
    },
  });

  return {
    quoteNumber: quote.quoteNumber,
    recipient,
    token: quote.portalAccessToken,
    delivered: emailResult.success,
    deliveryError: emailResult.error,
  };
}

export async function requestCustomerMagicLink(email: string, quoteNumber?: string) {
  const customer = await prisma.customer.findUnique({
    where: { email },
    include: {
      quotes: {
        where: {
          status: {
            notIn: [QuotationStatus.REJECTED],
          },
        },
        orderBy: { updatedAt: "desc" },
        include: { lines: true },
      },
    },
  });

  if (customer && customer.quotes.length > 0) {
    const targetQuote = quoteNumber
      ? customer.quotes.find((q) => q.quoteNumber === quoteNumber) || customer.quotes[0]
      : customer.quotes[0];

    if (targetQuote) {
      await sendQuoteMagicLink({
        quoteId: targetQuote.id,
        recipientEmail: customer.email,
        customerName: customer.contactName || customer.name,
        quoteNumber: targetQuote.quoteNumber,
        totalAmount: targetQuote.totalAmount,
        token: targetQuote.portalAccessToken,
        lineItemCount: targetQuote.lines.length,
      });
    }
  }

  return {
    success: true,
    message: "If an active quotation exists for this email address, a secure magic link has been dispatched to your inbox.",
  };
}

export async function verifyPortalToken(token: string) {
  const quote = await prisma.quotation.findUnique({
    where: { portalAccessToken: token },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          contactName: true,
          email: true,
          tier: true,
        },
      },
    },
  });

  if (!quote) {
    throw new NotFoundError("Quotation token", token);
  }

  return {
    valid: true,
    quoteNumber: quote.quoteNumber,
    customerName: quote.customer.name,
    status: quote.status,
    totalAmount: quote.totalAmount,
  };
}
