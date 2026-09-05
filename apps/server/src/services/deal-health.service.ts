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

export async function getSalesAnalyticsReport(filters: SalesReportFilter = {}) {
  const where: Record<string, unknown> = {};

  if (filters.startDate || filters.endDate) {
    where.createdAt = {
      ...(filters.startDate ? { gte: filters.startDate } : {}),
      ...(filters.endDate ? { lte: filters.endDate } : {}),
    };
  }

  if (filters.repUserId) where.repUserId = filters.repUserId;
  if (filters.status) where.status = filters.status;
  if (filters.category) {
    where.lines = {
      some: { product: { category: filters.category } },
    };
  }

  const [quotes, tierConfigs, users] = await Promise.all([
    prisma.quotation.findMany({
      where,
      include: {
        customer: true,
        lines: {
          include: { product: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.customerTierConfig.findMany(),
    prisma.user.findMany(),
  ]);

  const userMap = new Map(users.map((u) => [u.id, u.name]));
  const tierCeilingMap = new Map(tierConfigs.map((t) => [t.tier, t.defaultDiscountCeiling]));

  const categoryStats: Record<
    ProductCategory,
    { revenue: number; cost: number; lineCount: number }
  > = {
    [ProductCategory.HARDWARE]: { revenue: 0, cost: 0, lineCount: 0 },
    [ProductCategory.SERVICE]: { revenue: 0, cost: 0, lineCount: 0 },
    [ProductCategory.SUBSCRIPTION]: { revenue: 0, cost: 0, lineCount: 0 },
  };

  for (const q of quotes) {
    for (const l of q.lines) {
      const cat = l.product.category;
      if (categoryStats[cat]) {
        categoryStats[cat].revenue += l.subtotal;
        categoryStats[cat].cost += l.totalCost;
        categoryStats[cat].lineCount += 1;
      }
    }
  }

  const categoryBreakdown = Object.entries(categoryStats).map(([category, stat]) => {
    const margin = stat.revenue > 0 ? ((stat.revenue - stat.cost) / stat.revenue) * 100 : 0;
    return {
      category: category as ProductCategory,
      revenue: Math.round(stat.revenue * 100) / 100,
      cost: Math.round(stat.cost * 100) / 100,
      marginPercent: Math.round(margin * 10) / 10,
      lineCount: stat.lineCount,
    };
  });

  const tierQuotes: Record<string, { totalDiscount: number; count: number; breaches: number }> = {
    BRONZE: { totalDiscount: 0, count: 0, breaches: 0 },
    SILVER: { totalDiscount: 0, count: 0, breaches: 0 },
    GOLD: { totalDiscount: 0, count: 0, breaches: 0 },
  };

  for (const q of quotes) {
    const tier = q.customer.tier;
    const ceiling = tierCeilingMap.get(tier as never) ?? 15;
    const avgDiscount =
      q.lines.length > 0
        ? q.lines.reduce((s, l) => s + l.discountPercent, 0) / q.lines.length
        : 0;

    if (!tierQuotes[tier]) {
      tierQuotes[tier] = { totalDiscount: 0, count: 0, breaches: 0 };
    }
    tierQuotes[tier].totalDiscount += avgDiscount;
    tierQuotes[tier].count += 1;
    if (avgDiscount > ceiling) {
      tierQuotes[tier].breaches += 1;
    }
  }

  const tierGovernance = Object.entries(tierQuotes).map(([tier, data]) => {
    const avgDiscount = data.count > 0 ? data.totalDiscount / data.count : 0;
    const ceiling = tierCeilingMap.get(tier as never) ?? 15;
    return {
      tier,
      quoteCount: data.count,
      actualAvgDiscount: Math.round(avgDiscount * 10) / 10,
      ceilingPercent: ceiling,
      breachCount: data.breaches,
      variance: Math.round((avgDiscount - ceiling) * 10) / 10,
    };
  });

  const repStats: Record<
    string,
    { repName: string; quoteCount: number; pipeline: number; won: number; totalMargin: number }
  > = {};

  for (const q of quotes) {
    const repId = q.repUserId ?? "unassigned";
    const repName = repId !== "unassigned" ? (userMap.get(repId) ?? "Unknown Rep") : "Direct / Inbound";

    if (!repStats[repId]) {
      repStats[repId] = {
        repName,
        quoteCount: 0,
        pipeline: 0,
        won: 0,
        totalMargin: 0,
      };
    }

    repStats[repId].quoteCount += 1;
    repStats[repId].pipeline += q.totalAmount;
    repStats[repId].totalMargin += q.totalMarginPercent;

    if (q.status === QuotationStatus.CONFIRMED || q.status === QuotationStatus.FULFILLED) {
      repStats[repId].won += q.totalAmount;
    }
  }

  const repPerformance = Object.entries(repStats).map(([repId, stat]) => ({
    repId,
    repName: stat.repName,
    quoteCount: stat.quoteCount,
    totalPipeline: Math.round(stat.pipeline * 100) / 100,
    wonRevenue: Math.round(stat.won * 100) / 100,
    avgMarginPercent:
      stat.quoteCount > 0 ? Math.round((stat.totalMargin / stat.quoteCount) * 10) / 10 : 0,
  }));

  const totalRevenue = quotes.reduce((s, q) => s + q.totalAmount, 0);
  const totalCost = quotes.reduce((s, q) => s + q.totalCost, 0);
  const avgMargin = totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0;
  const avgRiskScore =
    quotes.length > 0
      ? quotes.reduce((s, q) => s + q.blendedRiskScore, 0) / quotes.length
      : 0;

  return {
    summary: {
      totalQuotes: quotes.length,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      avgMarginPercent: Math.round(avgMargin * 10) / 10,
      avgRiskScore: Math.round(avgRiskScore * 10) / 10,
    },
    categoryBreakdown,
    tierGovernance,
    repPerformance,
  };
}

export async function exportSalesReportCsv(filters: SalesReportFilter = {}) {
  const data = await getSalesReportData(filters);

  const headers = [
    "Quote Number",
    "Customer Name",
    "Customer Tier",
    "Status",
    "Total Amount",
    "Total Cost",
    "Margin %",
    "Blended Risk Score",
    "Approval Level",
    "Line Items",
    "Created At",
  ];

  const escapeCsv = (val: unknown) => {
    if (val === null || val === undefined) return "";
    const str = String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = data.map((q) => [
    q.quoteNumber,
    q.customerName,
    q.customerTier,
    q.status,
    q.totalAmount.toFixed(2),
    q.totalCost.toFixed(2),
    `${q.totalMarginPercent.toFixed(1)}%`,
    q.blendedRiskScore.toFixed(1),
    q.requiredApprovalLevel,
    q.lineCount,
    new Date(q.createdAt).toISOString().split("T")[0],
  ]);

  return [
    headers.join(","),
    ...rows.map((r) => r.map(escapeCsv).join(",")),
  ].join("\n");
}
