import prisma, { ProductCategory } from "@DealFlow360/db";
import { NotFoundError } from "../utils/errors";

export type UpsellSuggestion = {
  productId: string;
  name: string;
  category: ProductCategory;
  basePrice: number;
  costPrice: number;
  marginPercent: number;
  isPromoted: boolean;
  promotionTag: string | null;
  marginDeltaPercent: number;
  reason: string;
};

export async function getQuoteUpsellSuggestions(quoteId: string): Promise<UpsellSuggestion[]> {
  const quote = await prisma.quotation.findUnique({
    where: { id: quoteId },
    include: {
      lines: {
        include: { product: true },
      },
    },
  });

  if (!quote) {
    throw new NotFoundError("Quotation", quoteId);
  }

  const existingProductIds = new Set(quote.lines.map((l) => l.productId));

  const [rules, promotedProducts] = await Promise.all([
    prisma.upsellRule.findMany({
      where: {
        sourceProductId: { in: Array.from(existingProductIds) },
        suggestedProductId: { notIn: Array.from(existingProductIds) },
      },
      include: {
        suggestedProduct: true,
      },
      orderBy: { pairingWeight: "desc" },
    }),
    prisma.product.findMany({
      where: {
        isPromoted: true,
        id: { notIn: Array.from(existingProductIds) },
      },
    }),
  ]);

  const candidateMap = new Map<
    string,
    {
      product: (typeof promotedProducts)[0];
      pairingWeight: number;
      promotionTag: string | null;
      reason: string;
    }
  >();

  for (const rule of rules) {
    candidateMap.set(rule.suggestedProduct.id, {
      product: rule.suggestedProduct,
      pairingWeight: rule.pairingWeight,
      promotionTag: rule.promotionTag,
      reason: "Frequently paired with items in this quote",
    });
  }

  for (const promoted of promotedProducts) {
    if (!candidateMap.has(promoted.id)) {
      candidateMap.set(promoted.id, {
        product: promoted,
        pairingWeight: 0.5,
        promotionTag: "Featured Promotion",
        reason: "Featured product recommendation",
      });
    }
  }

  const currentTotalSubtotal = quote.totalAmount;
  const currentTotalCost = quote.totalCost;
  const currentMarginPercent = quote.totalMarginPercent;

  const suggestions: UpsellSuggestion[] = [];

  for (const candidate of candidateMap.values()) {
    const p = candidate.product;
    const marginAmount = p.basePrice - p.costPrice;
    const itemMarginPercent =
      p.basePrice > 0 ? Math.round((marginAmount / p.basePrice) * 1000) / 10 : 0;

    if (itemMarginPercent < p.minMarginThreshold) {
      continue;
    }

    const projectedSubtotal = currentTotalSubtotal + p.basePrice;
    const projectedCost = currentTotalCost + p.costPrice;
    const projectedMarginPercent =
      projectedSubtotal > 0
        ? Math.round(((projectedSubtotal - projectedCost) / projectedSubtotal) * 1000) / 10
        : 0;

    const marginDeltaPercent =
      Math.round((projectedMarginPercent - currentMarginPercent) * 10) / 10;

    suggestions.push({
      productId: p.id,
      name: p.name,
      category: p.category,
      basePrice: p.basePrice,
      costPrice: p.costPrice,
      marginPercent: itemMarginPercent,
      isPromoted: p.isPromoted,
      promotionTag: candidate.promotionTag,
      marginDeltaPercent,
      reason: candidate.reason,
    });
  }

  return suggestions.sort((a, b) => {
    if (a.isPromoted && !b.isPromoted) return -1;
    if (!a.isPromoted && b.isPromoted) return 1;
    return b.marginDeltaPercent - a.marginDeltaPercent;
  });
}
