import { auth } from "@DealFlow360/auth";
import prisma, {
  CustomerTier,
  ProductCategory,
  QuotationStatus,
  ApprovalLevel,
  BillingInterval,
  AnomalyType,
  AnomalySeverity,
} from "@DealFlow360/db";

async function main() {
  await prisma.dealAnomalyAlert.deleteMany();
  await prisma.negotiationComment.deleteMany();
  await prisma.approvalAuditLog.deleteMany();
  await prisma.fulfillmentSplit.deleteMany();
  await prisma.paymentRecord.deleteMany();
  await prisma.invoiceLine.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.subscriptionBillingSchedule.deleteMany();
  await prisma.subscriptionContract.deleteMany();
  await prisma.quotationLine.deleteMany();
  await prisma.quotation.deleteMany();
  await prisma.upsellRule.deleteMany();
  await prisma.warehouseStock.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.subscriptionPlan.deleteMany();
  await prisma.categoryDiscountCeiling.deleteMany();
  await prisma.customerTierConfig.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.member.deleteMany();
  await prisma.invitation.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.user.deleteMany();

  await prisma.customerTierConfig.createMany({
    data: [
      {
        tier: CustomerTier.BRONZE,
        defaultDiscountCeiling: 5.0,
        description: "Standard Bronze tier - max 5% discount without manager approval",
      },
      {
        tier: CustomerTier.SILVER,
        defaultDiscountCeiling: 10.0,
        description: "Silver tier - max 10% discount without manager approval",
      },
      {
        tier: CustomerTier.GOLD,
        defaultDiscountCeiling: 15.0,
        description: "VIP Gold tier - max 15% discount without manager approval",
      },
    ],
  });

  await prisma.categoryDiscountCeiling.createMany({
    data: [
      {
        category: ProductCategory.HARDWARE,
        maxDiscountCeiling: 15.0,
        description: "Hardware items - 15% ceiling due to healthy gross margins",
      },
      {
        category: ProductCategory.SERVICE,
        maxDiscountCeiling: 10.0,
        description: "Professional Services - 10% ceiling due to tight delivery margins",
      },
      {
        category: ProductCategory.SUBSCRIPTION,
        maxDiscountCeiling: 12.0,
        description: "Recurring SaaS licenses - 12% ceiling",
      },
    ],
  });

  const usersToSeed = [
    { email: "rep@dealflow360.com", name: "Alice Rep", role: "rep" },
    { email: "manager@dealflow360.com", name: "Marcus Manager", role: "manager" },
    { email: "finance@dealflow360.com", name: "Fiona Finance", role: "finance" },
    { email: "admin@dealflow360.com", name: "Arthur Admin", role: "admin" },
  ];

  let org = await prisma.organization.findFirst({
    where: { slug: "dealflow360-enterprise" },
  });

  if (!org) {
    org = await prisma.organization.create({
      data: {
        id: "org_dealflow_01",
        name: "DealFlow360 Enterprise Org",
        slug: "dealflow360-enterprise",
      },
    });
  }

  const seededUserMap: Record<string, string> = {};

  for (const u of usersToSeed) {
    let existingUser = await prisma.user.findUnique({
      where: { email: u.email },
    });

    if (!existingUser) {
      try {
        const authRes = await auth.api.signUpEmail({
          body: {
            email: u.email,
            password: "Password123!",
            name: u.name,
          },
        });
        if (authRes?.user) {
          existingUser = authRes.user as unknown as typeof existingUser;
        }
      } catch {
        existingUser = await prisma.user.findUnique({ where: { email: u.email } });
      }
    }

    if (existingUser) {
      seededUserMap[u.role] = existingUser.id;

      await prisma.user.update({
        where: { id: existingUser.id },
        data: { emailVerified: true },
      });

      const member = await prisma.member.findFirst({
        where: { organizationId: org.id, userId: existingUser.id },
      });
      if (!member) {
        await prisma.member.create({
          data: {
            id: `mem_${existingUser.id}`,
            organizationId: org.id,
            userId: existingUser.id,
            role: u.role,
          },
        });
      }

      await prisma.session.create({
        data: {
          id: `sess_${existingUser.id}`,
          userId: existingUser.id,
          token: `dev_${u.role}_token`,
          activeOrganizationId: org.id,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
    }
  }

  const acme = await prisma.customer.create({
    data: {
      id: "cust_acme_01",
      name: "Acme Technologies",
      contactName: "Alice Johnson",
      email: "alice@acmetech.io",
      phone: "+1 (555) 019-2831",
      address: "100 Innovation Way, Suite 400, Austin, TX",
      tier: CustomerTier.GOLD,
      historicalAvgDiscount: 8.5,
      portalAccessToken: "portal_token_acme_01",
    },
  });

  const beta = await prisma.customer.create({
    data: {
      id: "cust_beta_02",
      name: "Beta Industries",
      contactName: "Bob Smith",
      email: "bob@betaind.com",
      phone: "+1 (555) 014-9922",
      address: "450 Industrial Parkway, Detroit, MI",
      tier: CustomerTier.SILVER,
      historicalAvgDiscount: 6.0,
      portalAccessToken: "portal_token_beta_02",
    },
  });

  await prisma.customer.create({
    data: {
      id: "cust_startup_03",
      name: "StartupX Labs",
      contactName: "Charlie Davis",
      email: "charlie@startupx.co",
      phone: "+1 (555) 018-7744",
      address: "710 Founders Blvd, San Francisco, CA",
      tier: CustomerTier.BRONZE,
      historicalAvgDiscount: 4.0,
      portalAccessToken: "portal_token_startup_03",
    },
  });

  const mainWh = await prisma.warehouse.create({
    data: {
      id: "wh_main_01",
      code: "WH-CHI",
      name: "Main Warehouse (Chicago)",
      location: "Chicago, IL",
      shippingCostWeight: 1.0,
      isPrimary: true,
    },
  });

  const eastWh = await prisma.warehouse.create({
    data: {
      id: "wh_east_02",
      code: "WH-NYC",
      name: "East Depot (New York)",
      location: "New York, NY",
      shippingCostWeight: 1.5,
      isPrimary: false,
    },
  });

  const laptop = await prisma.product.create({
    data: {
      id: "prod_laptop_01",
      sku: "HW-LAPTOP-PRO",
      name: "Enterprise Pro Laptop 16\"",
      description: "32GB RAM, 1TB SSD High Performance Workstation",
      category: ProductCategory.HARDWARE,
      unit: "unit",
      costPrice: 1200.00,
      basePrice: 1800.00,
      taxRate: 10.0,
      isPromoted: true,
      minMarginThreshold: 20.0,
    },
  });

  const laptopV16 = await prisma.productVariant.create({
    data: {
      id: "var_laptop_16",
      productId: laptop.id,
      attribute: "Display Size",
      value: "16-inch 4K OLED",
      extraPrice: 0.0,
    },
  });

  await prisma.productVariant.create({
    data: {
      id: "var_laptop_14",
      productId: laptop.id,
      attribute: "Display Size",
      value: "14-inch QHD",
      extraPrice: -100.0,
    },
  });

  await prisma.warehouseStock.createMany({
    data: [
      {
        warehouseId: mainWh.id,
        productId: laptop.id,
        variantId: laptopV16.id,
        quantityOnHand: 10,
        reservedQuantity: 0,
        reorderThreshold: 3,
      },
      {
        warehouseId: eastWh.id,
        productId: laptop.id,
        variantId: laptopV16.id,
        quantityOnHand: 5,
        reservedQuantity: 0,
        reorderThreshold: 2,
      },
    ],
  });

  const dock = await prisma.product.create({
    data: {
      id: "prod_dock_02",
      sku: "HW-DOCK-THUNDER",
      name: "Thunderbolt 4 Quad-Display Dock",
      description: "Dual 4K 144Hz support with 100W Power Delivery and Ethernet",
      category: ProductCategory.HARDWARE,
      unit: "unit",
      costPrice: 120.00,
      basePrice: 250.00,
      taxRate: 10.0,
      isPromoted: true,
      minMarginThreshold: 30.0,
    },
  });

  await prisma.warehouseStock.createMany({
    data: [
      {
        warehouseId: mainWh.id,
        productId: dock.id,
        quantityOnHand: 25,
        reservedQuantity: 0,
        reorderThreshold: 5,
      },
      {
        warehouseId: eastWh.id,
        productId: dock.id,
        quantityOnHand: 15,
        reservedQuantity: 0,
        reorderThreshold: 5,
      },
    ],
  });

  const service = await prisma.product.create({
    data: {
      id: "prod_service_01",
      sku: "SRV-SETUP-ONBOARD",
      name: "Enterprise Onboarding & Migration Service",
      description: "Dedicated deployment engineer 2-week white-glove setup",
      category: ProductCategory.SERVICE,
      unit: "package",
      costPrice: 1600.00,
      basePrice: 2000.00,
      taxRate: 10.0,
      isPromoted: false,
      minMarginThreshold: 15.0,
    },
  });

  const sub = await prisma.product.create({
    data: {
      id: "prod_sub_01",
      sku: "SUB-SAAS-PLATFORM",
      name: "DealFlow Cloud Platform License",
      description: "Per-user monthly enterprise platform subscription with 99.9% SLA",
      category: ProductCategory.SUBSCRIPTION,
      unit: "seat/month",
      costPrice: 15.00,
      basePrice: 60.00,
      taxRate: 10.0,
      isPromoted: true,
      minMarginThreshold: 40.0,
    },
  });

  await prisma.upsellRule.create({
    data: {
      id: "rule_laptop_dock",
      sourceProductId: laptop.id,
      suggestedProductId: dock.id,
      pairingWeight: 0.95,
      promotionTag: "Hardware Pairing Bundle (+3.4% Margin)",
    },
  });

  const monthlyPlan = await prisma.subscriptionPlan.create({
    data: {
      id: "plan_monthly_01",
      name: "DealFlow Cloud Platform (Monthly)",
      code: "PLAN-MONTHLY",
      interval: BillingInterval.MONTHLY,
      unitPrice: 60.00,
      prorationMethod: "DAILY",
      cancellationRefundPolicy: "PRO_RATA_CREDIT",
    },
  });

  await prisma.subscriptionPlan.create({
    data: {
      id: "plan_annual_02",
      name: "DealFlow Cloud Platform (Annual)",
      code: "PLAN-ANNUAL",
      interval: BillingInterval.YEARLY,
      unitPrice: 600.00,
      prorationMethod: "DAILY",
      cancellationRefundPolicy: "30_DAY_MONEY_BACK",
    },
  });

  const stalledQuote = await prisma.quotation.create({
    data: {
      id: "quote_stalled_19",
      quoteNumber: "QT-2026-0019",
      customerId: beta.id,
      repUserId: seededUserMap.rep ?? null,
      status: QuotationStatus.DRAFT,
      totalAmount: 18000.00,
      totalCost: 12000.00,
      totalMarginPercent: 33.33,
      blendedRiskScore: 0,
      requiredApprovalLevel: ApprovalLevel.NONE,
      notes: "Annual hardware workstation expansion for engineering team",
      portalAccessToken: "portal_token_beta_stalled",
      updatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.dealAnomalyAlert.create({
    data: {
      id: "alert_stalled_19",
      quotationId: stalledQuote.id,
      type: AnomalyType.STALLED_DEAL,
      severity: AnomalySeverity.MEDIUM,
      message: "Quotation has been in DRAFT with no customer interaction for 6 days",
      metricDelta: 6.0,
    },
  });

  const anomalyQuote = await prisma.quotation.create({
    data: {
      id: "quote_anomaly_33",
      quoteNumber: "QT-2026-0033",
      customerId: acme.id,
      repUserId: seededUserMap.rep ?? null,
      status: QuotationStatus.PENDING_APPROVAL,
      totalAmount: 11140.00,
      totalCost: 7600.00,
      totalMarginPercent: 31.78,
      blendedRiskScore: 14.5,
      requiredApprovalLevel: ApprovalLevel.FINANCE,
      currentApprovalStep: "SALES_MANAGER",
      notes: "Aggressive discount offered to close Q1 key deal",
      portalAccessToken: "portal_token_acme_anomaly",
    },
  });

  await prisma.quotationLine.createMany({
    data: [
      {
        quotationId: anomalyQuote.id,
        productId: laptop.id,
        variantId: laptopV16.id,
        quantity: 5,
        unitPrice: 1800.00,
        unitCost: 1200.00,
        discountPercent: 12.0,
        effectivePrice: 1584.00,
        subtotal: 7920.00,
        totalCost: 6000.00,
        marginPercent: 24.24,
        categoryCeilingPercent: 15.0,
        lineExcessPercent: 0.0,
      },
      {
        quotationId: anomalyQuote.id,
        productId: service.id,
        quantity: 1,
        unitPrice: 2000.00,
        unitCost: 1600.00,
        discountPercent: 22.0,
        effectivePrice: 1560.00,
        subtotal: 1560.00,
        totalCost: 1600.00,
        marginPercent: -2.56,
        categoryCeilingPercent: 10.0,
        lineExcessPercent: 12.0,
      },
      {
        quotationId: anomalyQuote.id,
        productId: sub.id,
        subscriptionPlanId: monthlyPlan.id,
        quantity: 30,
        unitPrice: 60.00,
        unitCost: 15.00,
        discountPercent: 7.5,
        effectivePrice: 55.50,
        subtotal: 1665.00,
        totalCost: 450.00,
        marginPercent: 72.97,
        categoryCeilingPercent: 12.0,
        lineExcessPercent: 0.0,
      },
    ],
  });

  await prisma.dealAnomalyAlert.create({
    data: {
      id: "alert_discount_33",
      quotationId: anomalyQuote.id,
      type: AnomalyType.DISCOUNT_ANOMALY,
      severity: AnomalySeverity.HIGH,
      message: "Quotation line discount (22.0%) is +13.5% above Alice's historical average (8.5%)",
      metricDelta: 13.5,
    },
  });

  await prisma.approvalAuditLog.create({
    data: {
      quotationId: anomalyQuote.id,
      action: "SUBMIT",
      actorName: "Alice Rep",
      actorRole: "rep",
      blendedRiskScore: 14.5,
      reason: "Submitted quote for discount approval. Blended Risk: 14.5 (Finance required).",
    },
  });

  console.log("Database seed completed");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
