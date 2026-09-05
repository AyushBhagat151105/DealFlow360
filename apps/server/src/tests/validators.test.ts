import { describe, it, expect } from "vitest";
import {
  createProductSchema,
  createCustomerSchema,
  updateCustomerSchema,
  createWarehouseSchema,
  updateCeilingSchema,
  updateUserRoleSchema,
  idParamSchema,
  customerTierParamSchema,
  categoryParamSchema,
} from "../validators/catalog.validator";
import {
  calculatePreviewSchema,
  createQuoteSchema,
  listQuotesQuerySchema,
  reviewQuoteSchema,
  submitApprovalSchema,
  quoteIdParamSchema,
} from "../validators/quote.validator";
import {
  alertIdParamSchema,
  escalateAlertSchema,
  salesReportQuerySchema,
  salesAnalyticsQuerySchema,
  exportSalesReportQuerySchema,
} from "../validators/deal-health.validator";
import {
  recordPaymentSchema,
  modifySeatsSchema,
  invoiceIdParamSchema,
  contractIdParamSchema,
  billingIdParamSchema,
  listInvoicesQuerySchema,
  exportInvoicesQuerySchema,
} from "../validators/billing.validator";
import {
  confirmFulfillmentSchema,
  replenishStockSchema,
  warehouseIdParamSchema,
  fulfillmentQuoteIdParamSchema,
} from "../validators/fulfillment.validator";
import {
  addPortalCommentSchema,
  submitCounterOfferSchema,
  confirmPortalQuoteSchema,
  portalTokenParamSchema,
  requestMagicLinkSchema,
  sendPortalLinkSchema,
} from "../validators/portal.validator";

describe("Catalog Validators", () => {
  it("validates createProductSchema successfully", () => {
    const valid = {
      sku: "SKU-TEST-001",
      name: "Enterprise Server",
      category: "HARDWARE",
      basePrice: 50000,
      floorPrice: 40000,
      marginFloor: 20,
      isActive: true,
    };
    const parsed = createProductSchema.parse(valid);
    expect(parsed.sku).toBe("SKU-TEST-001");
  });

  it("fails createProductSchema when basePrice is negative", () => {
    const invalid = {
      sku: "SKU-TEST-001",
      name: "Enterprise Server",
      category: "HARDWARE",
      basePrice: -500,
    };
    expect(() => createProductSchema.parse(invalid)).toThrow();
  });

  it("validates createCustomerSchema and validates tier", () => {
    const valid = {
      name: "Acme Corp",
      email: "procurement@acme.com",
      tier: "GOLD",
      industry: "Manufacturing",
      paymentTerms: "NET_30",
    };
    const parsed = createCustomerSchema.parse(valid);
    expect(parsed.tier).toBe("GOLD");

    expect(() =>
      createCustomerSchema.parse({
        name: "Acme Corp",
        tier: "INVALID_TIER",
      }),
    ).toThrow();
  });

  it("validates updateCustomerSchema allows partial updates", () => {
    const parsed = updateCustomerSchema.parse({ name: "Acme Updated" });
    expect(parsed.name).toBe("Acme Updated");
  });

  it("validates updateUserRoleSchema with allowed roles", () => {
    expect(updateUserRoleSchema.parse({ role: "admin" }).role).toBe("admin");
    expect(updateUserRoleSchema.parse({ role: "manager" }).role).toBe("manager");
    expect(() => updateUserRoleSchema.parse({ role: "superadmin" })).toThrow();
  });

  it("validates idParamSchema and categoryParamSchema", () => {
    expect(idParamSchema.parse({ id: "item-123" }).id).toBe("item-123");
    expect(() => idParamSchema.parse({ id: "" })).toThrow();
    expect(customerTierParamSchema.parse({ tier: "GOLD" }).tier).toBe("GOLD");
    expect(() => customerTierParamSchema.parse({ tier: "" })).toThrow();
    expect(categoryParamSchema.parse({ category: "HARDWARE" }).category).toBe("HARDWARE");
  });

  it("validates updateCeilingSchema", () => {
    const parsed = updateCeilingSchema.parse({ ceilingPercent: 25 });
    expect(parsed.ceilingPercent).toBe(25);
    expect(() => updateCeilingSchema.parse({ ceilingPercent: 120 })).toThrow();
    expect(() => updateCeilingSchema.parse({ ceilingPercent: -5 })).toThrow();
  });

  it("validates createWarehouseSchema", () => {
    const valid = {
      code: "WH-AHM-01",
      name: "Ahmedabad Hub",
      location: "Ahmedabad, Gujarat",
    };
    expect(createWarehouseSchema.parse(valid).code).toBe("WH-AHM-01");
  });
});

