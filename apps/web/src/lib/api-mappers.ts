import type { CustomerTier, ProductCategory, Quote, QuoteLine } from "@/lib/api-types";

type ApiRecord = Record<string, unknown>;

function asRecord(value: unknown): ApiRecord {
  return value && typeof value === "object" ? (value as ApiRecord) : {};
}

function asNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function normalizeCategory(value: unknown): ProductCategory {
  return value === "SERVICE" ? "SERVICE" : value === "SUBSCRIPTION" || value === "SOFTWARE_SUBSCRIPTION" ? "SUBSCRIPTION" : "HARDWARE";
}

function normalizeTier(value: unknown): CustomerTier {
  return value === "GOLD" || value === "SILVER" ? value : "BRONZE";
}

function normalizeLine(value: unknown): QuoteLine {
  const raw = asRecord(value);
  const product = asRecord(raw.product);
  const quantity = asNumber(raw.quantity, 1);
  const unitPrice = asNumber(raw.unitPrice);
  const lineSubtotal = asNumber(
    raw.lineSubtotal ?? raw.subtotal ?? asNumber(raw.effectivePrice) * quantity,
  );

  return {
    id: asString(raw.id),
    productId: asString(raw.productId),
    productName: asString(raw.productName ?? product.name, "Unnamed product"),
    category: normalizeCategory(raw.category ?? product.category),
    quantity,
    unitPrice,
    discountPercent: asNumber(raw.discountPercent),
    lineSubtotal,
    costPrice: asNumber(raw.costPrice ?? raw.unitCost ?? product.costPrice),
    minMarginThreshold: asNumber(raw.minMarginThreshold ?? product.minMarginThreshold),
  };
}

export function normalizeQuote(value: unknown): Quote {
  const raw = asRecord(value);
  const customer = asRecord(raw.customer);
  const lines = Array.isArray(raw.lines) ? raw.lines.map(normalizeLine) : [];
  const totalSubtotal = asNumber(raw.totalSubtotal ?? raw.totalAmount ?? raw.total);
  const totalCost = asNumber(raw.totalCost ?? lines.reduce((sum, line) => sum + line.costPrice * line.quantity, 0));
  const totalMarginAmount = asNumber(raw.totalMarginAmount ?? totalSubtotal - totalCost);

  return {
    id: asString(raw.id),
    quoteNumber: asString(raw.quoteNumber, asString(raw.id)),
    customerId: asString(raw.customerId ?? customer.id),
    customerName: asString(raw.customerName ?? customer.name, "Unknown customer"),
    customerTier: normalizeTier(raw.customerTier ?? customer.tier),
    notes: asString(raw.notes),
    status: asString(raw.status, "DRAFT") as Quote["status"],
    blendedRiskScore: asNumber(raw.blendedRiskScore),
    requiredApprovalLevel: asString(raw.requiredApprovalLevel, "NONE") as Quote["requiredApprovalLevel"],
    portalAccessToken: asString(raw.portalAccessToken ?? raw.portalToken),
    totalSubtotal,
    totalCost,
    totalMarginAmount,
    totalMarginPercent: asNumber(raw.totalMarginPercent),
    createdAt: asString(raw.createdAt),
    updatedAt: asString(raw.updatedAt),
    lines,
    auditLogs: Array.isArray(raw.auditLogs)
      ? raw.auditLogs.map((value) => {
          const audit = asRecord(value);
          return {
            id: asString(audit.id),
            action: asString(audit.action),
            actorName: asString(audit.actorName),
            actorRole: asString(audit.actorRole),
            reason: typeof audit.reason === "string" ? audit.reason : null,
            createdAt: asString(audit.createdAt),
          };
        })
      : [],
  };
}

export function normalizeQuotes(value: unknown): Quote[] {
  return Array.isArray(value) ? value.map(normalizeQuote) : [];
}