import prisma, {
  CustomerTier,
  ProductCategory,
  ApprovalLevel,
} from "@DealFlow360/db";
import { NotFoundError, ValidationError } from "../utils/errors";

export type LineCalculationInput = {
  productId: string;
  variantId?: string | null;
  subscriptionPlanId?: string | null;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
};

export type LineCalculationResult = {
  productId: string;
  productName: string;
  category: ProductCategory;
  variantId?: string | null;
  subscriptionPlanId?: string | null;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  discountPercent: number;
  effectivePrice: number;
  subtotal: number;
  totalCost: number;
  marginAmount: number;
  marginPercent: number;
  categoryCeilingPercent: number;
  customerTierCeilingPercent: number;
  effectiveCeilingPercent: number;
  lineExcessPercent: number;
  isBreached: boolean;
};

export type PricingCalculationResult = {
  totalSubtotal: number;
  totalCost: number;
  totalMarginAmount: number;
  totalMarginPercent: number;
  blendedRiskScore: number;
  requiredApprovalLevel: ApprovalLevel;
  lines: LineCalculationResult[];
};

export async function calculateQuotePricing(
  customerId: string,
  rawLines: LineCalculationInput[],
): Promise<PricingCalculationResult> {
  if (!rawLines || rawLines.length === 0) {
    throw new ValidationError("Quotation must contain at least one line item.");
  }

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
  });

  if (!customer) {
    throw new NotFoundError("Customer", customerId);
  }

  const [tierConfigs, categoryCeilings, products] = await Promise.all([
    prisma.customerTierConfig.findMany(),
    prisma.categoryDiscountCeiling.findMany(),
    prisma.product.findMany({
      where: {
        id: { in: rawLines.map((line) => line.productId) },
      },
      include: {
        variants: true,
      },
    }),
  ]);

  const tierMap = new Map<CustomerTier, number>(
    tierConfigs.map((t) => [t.tier, t.defaultDiscountCeiling]),
  );
  const categoryMap = new Map<ProductCategory, number>(
    categoryCeilings.map((c) => [c.category, c.maxDiscountCeiling]),
  );
  const productMap = new Map(products.map((p) => [p.id, p]));

  const customerTierCeiling =
    tierMap.get(customer.tier) ?? getDefaultTierCeiling(customer.tier);

  let totalSubtotal = 0;
  let totalCost = 0;
  let maxExcessPercent = 0;

  const calculatedLines: LineCalculationResult[] = [];

  for (const lineInput of rawLines) {
    const product = productMap.get(lineInput.productId);
    if (!product) {
      throw new NotFoundError("Product", lineInput.productId);
    }

    let extraPrice = 0;
    if (lineInput.variantId) {
      const variant = product.variants.find((v) => v.id === lineInput.variantId);
      if (variant) {
        extraPrice = variant.extraPrice;
      }
    }

    const effectiveBasePrice = Math.max(0, lineInput.unitPrice + extraPrice);
    const discount = Math.max(0, Math.min(100, lineInput.discountPercent));
    const effectiveUnitPrice = roundToTwo(effectiveBasePrice * (1 - discount / 100));
    const lineSubtotal = roundToTwo(effectiveUnitPrice * lineInput.quantity);
    const lineCost = roundToTwo(product.costPrice * lineInput.quantity);
    const lineMarginAmount = roundToTwo(lineSubtotal - lineCost);
    const lineMarginPercent =
      lineSubtotal > 0 ? roundToTwo((lineMarginAmount / lineSubtotal) * 100) : 0;

    const categoryCeiling =
      categoryMap.get(product.category) ?? getDefaultCategoryCeiling(product.category);
    const effectiveCeiling = Math.min(customerTierCeiling, categoryCeiling);
    const lineExcess = Math.max(0, roundToTwo(discount - effectiveCeiling));

    if (lineExcess > maxExcessPercent) {
      maxExcessPercent = lineExcess;
    }

    totalSubtotal = roundToTwo(totalSubtotal + lineSubtotal);
    totalCost = roundToTwo(totalCost + lineCost);

    calculatedLines.push({
      productId: product.id,
      productName: product.name,
      category: product.category,
      variantId: lineInput.variantId ?? null,
      subscriptionPlanId: lineInput.subscriptionPlanId ?? null,
      quantity: lineInput.quantity,
      unitPrice: effectiveBasePrice,
      unitCost: product.costPrice,
      discountPercent: discount,
      effectivePrice: effectiveUnitPrice,
      subtotal: lineSubtotal,
      totalCost: lineCost,
      marginAmount: lineMarginAmount,
      marginPercent: lineMarginPercent,
      categoryCeilingPercent: categoryCeiling,
      customerTierCeilingPercent: customerTierCeiling,
      effectiveCeilingPercent: effectiveCeiling,
      lineExcessPercent: lineExcess,
      isBreached: lineExcess > 0,
    });
  }

  let weightedBreachSum = 0;
  for (const line of calculatedLines) {
    const weight = totalSubtotal > 0 ? line.subtotal / totalSubtotal : 1 / calculatedLines.length;
    weightedBreachSum += weight * line.lineExcessPercent * 2;
  }

  const blendedRiskScore = roundToOne(weightedBreachSum + maxExcessPercent);
  const totalMarginAmount = roundToTwo(totalSubtotal - totalCost);
  const totalMarginPercent =
    totalSubtotal > 0 ? roundToTwo((totalMarginAmount / totalSubtotal) * 100) : 0;

  const requiredApprovalLevel = determineApprovalLevel(blendedRiskScore);

  return {
    totalSubtotal,
    totalCost,
    totalMarginAmount,
    totalMarginPercent,
    blendedRiskScore,
    requiredApprovalLevel,
    lines: calculatedLines,
  };
}

function determineApprovalLevel(riskScore: number): ApprovalLevel {
  if (riskScore <= 0) {
    return ApprovalLevel.NONE;
  }
  if (riskScore <= 10) {
    return ApprovalLevel.SALES_MANAGER;
  }
  return ApprovalLevel.FINANCE;
}

function getDefaultTierCeiling(tier: CustomerTier): number {
  switch (tier) {
    case CustomerTier.GOLD:
      return 15;
    case CustomerTier.SILVER:
      return 10;
    case CustomerTier.BRONZE:
    default:
      return 5;
  }
}

function getDefaultCategoryCeiling(category: ProductCategory): number {
  switch (category) {
    case ProductCategory.HARDWARE:
      return 15;
    case ProductCategory.SERVICE:
      return 10;
    case ProductCategory.SUBSCRIPTION:
    default:
      return 12;
  }
}

function roundToTwo(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function roundToOne(value: number): number {
  return Math.round((value + Number.EPSILON) * 10) / 10;
}