describe("Quote Validators", () => {
  it("validates calculatePreviewSchema", () => {
    const valid = {
      customerId: "cust-1",
      lines: [
        {
          productId: "prod-1",
          quantity: 5,
          unitPrice: 1000,
          discountPercent: 10,
        },
      ],
    };
    const parsed = calculatePreviewSchema.parse(valid);
    expect(parsed.lines).toHaveLength(1);
    expect(parsed.lines[0]?.unitPrice).toBe(1000);
  });

  it("validates createQuoteSchema", () => {
    const valid = {
      customerId: "cust-1",
      lines: [
        {
          productId: "prod-1",
          quantity: 2,
          unitPrice: 5000,
          discountPercent: 5,
        },
      ],
      notes: "Urgent shipment required",
    };
    const parsed = createQuoteSchema.parse(valid);
    expect(parsed.customerId).toBe("cust-1");
    expect(parsed.lines).toHaveLength(1);
  });

  it("fails calculatePreviewSchema when lines array is empty", () => {
    expect(() =>
      calculatePreviewSchema.parse({
        customerId: "cust-1",
        lines: [],
      }),
    ).toThrow();
  });

  it("validates submitApprovalSchema with defaults", () => {
    const parsed = submitApprovalSchema.parse({});
    expect(parsed.actorName).toBe("Sales Rep");
    expect(parsed.actorRole).toBe("rep");
  });

  it("validates reviewQuoteSchema requires valid action", () => {
    expect(
      reviewQuoteSchema.parse({ action: "APPROVE_MANAGER", reason: "Within limits" })
        .action,
    ).toBe("APPROVE_MANAGER");
    expect(() => reviewQuoteSchema.parse({ action: "APPROVE" })).toThrow();
  });

  it("validates quoteIdParamSchema", () => {
    expect(quoteIdParamSchema.parse({ id: "q-123" }).id).toBe("q-123");
    expect(() => quoteIdParamSchema.parse({ id: "" })).toThrow();
  });

  it("validates listQuotesQuerySchema", () => {
    const query = listQuotesQuerySchema.parse({
      status: "APPROVED",
      page: 1,
      limit: 20,
    });
    expect(query.status).toBe("APPROVED");
    expect(query.page).toBe(1);
  });
});

describe("Deal Health Validators", () => {
  it("validates alertIdParamSchema", () => {
    expect(alertIdParamSchema.parse({ alertId: "alt-1" }).alertId).toBe(
      "alt-1",
    );
    expect(() => alertIdParamSchema.parse({ alertId: "" })).toThrow();
  });

  it("validates escalateAlertSchema with target roles", () => {
    expect(
      escalateAlertSchema.parse({ targetRole: "SALES_DIRECTOR" }).targetRole,
    ).toBe("SALES_DIRECTOR");
    expect(
      escalateAlertSchema.parse({}).targetRole,
    ).toBe("VP_SALES");
    expect(() =>
      escalateAlertSchema.parse({ targetRole: "" }),
    ).toThrow();
  });

  it("validates salesReportQuerySchema and salesAnalyticsQuerySchema with optional filters", () => {
    const query = salesReportQuerySchema.parse({
      startDate: "2026-01-01",
      endDate: "2026-03-31",
      status: "APPROVED",
    });
    expect(query.startDate).toBe("2026-01-01");
    expect(query.status).toBe("APPROVED");

    const analyticsQuery = salesAnalyticsQuerySchema.parse({
      category: "HARDWARE",
    });
    expect(analyticsQuery.category).toBe("HARDWARE");
  });

  it("validates exportSalesReportQuerySchema", () => {
    const query = exportSalesReportQuerySchema.parse({
      format: "csv",
      category: "HARDWARE",
    });
    expect(query.format).toBe("csv");
    expect(query.category).toBe("HARDWARE");
  });
});

