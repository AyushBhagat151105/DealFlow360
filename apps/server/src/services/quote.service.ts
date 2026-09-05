import prisma, {
  QuotationStatus,
  ApprovalLevel,
  ApprovalAction,
  type Prisma,
} from "@DealFlow360/db";
import { NotFoundError, ValidationError } from "../utils/errors";
import { getPaginationParams, buildPaginationMeta } from "../utils/pagination";
import {
  calculateQuotePricing,
  type LineCalculationInput,
} from "./pricing.service";

export type CreateQuoteInput = {
  customerId: string;
  notes?: string;
  deliveryPromiseDate?: Date | string | null;
  lines: LineCalculationInput[];
};

export type ListQuotesFilter = {
  status?: QuotationStatus;
  customerId?: string;
  repUserId?: string;
  search?: string;
  page?: number;
  limit?: number;
  offset?: number;
  all?: boolean;
};

export async function createQuote(
  input: CreateQuoteInput,
  repUserId?: string,
) {
  const pricing = await calculateQuotePricing(input.customerId, input.lines);
  const quoteNumber = await generateQuoteNumber();

  const initialApprovalStep =
    pricing.requiredApprovalLevel === ApprovalLevel.FINANCE
      ? "SALES_MANAGER"
      : pricing.requiredApprovalLevel === ApprovalLevel.SALES_MANAGER
        ? "SALES_MANAGER"
        : null;

  const quote = await prisma.$transaction(async (tx) => {
    const createdQuote = await tx.quotation.create({
      data: {
        quoteNumber,
        customerId: input.customerId,
        repUserId: repUserId ?? null,
        status: QuotationStatus.DRAFT,
        totalAmount: pricing.totalSubtotal,
        totalCost: pricing.totalCost,
        totalMarginPercent: pricing.totalMarginPercent,
        blendedRiskScore: pricing.blendedRiskScore,
        requiredApprovalLevel: pricing.requiredApprovalLevel,
        currentApprovalStep: initialApprovalStep,
        notes: input.notes ?? null,
        deliveryPromiseDate: input.deliveryPromiseDate
          ? new Date(input.deliveryPromiseDate)
          : null,
      },
    });

    await tx.quotationLine.createMany({
      data: pricing.lines.map((line) => ({
        quotationId: createdQuote.id,
        productId: line.productId,
        variantId: line.variantId ?? null,
        subscriptionPlanId: line.subscriptionPlanId ?? null,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        unitCost: line.unitCost,
        discountPercent: line.discountPercent,
        effectivePrice: line.effectivePrice,
        subtotal: line.subtotal,
        totalCost: line.totalCost,
        marginPercent: line.marginPercent,
        categoryCeilingPercent: line.categoryCeilingPercent,
        lineExcessPercent: line.lineExcessPercent,
      })),
    });

    await tx.approvalAuditLog.create({
      data: {
        quotationId: createdQuote.id,
        action: ApprovalAction.SUBMIT,
        actorName: "Sales Rep",
        actorRole: "rep",
        blendedRiskScore: pricing.blendedRiskScore,
        reason: "Quote draft created.",
      },
    });

    return createdQuote;
  });

  return getQuoteById(quote.id);
}

export async function listQuotes(filters: ListQuotesFilter = {}) {
  const where: Prisma.QuotationWhereInput = {};

  if (filters.status) {
    where.status = filters.status;
  }
  if (filters.customerId) {
    where.customerId = filters.customerId;
  }
  if (filters.repUserId) {
    where.repUserId = filters.repUserId;
  }
  if (filters.search) {
    where.OR = [
      { quoteNumber: { contains: filters.search, mode: "insensitive" } },
      { customer: { name: { contains: filters.search, mode: "insensitive" } } },
    ];
  }

  const includeConfig = {
    customer: true,
    lines: {
      include: {
        product: true,
        variant: true,
        subscriptionPlan: true,
      },
    },
    dealAlerts: {
      where: { isDismissed: false },
    },
  };

  if (filters.all) {
    const quotes = await prisma.quotation.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: includeConfig,
    });

    return {
      quotes,
      total: quotes.length,
      page: 1,
      limit: quotes.length,
      totalPages: 1,
      hasMore: false,
    };
  }

  const { page, limit, skip } = getPaginationParams(filters, 20);

  const [quotes, total] = await Promise.all([
    prisma.quotation.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: includeConfig,
    }),
    prisma.quotation.count({ where }),
  ]);

  const meta = buildPaginationMeta(total, page, limit);

  return {
    quotes,
    total,
    page: meta.page,
    limit: meta.limit,
    totalPages: meta.totalPages,
    hasMore: meta.hasMore,
  };
}

