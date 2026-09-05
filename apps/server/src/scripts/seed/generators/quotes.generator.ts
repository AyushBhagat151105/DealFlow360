import prisma, {
  QuotationStatus,
  ApprovalLevel,
  ApprovalAction,
  AnomalyType,
  AnomalySeverity,
  ProductCategory,
} from "@DealFlow360/db";
import { GUJARAT_CUSTOMERS } from "../data/customers.data.js";
import { GUJARAT_USERS } from "../data/users.data.js";
import { GUJARAT_PRODUCTS, GUJARAT_PRODUCT_VARIANTS } from "../data/products.data.js";
import { GUJARAT_WAREHOUSES } from "../data/warehouses.data.js";

export interface GeneratedQuoteSummary {
  quoteIds: string[];
  confirmedQuoteIds: string[];
}

export async function generateQuotations(planIds: string[]): Promise<GeneratedQuoteSummary> {
  console.log("-> Generating 520 Procedural Quotations for Gujarat Enterprises...");

  const reps = GUJARAT_USERS.filter((u) => u.role === "rep");
  const managers = GUJARAT_USERS.filter((u) => u.role === "manager");
  const financeUsers = GUJARAT_USERS.filter((u) => u.role === "finance");

  const quotesToCreate: any[] = [];
  const linesToCreate: any[] = [];
  const auditLogsToCreate: any[] = [];
  const anomalyAlertsToCreate: any[] = [];
  const commentsToCreate: any[] = [];
  const fulfillmentSplitsToCreate: any[] = [];

  const confirmedQuoteIds: string[] = [];
  const now = Date.now();

  const TOTAL_QUOTES = 520;

  for (let i = 1; i <= TOTAL_QUOTES; i++) {
    const quoteId = `qt_2026_${String(i).padStart(4, "0")}`;
    const quoteNumber = `QT-2026-${String(i).padStart(4, "0")}`;

    const customer = GUJARAT_CUSTOMERS[(i * 17) % GUJARAT_CUSTOMERS.length]!;
    const demoRep = reps.find((r) => r.isDemo);
    const rep = (i <= 20 && demoRep ? demoRep : reps[i % reps.length]) ?? reps[0]!;

    let status: QuotationStatus;
    let reqApproval: ApprovalLevel = ApprovalLevel.NONE;
    let currentStep: string | null = null;

    if (i <= 90) {
      status = QuotationStatus.DRAFT;
    } else if (i <= 220) {
      status = QuotationStatus.PENDING_APPROVAL;
      if (i % 2 === 0) {
        reqApproval = ApprovalLevel.SALES_MANAGER;
        currentStep = "SALES_MANAGER";
      } else {
        reqApproval = ApprovalLevel.FINANCE;
        currentStep = i % 3 === 0 ? "SALES_MANAGER" : "FINANCE";
      }
    } else if (i <= 330) {
      status = QuotationStatus.APPROVED;
      reqApproval = i % 2 === 0 ? ApprovalLevel.SALES_MANAGER : ApprovalLevel.FINANCE;
      currentStep = "COMPLETED";
    } else if (i <= 405) {
      status = QuotationStatus.UNDER_NEGOTIATION;
      reqApproval = ApprovalLevel.SALES_MANAGER;
    } else if (i <= 490) {
      status = QuotationStatus.CONFIRMED;
      confirmedQuoteIds.push(quoteId);
    } else {
      status = QuotationStatus.REJECTED;
      reqApproval = ApprovalLevel.FINANCE;
      currentStep = "REJECTED";
    }

    const daysAgo = Math.floor(((TOTAL_QUOTES - i) / TOTAL_QUOTES) * 115) + (i % 5);
    const createdAt = new Date(now - daysAgo * 24 * 60 * 60 * 1000);
    const updatedAt = new Date(createdAt.getTime() + Math.min(daysAgo * 12 * 60 * 60 * 1000, 48 * 60 * 60 * 1000));
    const deliveryPromiseDate = new Date(createdAt.getTime() + (14 + (i % 28)) * 24 * 60 * 60 * 1000);

    const lineCount = 1 + (i % 4);
    let quoteTotalAmount = 0;
    let quoteTotalCost = 0;
    let maxLineExcess = 0;

    for (let l = 1; l <= lineCount; l++) {
      const lineId = `qtl_${quoteId}_${l}`;
      const prodIndex = (i * 3 + l * 7) % GUJARAT_PRODUCTS.length;
      const product = GUJARAT_PRODUCTS[prodIndex]!;

      let variantId: string | null = null;
      let variantPriceAdd = 0;
      const matchingVariants = GUJARAT_PRODUCT_VARIANTS.filter((v) => v.productId === product.id);
      if (matchingVariants.length > 0 && l % 2 === 0) {
        const v = matchingVariants[l % matchingVariants.length]!;
        variantId = v.id;
        variantPriceAdd = v.extraPrice;
      }

      let subPlanId: string | null = null;
      if (product.category === ProductCategory.SUBSCRIPTION && planIds.length > 0) {
        subPlanId = planIds[l % planIds.length] ?? null;
      }

      const unitPrice = product.basePrice + variantPriceAdd;
      const unitCost = product.costPrice;
      const quantity = product.category === ProductCategory.SUBSCRIPTION ? 5 + ((i * 2 + l) % 45) : 1 + ((i + l) % 8);

      let discountPercent = 0;
      if (status === QuotationStatus.PENDING_APPROVAL) {
        discountPercent = reqApproval === ApprovalLevel.FINANCE ? 16.0 + (l % 10) : 11.0 + (l % 4);
      } else if (status === QuotationStatus.APPROVED) {
        discountPercent = 8.0 + (l % 5);
      } else if (status === QuotationStatus.UNDER_NEGOTIATION) {
        discountPercent = 14.0 + (l % 7);
      } else {
        discountPercent = (i % 7) * 1.5;
      }

      const effectivePrice = Math.round(unitPrice * (1 - discountPercent / 100));
      const lineSubtotal = effectivePrice * quantity;
      const lineCost = unitCost * quantity;
      const marginPercent = lineSubtotal > 0 ? Number((((lineSubtotal - lineCost) / lineSubtotal) * 100).toFixed(2)) : 0;

      const categoryCeiling = product.category === ProductCategory.HARDWARE ? 15.0 : product.category === ProductCategory.SERVICE ? 10.0 : 12.0;
      const lineExcess = Math.max(0, Number((discountPercent - categoryCeiling).toFixed(2)));
      if (lineExcess > maxLineExcess) maxLineExcess = lineExcess;

      quoteTotalAmount += lineSubtotal;
      quoteTotalCost += lineCost;

      const qLine = {
        id: lineId,
        quotationId: quoteId,
        productId: product.id,
        variantId,
        subscriptionPlanId: subPlanId,
        quantity,
        unitPrice,
        unitCost,
        discountPercent,
        effectivePrice,
        subtotal: lineSubtotal,
        totalCost: lineCost,
        marginPercent,
        categoryCeilingPercent: categoryCeiling,
        lineExcessPercent: lineExcess,
        createdAt,
        updatedAt,
      };

      linesToCreate.push(qLine);

      if (status === QuotationStatus.CONFIRMED && product.category === ProductCategory.HARDWARE) {
        const wh1 = GUJARAT_WAREHOUSES[i % GUJARAT_WAREHOUSES.length]!;
        const wh2 = GUJARAT_WAREHOUSES[(i + 1) % GUJARAT_WAREHOUSES.length]!;
        const allocWh1 = Math.ceil(quantity * 0.7);
        const allocWh2 = quantity - allocWh1;

        fulfillmentSplitsToCreate.push({
          id: `ful_${lineId}_1`,
          quotationId: quoteId,
          quotationLineId: lineId,
          warehouseId: wh1.id,
          quantityAllocated: allocWh1,
          quantityBackordered: 0,
          status: "ALLOCATED",
          estimatedShippingCost: 1500 * wh1.shippingCostWeight,
          isManualOverride: false,
          createdAt,
          updatedAt,
        });

        if (allocWh2 > 0) {
          fulfillmentSplitsToCreate.push({
            id: `ful_${lineId}_2`,
            quotationId: quoteId,
            quotationLineId: lineId,
            warehouseId: wh2.id,
            quantityAllocated: allocWh2,
            quantityBackordered: 0,
            status: "ALLOCATED",
            estimatedShippingCost: 1800 * wh2.shippingCostWeight,
            isManualOverride: false,
            createdAt,
            updatedAt,
          });
        }
      }
    }

    const totalMarginPercent = quoteTotalAmount > 0 ? Number((((quoteTotalAmount - quoteTotalCost) / quoteTotalAmount) * 100).toFixed(2)) : 0;
    const blendedRiskScore = Number((maxLineExcess * 1.8 + (totalMarginPercent < 25 ? 10 : 0)).toFixed(1));

    quotesToCreate.push({
      id: quoteId,
      quoteNumber,
      customerId: customer.id,
      repUserId: rep.id,
      status,
      totalAmount: quoteTotalAmount,
      totalCost: quoteTotalCost,
      totalMarginPercent,
      blendedRiskScore,
      requiredApprovalLevel: reqApproval,
      currentApprovalStep: currentStep,
      portalAccessToken: `portal_token_${quoteId}`,
      notes: `Enterprise commercial deployment proposal for ${customer.name} operations in Gujarat.`,
      deliveryPromiseDate,
      createdAt,
      updatedAt,
    });

    if (status === QuotationStatus.PENDING_APPROVAL) {
      auditLogsToCreate.push({
        id: `aud_${quoteId}_sub`,
        quotationId: quoteId,
        action: ApprovalAction.SUBMIT,
        actorName: rep.name,
        actorRole: rep.role,
        blendedRiskScore,
        reason: `Commercial discount submitted for approval. Exceeds ceiling by ${maxLineExcess}%.`,
        createdAt: new Date(createdAt.getTime() + 10 * 60 * 1000),
      });
    } else if (status === QuotationStatus.APPROVED) {
      const mgr = managers[i % managers.length] ?? managers[0]!;
      const fin = financeUsers[i % financeUsers.length] ?? financeUsers[0]!;
      auditLogsToCreate.push({
        id: `aud_${quoteId}_sub`,
        quotationId: quoteId,
        action: ApprovalAction.SUBMIT,
        actorName: rep.name,
        actorRole: rep.role,
        blendedRiskScore,
        reason: `Quote submitted for standard executive review.`,
        createdAt: new Date(createdAt.getTime() + 10 * 60 * 1000),
      });
      auditLogsToCreate.push({
        id: `aud_${quoteId}_app`,
        quotationId: quoteId,
        action: reqApproval === ApprovalLevel.FINANCE ? ApprovalAction.APPROVE_FINANCE : ApprovalAction.APPROVE_MANAGER,
        actorName: reqApproval === ApprovalLevel.FINANCE ? fin.name : mgr.name,
        actorRole: reqApproval === ApprovalLevel.FINANCE ? "finance" : "manager",
        blendedRiskScore,
        reason: `Approved based on strategic account expansion with ${customer.name}.`,
        createdAt: new Date(createdAt.getTime() + 2 * 60 * 60 * 1000),
      });
    } else if (status === QuotationStatus.REJECTED) {
      const fin = financeUsers[i % financeUsers.length] ?? financeUsers[0]!;
      auditLogsToCreate.push({
        id: `aud_${quoteId}_sub`,
        quotationId: quoteId,
        action: ApprovalAction.SUBMIT,
        actorName: rep.name,
        actorRole: rep.role,
        blendedRiskScore,
        reason: `High discount requested to close fiscal quarter.`,
        createdAt: new Date(createdAt.getTime() + 10 * 60 * 1000),
      });
      auditLogsToCreate.push({
        id: `aud_${quoteId}_rej`,
        quotationId: quoteId,
        action: ApprovalAction.REJECT,
        actorName: fin.name,
        actorRole: "finance",
        blendedRiskScore,
        reason: `Discount structure yields unacceptable margin (${totalMarginPercent}%). Please revise with standard bundle.`,
        createdAt: new Date(createdAt.getTime() + 4 * 60 * 60 * 1000),
      });
    }

    if (status === QuotationStatus.DRAFT && daysAgo > 5 && i % 4 === 0) {
      const leadMgr = managers[0]!;
      anomalyAlertsToCreate.push({
        id: `alt_${quoteId}_stalled`,
        quotationId: quoteId,
        type: AnomalyType.STALLED_DEAL,
        severity: daysAgo > 15 ? AnomalySeverity.HIGH : AnomalySeverity.MEDIUM,
        message: `Quotation has remained in DRAFT with no customer interaction for ${daysAgo} days.`,
        metricDelta: Number(daysAgo.toFixed(1)),
        isDismissed: false,
        isNudged: i % 2 === 0,
        isEscalated: daysAgo > 20,
        escalatedTo: daysAgo > 20 ? leadMgr.name : null,
        createdAt: updatedAt,
        updatedAt,
      });
    }

    if (maxLineExcess > 4.0 && i % 3 === 0) {
      const altMgr = managers[1] ?? managers[0]!;
      anomalyAlertsToCreate.push({
        id: `alt_${quoteId}_disc`,
        quotationId: quoteId,
        type: AnomalyType.DISCOUNT_ANOMALY,
        severity: maxLineExcess > 8.0 ? AnomalySeverity.HIGH : AnomalySeverity.MEDIUM,
        message: `Proposed line discount is +${maxLineExcess}% higher than ${customer.name}'s historical average (${customer.historicalAvgDiscount}%).`,
        metricDelta: Number(maxLineExcess.toFixed(1)),
        isDismissed: false,
        isNudged: false,
        isEscalated: maxLineExcess > 8.0,
        escalatedTo: maxLineExcess > 8.0 ? altMgr.name : null,
        createdAt: updatedAt,
        updatedAt,
      });
    }

    if (status === QuotationStatus.UNDER_NEGOTIATION && i % 2 === 0) {
      commentsToCreate.push({
        id: `cmt_${quoteId}_1`,
        quotationId: quoteId,
        authorName: customer.contactName,
        isCustomer: true,
        comment: `We are comparing this quotation with a local vendor in Ahmedabad. Can you adjust the hardware unit price by another 4%?`,
        proposedDiscountPercent: 16.0,
        createdAt: new Date(createdAt.getTime() + 6 * 60 * 60 * 1000),
      });
      commentsToCreate.push({
        id: `cmt_${quoteId}_2`,
        quotationId: quoteId,
        authorName: rep.name,
        isCustomer: false,
        comment: `Thank you for the update ${customer.contactName}. We have bundled 24/7 dedicated support and submitted to finance for margin review.`,
        proposedDiscountPercent: null,
        createdAt: new Date(createdAt.getTime() + 18 * 60 * 60 * 1000),
      });
    }
  }

  console.log(`-> Inserting ${quotesToCreate.length} Quotation records...`);
  const chunkSize = 100;
  for (let c = 0; c < quotesToCreate.length; c += chunkSize) {
    await prisma.quotation.createMany({
      data: quotesToCreate.slice(c, c + chunkSize),
    });
  }

  console.log(`-> Inserting ${linesToCreate.length} Quotation Line records...`);
  for (let c = 0; c < linesToCreate.length; c += chunkSize) {
    await prisma.quotationLine.createMany({
      data: linesToCreate.slice(c, c + chunkSize),
    });
  }

  console.log(`-> Inserting ${auditLogsToCreate.length} Approval Audit Logs...`);
  for (let c = 0; c < auditLogsToCreate.length; c += chunkSize) {
    await prisma.approvalAuditLog.createMany({
      data: auditLogsToCreate.slice(c, c + chunkSize),
    });
  }

  console.log(`-> Inserting ${anomalyAlertsToCreate.length} Deal Anomaly Alerts...`);
  for (let c = 0; c < anomalyAlertsToCreate.length; c += chunkSize) {
    await prisma.dealAnomalyAlert.createMany({
      data: anomalyAlertsToCreate.slice(c, c + chunkSize),
    });
  }

  console.log(`-> Inserting ${commentsToCreate.length} Negotiation Comments...`);
  for (let c = 0; c < commentsToCreate.length; c += chunkSize) {
    await prisma.negotiationComment.createMany({
      data: commentsToCreate.slice(c, c + chunkSize),
    });
  }

  console.log(`-> Inserting ${fulfillmentSplitsToCreate.length} Fulfillment Splits...`);
  for (let c = 0; c < fulfillmentSplitsToCreate.length; c += chunkSize) {
    await prisma.fulfillmentSplit.createMany({
      data: fulfillmentSplitsToCreate.slice(c, c + chunkSize),
    });
  }

  return {
    quoteIds: quotesToCreate.map((q) => q.id),
    confirmedQuoteIds,
  };
}