describe("Billing Validators", () => {
  it("validates recordPaymentSchema with various payment methods", () => {
    expect(
      recordPaymentSchema.parse({
        amount: 5000,
        paymentMethod: "UPI",
      }).paymentMethod,
    ).toBe("UPI");
    expect(
      recordPaymentSchema.parse({
        amount: 25000,
        paymentMethod: "RTGS",
      }).paymentMethod,
    ).toBe("RTGS");
    expect(() =>
      recordPaymentSchema.parse({
        amount: -10,
        paymentMethod: "CASH",
      }),
    ).toThrow();
  });

  it("validates modifySeatsSchema", () => {
    expect(modifySeatsSchema.parse({ newSeatCount: 25 }).newSeatCount).toBe(25);
    expect(() => modifySeatsSchema.parse({ newSeatCount: 0 })).toThrow();
  });

  it("validates invoiceIdParamSchema, contractIdParamSchema and billingIdParamSchema", () => {
    expect(invoiceIdParamSchema.parse({ invoiceId: "inv-1" }).invoiceId).toBe("inv-1");
    expect(contractIdParamSchema.parse({ contractId: "cnt-1" }).contractId).toBe("cnt-1");
    expect(billingIdParamSchema.parse({ id: "bil-1" }).id).toBe("bil-1");
  });

  it("validates listInvoicesQuerySchema with defaults", () => {
    const query = listInvoicesQuerySchema.parse({ status: "ISSUED" });
    expect(query.status).toBe("ISSUED");
    expect(query.page).toBe(1);
    expect(query.limit).toBe(20);
  });

  it("validates exportInvoicesQuerySchema with defaults", () => {
    const query = exportInvoicesQuerySchema.parse({ format: "csv" });
    expect(query.format).toBe("csv");
  });
});

describe("Fulfillment Validators", () => {
  it("validates replenishStockSchema", () => {
    const valid = {
      productId: "prod-1",
      quantityAdded: 50,
    };
    const parsed = replenishStockSchema.parse(valid);
    expect(parsed.quantityAdded).toBe(50);
    expect(() =>
      replenishStockSchema.parse({ productId: "prod-1", quantityAdded: 0 }),
    ).toThrow();
  });

  it("validates confirmFulfillmentSchema with overrides", () => {
    const valid = {
      overrides: [
        {
          quotationLineId: "ql-1",
          warehouseId: "wh-1",
          quantityAllocated: 5,
          quantityBackordered: 0,
        },
      ],
    };
    const parsed = confirmFulfillmentSchema.parse(valid);
    expect(parsed.overrides).toHaveLength(1);
  });

  it("validates warehouseIdParamSchema and fulfillmentQuoteIdParamSchema", () => {
    expect(warehouseIdParamSchema.parse({ warehouseId: "wh-1" }).warehouseId).toBe("wh-1");
    expect(() => warehouseIdParamSchema.parse({ warehouseId: "" })).toThrow();
    expect(fulfillmentQuoteIdParamSchema.parse({ id: "q-1" }).id).toBe("q-1");
  });
});

describe("Portal Validators", () => {
  it("validates addPortalCommentSchema", () => {
    expect(
      addPortalCommentSchema.parse({
        authorName: "Kunal Shah",
        comment: "Can we get 2% more discount?",
      }).comment,
    ).toBe("Can we get 2% more discount?");
    expect(() =>
      addPortalCommentSchema.parse({ authorName: "Kunal", comment: "" }),
    ).toThrow();
  });

  it("validates submitCounterOfferSchema", () => {
    const valid = {
      authorName: "Kunal Shah",
      proposedDiscounts: [
        {
          lineId: "line-1",
          counterDiscountPercent: 12,
        },
      ],
      comment: "Target budget requirement",
    };
    const parsed = submitCounterOfferSchema.parse(valid);
    expect(parsed.proposedDiscounts[0]?.counterDiscountPercent).toBe(12);
    expect(() =>
      submitCounterOfferSchema.parse({
        authorName: "Kunal",
        proposedDiscounts: [
          {
            lineId: "line-1",
            counterDiscountPercent: 120,
          },
        ],
      }),
    ).toThrow();
  });

  it("validates confirmPortalQuoteSchema", () => {
    const parsed = confirmPortalQuoteSchema.parse({ customerSignature: "Kunal Shah" });
    expect(parsed.customerSignature).toBe("Kunal Shah");
  });

  it("validates requestMagicLinkSchema", () => {
    expect(
      requestMagicLinkSchema.parse({ email: "buyer@domain.com" }).email,
    ).toBe("buyer@domain.com");
    expect(() =>
      requestMagicLinkSchema.parse({ email: "invalid-email" }),
    ).toThrow();
  });

  it("validates portalTokenParamSchema and sendPortalLinkSchema", () => {
    expect(portalTokenParamSchema.parse({ token: "tok-abc" }).token).toBe("tok-abc");
    expect(() => portalTokenParamSchema.parse({ token: "" })).toThrow();
    expect(sendPortalLinkSchema.parse({ recipientEmail: "test@example.com" }).recipientEmail).toBe("test@example.com");
  });
});