export async function getQuoteById(id: string) {
  const quote = await prisma.quotation.findUnique({
    where: { id },
    include: {
      customer: true,
      lines: {
        include: {
          product: true,
          variant: true,
          subscriptionPlan: true,
        },
      },
      auditLogs: {
        orderBy: { createdAt: "asc" },
      },
      fulfillmentSplits: {
        include: {
          warehouse: true,
          quotationLine: {
            include: { product: true },
          },
        },
      },
      invoices: {
        include: { lines: true, payments: true },
      },
      subscriptionContracts: {
        include: { plan: true, schedules: true },
      },
      negotiationComments: {
        orderBy: { createdAt: "asc" },
      },
      dealAlerts: true,
    },
  });

  if (!quote) {
    throw new NotFoundError("Quotation", id);
  }

  return quote;
}

export async function submitQuoteForApproval(
  quoteId: string,
  actorName = "Sales Rep",
  actorRole = "rep",
) {
  const quote = await getQuoteById(quoteId);

  if (
    quote.status !== QuotationStatus.DRAFT &&
    quote.status !== QuotationStatus.UNDER_NEGOTIATION
  ) {
    throw new ValidationError(
      `Cannot submit quote with current status '${quote.status}'.`,
    );
  }

  if (quote.blendedRiskScore === 0) {
    return prisma.$transaction(async (tx) => {
      const updated = await tx.quotation.update({
        where: { id: quoteId },
        data: {
          status: QuotationStatus.APPROVED,
          currentApprovalStep: "APPROVED",
        },
      });

      await tx.approvalAuditLog.create({
        data: {
          quotationId: quoteId,
          action: ApprovalAction.APPROVE_MANAGER,
          actorName,
          actorRole,
          blendedRiskScore: 0,
          reason: "Auto-approved: discounts within permissible ceilings.",
        },
      });

      return updated;
    });
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.quotation.update({
      where: { id: quoteId },
      data: {
        status: QuotationStatus.PENDING_APPROVAL,
        currentApprovalStep: "SALES_MANAGER",
      },
    });

    await tx.approvalAuditLog.create({
      data: {
        quotationId: quoteId,
        action: ApprovalAction.SUBMIT,
        actorName,
        actorRole,
        blendedRiskScore: quote.blendedRiskScore,
        reason: `Routed for approval. Risk Score: ${quote.blendedRiskScore}.`,
      },
    });

    return updated;
  });
}

export async function reviewQuote(
  quoteId: string,
  action: ApprovalAction,
  actorName: string,
  actorRole: string,
  reason?: string,
) {
  const quote = await getQuoteById(quoteId);

  if (quote.status !== QuotationStatus.PENDING_APPROVAL) {
    throw new ValidationError(
      `Cannot review quote. Expected status PENDING_APPROVAL, found '${quote.status}'.`,
    );
  }

  return prisma.$transaction(async (tx) => {
    let nextStatus = quote.status;
    let nextStep = quote.currentApprovalStep;

    switch (action) {
      case ApprovalAction.APPROVE_MANAGER: {
        if (quote.requiredApprovalLevel === ApprovalLevel.FINANCE) {
          nextStep = "FINANCE";
          nextStatus = QuotationStatus.PENDING_APPROVAL;
        } else {
          nextStep = "APPROVED";
          nextStatus = QuotationStatus.APPROVED;
        }
        break;
      }
      case ApprovalAction.APPROVE_FINANCE: {
        nextStep = "APPROVED";
        nextStatus = QuotationStatus.APPROVED;
        break;
      }
      case ApprovalAction.REJECT: {
        nextStep = "REJECTED";
        nextStatus = QuotationStatus.REJECTED;
        break;
      }
      case ApprovalAction.RETURN_FOR_REVISION: {
        nextStep = "REVISION_REQUESTED";
        nextStatus = QuotationStatus.DRAFT;
        break;
      }
      default:
        throw new ValidationError(`Unsupported review action: ${action}`);
    }

    const updated = await tx.quotation.update({
      where: { id: quoteId },
      data: {
        status: nextStatus,
        currentApprovalStep: nextStep,
      },
    });

    await tx.approvalAuditLog.create({
      data: {
        quotationId: quoteId,
        action,
        actorName,
        actorRole,
        blendedRiskScore: quote.blendedRiskScore,
        reason: reason ?? `Action ${action} executed by ${actorName}.`,
      },
    });

    return updated;
  });
}

async function generateQuoteNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.quotation.count();
  const sequence = String(count + 1).padStart(4, "0");
  return `QT-${year}-${sequence}`;
}
