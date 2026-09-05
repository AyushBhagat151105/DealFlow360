import prisma, {
  QuotationStatus,
  ApprovalAction,
  ProductCategory,
} from "@DealFlow360/db";
import { NotFoundError } from "../utils/errors";

export async function getDealHealthOverview() {
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

  const [activeQuotes, pendingCount, stalledCount, openAlerts] = await Promise.all([
    prisma.quotation.findMany({
      where: {
        status: {
          in: [
            QuotationStatus.DRAFT,
            QuotationStatus.UNDER_NEGOTIATION,
            QuotationStatus.PENDING_APPROVAL,
            QuotationStatus.APPROVED,
          ],
        },
      },
    }),
    prisma.quotation.count({
      where: { status: QuotationStatus.PENDING_APPROVAL },
    }),
    prisma.quotation.count({
      where: {
        status: {
          in: [QuotationStatus.DRAFT, QuotationStatus.UNDER_NEGOTIATION],
        },
        updatedAt: { lt: threeDaysAgo },
      },
    }),
    prisma.dealAnomalyAlert.findMany({
      where: { isDismissed: false },
      include: {
        quotation: {
          include: {
            customer: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const activePipelineValue = activeQuotes.reduce((sum, q) => sum + q.totalAmount, 0);
  const marginAtRisk = activeQuotes
    .filter((q) => q.blendedRiskScore > 0)
    .reduce((sum, q) => sum + q.totalAmount, 0);

  return {
    kpis: {
      activePipelineValue: Math.round(activePipelineValue * 100) / 100,
      pendingApprovalCount: pendingCount,
      stalledDealsCount: stalledCount,
      marginAtRisk: Math.round(marginAtRisk * 100) / 100,
    },
    alerts: openAlerts.map((alt) => ({
      id: alt.id,
      quoteId: alt.quotationId,
      quoteNumber: alt.quotation.quoteNumber,
      customerName: alt.quotation.customer.name,
      type: alt.type,
      severity: alt.severity,
      message: alt.message,
      metricDelta: alt.metricDelta,
      isNudged: alt.isNudged,
      isEscalated: alt.isEscalated,
      escalatedTo: alt.escalatedTo,
      createdAt: alt.createdAt,
    })),
  };
}

export async function nudgeDealRep(alertId: string) {
  const alert = await prisma.dealAnomalyAlert.findUnique({
    where: { id: alertId },
  });

  if (!alert) {
    throw new NotFoundError("DealAnomalyAlert", alertId);
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.dealAnomalyAlert.update({
      where: { id: alertId },
      data: { isNudged: true },
    });

    await tx.approvalAuditLog.create({
      data: {
        quotationId: alert.quotationId,
        action: ApprovalAction.SUBMIT,
        actorName: "DealFlow Health Monitor",
        actorRole: "system",
        reason: "Automated nudge notification dispatched to assigned sales representative.",
      },
    });

    return updated;
  });
}

export async function escalateDealAlert(alertId: string, targetRole = "VP_SALES") {
  const alert = await prisma.dealAnomalyAlert.findUnique({
    where: { id: alertId },
  });

  if (!alert) {
    throw new NotFoundError("DealAnomalyAlert", alertId);
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.dealAnomalyAlert.update({
      where: { id: alertId },
      data: {
        isEscalated: true,
        escalatedTo: targetRole,
      },
    });

    await tx.approvalAuditLog.create({
      data: {
        quotationId: alert.quotationId,
        action: ApprovalAction.SUBMIT,
        actorName: "DealFlow Health Monitor",
        actorRole: "system",
        reason: `Deal escalated to ${targetRole} due to health anomaly alert.`,
      },
    });

    return updated;
  });
}

export type SalesReportFilter = {
  startDate?: Date;
  endDate?: Date;
  repUserId?: string;
  status?: QuotationStatus;
  category?: ProductCategory;
};

export async function getSalesReportData(filters: SalesReportFilter = {}) {
  const where: Record<string, unknown> = {};

  if (filters.startDate || filters.endDate) {
    where.createdAt = {
      ...(filters.startDate ? { gte: filters.startDate } : {}),
      ...(filters.endDate ? { lte: filters.endDate } : {}),
    };
  }

  if (filters.repUserId) {
    where.repUserId = filters.repUserId;
  }

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.category) {
    where.lines = {
      some: {
        product: { category: filters.category },
      },
    };
  }

  const quotes = await prisma.quotation.findMany({
    where,
    include: {
      customer: true,
      lines: {
        include: { product: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return quotes.map((q) => ({
    quoteNumber: q.quoteNumber,
    customerName: q.customer.name,
    customerTier: q.customer.tier,
    status: q.status,
    totalAmount: q.totalAmount,
    totalCost: q.totalCost,
    totalMarginPercent: q.totalMarginPercent,
    blendedRiskScore: q.blendedRiskScore,
    requiredApprovalLevel: q.requiredApprovalLevel,
    lineCount: q.lines.length,
    createdAt: q.createdAt,
  }));
}
