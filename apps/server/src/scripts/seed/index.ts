import { auth } from "@DealFlow360/auth";
import prisma, { CustomerTier, ProductCategory } from "@DealFlow360/db";
import { GUJARAT_WAREHOUSES } from "./data/warehouses.data.js";
import { GUJARAT_USERS } from "./data/users.data.js";
import { GUJARAT_CUSTOMERS } from "./data/customers.data.js";
import {
  GUJARAT_PRODUCTS,
  GUJARAT_PRODUCT_VARIANTS,
  GUJARAT_UPSELL_RULES,
} from "./data/products.data.js";
import { generateSubscriptions } from "./generators/subscriptions.generator.js";
import { generateQuotations } from "./generators/quotes.generator.js";
import { generateInvoices } from "./generators/invoices.generator.js";

export async function runSeed(): Promise<void> {
  const startTime = Date.now();
  console.log("==========================================================");
  console.log("DealFlow360 Enterprise Database Reset & Gujarat INR Seeder");
  console.log("==========================================================");

  // 1. Clean Database Reset in reverse foreign key order
  console.log("\n[1/7] Wiping existing data (clean reset)...");
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
  console.log("All tables cleaned successfully.");

  // 2. Base Governance Configurations
  console.log("\n[2/7] Seeding Tier Configurations & Category Discount Ceilings...");
  await prisma.customerTierConfig.createMany({
    data: [
      {
        tier: CustomerTier.BRONZE,
        defaultDiscountCeiling: 5.0,
        description: "Standard Bronze tier - max 5% discount without manager sign-off",
      },
      {
        tier: CustomerTier.SILVER,
        defaultDiscountCeiling: 10.0,
        description: "Silver tier - max 10% discount without manager sign-off",
      },
      {
        tier: CustomerTier.GOLD,
        defaultDiscountCeiling: 15.0,
        description: "VIP Gold tier - max 15% discount without executive sign-off",
      },
    ],
  });

  await prisma.categoryDiscountCeiling.createMany({
    data: [
      {
        category: ProductCategory.HARDWARE,
        maxDiscountCeiling: 15.0,
        description: "Hardware items - 15% ceiling due to gross margin constraints",
      },
      {
        category: ProductCategory.SERVICE,
        maxDiscountCeiling: 10.0,
        description: "Professional Services - 10% ceiling due to manpower delivery costs",
      },
      {
        category: ProductCategory.SUBSCRIPTION,
        maxDiscountCeiling: 12.0,
        description: "Recurring SaaS licenses - 12% ceiling",
      },
    ],
  });

  // 3. Organization & 40 Users
  console.log("\n[3/7] Seeding DealFlow360 Enterprise Org & 40 Users...");
  const org = await prisma.organization.create({
    data: {
      id: "org_dealflow_01",
      name: "DealFlow360 Enterprise Org (Gujarat Hub)",
      slug: "dealflow360-enterprise",
    },
  });

  // Create first user with Better Auth to generate standard password hash for 'Password123!'
  const firstUserSpec = GUJARAT_USERS[0]!;
  let standardHashedPassword = "";

  try {
    const authRes = await auth.api.signUpEmail({
      body: {
        email: firstUserSpec.email,
        password: "Password123!",
        name: firstUserSpec.name,
      },
    });
    if (authRes?.user) {
      const createdAcc = await prisma.account.findFirst({
        where: { userId: (authRes.user as any).id },
      });
      if (createdAcc?.password) {
        standardHashedPassword = createdAcc.password;
      }
    }
  } catch (err) {
    console.warn("First user auth signup notice:", err);
  }

  // Populate all 40 users
  for (const u of GUJARAT_USERS) {
    let userRecord = await prisma.user.findUnique({ where: { email: u.email } });
    if (!userRecord) {
      userRecord = await prisma.user.create({
        data: {
          id: u.id,
          email: u.email,
          name: u.name,
          emailVerified: true,
        },
      });

      if (standardHashedPassword) {
        await prisma.account.create({
          data: {
            id: `acc_${userRecord.id}`,
            userId: userRecord.id,
            accountId: userRecord.id,
            providerId: "credential",
            password: standardHashedPassword,
          },
        });
      }
    } else {
      await prisma.user.update({
        where: { id: userRecord.id },
        data: { emailVerified: true },
      });
    }

    // Member association
    await prisma.member.create({
      data: {
        id: `mem_${userRecord.id}`,
        organizationId: org.id,
        userId: userRecord.id,
        role: u.role,
      },
    });

    // Session token (deterministic for demo users)
    const sessionToken = u.isDemo ? `dev_${u.role}_token` : `sess_token_${userRecord.id}`;
    await prisma.session.create({
      data: {
        id: `sess_${userRecord.id}`,
        userId: userRecord.id,
        token: sessionToken,
        activeOrganizationId: org.id,
        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
      },
    });
  }
  console.log(`40 Users created. All accounts configured with password 'Password123!'.`);

  // 4. Customers (120 Gujarat Enterprises)
  console.log("\n[4/7] Seeding 120 Gujarat Enterprise Customers across Gold, Silver, Bronze...");
  await prisma.customer.createMany({
    data: GUJARAT_CUSTOMERS,
  });

  // 5. Warehouses, Products, Variants, Upsell Rules & Warehouse Stock
  console.log("\n[5/7] Seeding 5 Gujarat Warehouses, 60 Products, 15 Variants, 12 Upsell Rules...");
  for (const wh of GUJARAT_WAREHOUSES) {
    await prisma.warehouse.create({ data: wh });
  }

  await prisma.product.createMany({
    data: GUJARAT_PRODUCTS,
  });

  await prisma.productVariant.createMany({
    data: GUJARAT_PRODUCT_VARIANTS,
  });

  await prisma.upsellRule.createMany({
    data: GUJARAT_UPSELL_RULES,
  });

  // Generate Warehouse Stocks for all hardware products across the 5 warehouses
  const hardwareProducts = GUJARAT_PRODUCTS.filter((p) => p.category === ProductCategory.HARDWARE);
  const stockEntries: any[] = [];

  for (const prod of hardwareProducts) {
    const prodVariants = GUJARAT_PRODUCT_VARIANTS.filter((v) => v.productId === prod.id);

    for (let w = 0; w < GUJARAT_WAREHOUSES.length; w++) {
      const wh = GUJARAT_WAREHOUSES[w]!;

      if (prodVariants.length > 0) {
        for (const v of prodVariants) {
          stockEntries.push({
            id: `stk_${wh.id}_${prod.id}_${v.id}`,
            warehouseId: wh.id,
            productId: prod.id,
            variantId: v.id,
            quantityOnHand: 15 + ((w * 13 + prod.basePrice) % 85),
            reservedQuantity: (w * 3) % 12,
            reorderThreshold: 5,
          });
        }
      } else {
        stockEntries.push({
          id: `stk_${wh.id}_${prod.id}`,
          warehouseId: wh.id,
          productId: prod.id,
          variantId: null,
          quantityOnHand: 25 + ((w * 17 + prod.basePrice) % 110),
          reservedQuantity: (w * 4) % 18,
          reorderThreshold: 8,
        });
      }
    }
  }

  await prisma.warehouseStock.createMany({ data: stockEntries });
  console.log(`Created ${stockEntries.length} Warehouse Stock inventory allocations.`);

  // 6. Subscriptions
  console.log("\n[6/7] Generating Subscriptions and Contracts...");
  const subResult = await generateSubscriptions();

  // 7. Quotations & Invoices
  console.log("\n[7/7] Generating 520 Quotations and 320 Invoices in INR...");
  const quoteResult = await generateQuotations(subResult.plans.map((p) => p.id));
  await generateInvoices(quoteResult.quoteIds, subResult.contractIds);

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);

  // Verification Counts
  const [
    userCount,
    customerCount,
    productCount,
    warehouseCount,
    stockCount,
    quoteCount,
    quoteLineCount,
    invoiceCount,
    invoiceLineCount,
    paymentCount,
    auditCount,
    alertCount,
    contractCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.customer.count(),
    prisma.product.count(),
    prisma.warehouse.count(),
    prisma.warehouseStock.count(),
    prisma.quotation.count(),
    prisma.quotationLine.count(),
    prisma.invoice.count(),
    prisma.invoiceLine.count(),
    prisma.paymentRecord.count(),
    prisma.approvalAuditLog.count(),
    prisma.dealAnomalyAlert.count(),
    prisma.subscriptionContract.count(),
  ]);

  const totalRecords =
    userCount +
    customerCount +
    productCount +
    warehouseCount +
    stockCount +
    quoteCount +
    quoteLineCount +
    invoiceCount +
    invoiceLineCount +
    paymentCount +
    auditCount +
    alertCount +
    contractCount;

  console.log("\n==========================================================");
  console.log(`SEEDING COMPLETED SUCCESSFULLY IN ${durationSec}s`);
  console.log("==========================================================");
  console.log(`- Users:                      ${userCount}`);
  console.log(`- Customers (Gujarat):        ${customerCount}`);
  console.log(`- Products (INR):             ${productCount}`);
  console.log(`- Warehouses (Gujarat Hubs):  ${warehouseCount}`);
  console.log(`- Warehouse Stock Records:    ${stockCount}`);
  console.log(`- Quotations:                 ${quoteCount}`);
  console.log(`- Quotation Line Items:       ${quoteLineCount}`);
  console.log(`- Invoices (INR):             ${invoiceCount}`);
  console.log(`- Invoice Line Items:         ${invoiceLineCount}`);
  console.log(`- Payment Records:            ${paymentCount}`);
  console.log(`- Approval Audit Logs:        ${auditCount}`);
  console.log(`- Deal Anomaly Alerts:        ${alertCount}`);
  console.log(`- Subscription Contracts:     ${contractCount}`);
  console.log(`----------------------------------------------------------`);
  console.log(`TOTAL DATABASE RECORDS:       ${totalRecords}+ rows`);
  console.log("==========================================================");
}
