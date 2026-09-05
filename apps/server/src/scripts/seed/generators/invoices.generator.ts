import prisma, { InvoiceType, InvoiceStatus } from "@DealFlow360/db";
import { GUJARAT_CUSTOMERS } from "../data/customers.data.js";

export async function generateInvoices(quoteIds: string[], contractIds: string[]): Promise<void> {
  console.log("-> Generating 320 Enterprise Invoices and Billing Records in INR...");

  const TOTAL_INVOICES = 320;
  const invoicesToCreate: Array<{
    id: string;
    invoiceNumber: string;
    customerId: string;
    quotationId: string | null;
    contractId: string | null;
    type: InvoiceType;
    status: InvoiceStatus;
    amount: number;
    dueDate: Date;
    paidAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }> = [];

  const linesToCreate: Array<{
    id: string;
    invoiceId: string;
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
    createdAt: Date;
  }> = [];

  const paymentsToCreate: Array<{
    id: string;
    invoiceId: string;
    amount: number;
    paymentMethod: string;
    reference: string;
    paidAt: Date;
  }> = [];

  const now = Date.now();
  const paymentMethods = [
    "RTGS Transfer (HDFC Bank)",
    "NEFT Clearance (ICICI Corporate)",
    "Corporate NetBanking (State Bank of India)",
    "IMPS Corporate Gateway",
    "Axis Corporate Direct",
    "UPI Merchant Collect",
  ];

  for (let i = 1; i <= TOTAL_INVOICES; i++) {
    const invId = `inv_2026_${String(i).padStart(4, "0")}`;
    const invoiceNumber = `INV-2026-${String(i).padStart(4, "0")}`;

    const customer = GUJARAT_CUSTOMERS[(i * 13) % GUJARAT_CUSTOMERS.length]!;
    const linkedQuoteId = quoteIds.length > 0 && i % 2 === 0 ? quoteIds[i % quoteIds.length] ?? null : null;
    const linkedContractId = contractIds.length > 0 && i % 3 === 0 ? contractIds[i % contractIds.length] ?? null : null;

    let status: InvoiceStatus;
    let daysAgoIssued = 0;
    let dueDate: Date;
    let paidAt: Date | null = null;

    if (i <= 170) {
      status = InvoiceStatus.PAID;
      daysAgoIssued = 15 + ((TOTAL_INVOICES - i) % 80);
      const createdTime = now - daysAgoIssued * 24 * 60 * 60 * 1000;
      dueDate = new Date(createdTime + 30 * 24 * 60 * 60 * 1000);
      paidAt = new Date(createdTime + (5 + (i % 20)) * 24 * 60 * 60 * 1000);
    } else if (i <= 275) {
      status = InvoiceStatus.ISSUED;
      const isOverdue = i <= 210;
      if (isOverdue) {
        daysAgoIssued = 45 + (i % 30);
        const createdTime = now - daysAgoIssued * 24 * 60 * 60 * 1000;
        dueDate = new Date(createdTime + 30 * 24 * 60 * 60 * 1000);
      } else {
        daysAgoIssued = 5 + (i % 20);
        const createdTime = now - daysAgoIssued * 24 * 60 * 60 * 1000;
        dueDate = new Date(createdTime + 30 * 24 * 60 * 60 * 1000);
      }
    } else if (i <= 305) {
      status = InvoiceStatus.DRAFT;
      daysAgoIssued = 2 + (i % 5);
      const createdTime = now - daysAgoIssued * 24 * 60 * 60 * 1000;
      dueDate = new Date(createdTime + 30 * 24 * 60 * 60 * 1000);
    } else {
      status = InvoiceStatus.CANCELLED;
      daysAgoIssued = 20 + (i % 40);
      const createdTime = now - daysAgoIssued * 24 * 60 * 60 * 1000;
      dueDate = new Date(createdTime + 30 * 24 * 60 * 60 * 1000);
    }

    const createdAt = new Date(now - daysAgoIssued * 24 * 60 * 60 * 1000);
    const updatedAt = paidAt || new Date(createdAt.getTime() + 12 * 60 * 60 * 1000);

    let type: InvoiceType;
    if (i <= 200) {
      type = InvoiceType.ONE_TIME;
    } else if (i <= 280) {
      type = InvoiceType.RECURRING;
    } else if (i <= 305) {
      type = InvoiceType.PRORATED_SUPPLEMENTAL;
    } else {
      type = InvoiceType.CREDIT_NOTE;
    }

    const lineCount = 1 + (i % 3);
    let invoiceTotal = 0;

    for (let l = 1; l <= lineCount; l++) {
      const lineId = `invl_${invId}_${l}`;
      let lineDesc = "";
      let lineQty = 1;
      let lineUnitPrice = 50000;

      if (type === InvoiceType.RECURRING) {
        lineDesc = `DealFlow360 SaaS Enterprise Subscription Seats - Month ${1 + (i % 12)} / 2026`;
        lineQty = 10 + ((i * 5) % 50);
        lineUnitPrice = 3800;
      } else if (type === InvoiceType.CREDIT_NOTE) {
        lineDesc = `SLA Credit Adjustment & Hardware Return Allowance - ${customer.name}`;
        lineQty = 1;
        lineUnitPrice = -(15000 + ((i * 3000) % 75000));
      } else if (type === InvoiceType.PRORATED_SUPPLEMENTAL) {
        lineDesc = `Mid-Period Hardware Seat Expansion (Prorated 18 Days) - Gujarat Hub`;
        lineQty = 4 + (i % 10);
        lineUnitPrice = 18500;
      } else {
        const itemVariants = [
          "Enterprise Workstation Hardware Supply & Deployment (Changodar Hub)",
          "Data Center 100GbE Switching Infrastructure (GIFT City SEZ)",
          "On-Premises Hybrid Cloud Migration Milestone Sign-off",
          "Dedicated Enterprise 24/7 Support Contract (Q1-Q2)",
          "Industrial Edge AI Computer Vision Compute Units (Sanand)",
        ];
        lineDesc = itemVariants[(i + l) % itemVariants.length]!;
        lineQty = 1 + ((i + l) % 5);
        lineUnitPrice = 85000 + ((i * 12500) % 250000);
      }

      const lineAmount = lineQty * lineUnitPrice;
      invoiceTotal += lineAmount;

      linesToCreate.push({
        id: lineId,
        invoiceId: invId,
        description: lineDesc,
        quantity: lineQty,
        unitPrice: lineUnitPrice,
        amount: lineAmount,
        createdAt,
      });
    }

    invoicesToCreate.push({
      id: invId,
      invoiceNumber,
      customerId: customer.id,
      quotationId: linkedQuoteId,
      contractId: linkedContractId,
      type,
      status,
      amount: invoiceTotal,
      dueDate,
      paidAt,
      createdAt,
      updatedAt,
    });

    if (status === InvoiceStatus.PAID && paidAt) {
      paymentsToCreate.push({
        id: `pay_${invId}`,
        invoiceId: invId,
        amount: invoiceTotal,
        paymentMethod: paymentMethods[i % paymentMethods.length]!,
        reference: `UTR-IN-2026-${String(84920000 + i * 142).padStart(12, "0")}`,
        paidAt,
      });
    }
  }

  console.log(`-> Inserting ${invoicesToCreate.length} Invoice records...`);
  const chunkSize = 100;
  for (let c = 0; c < invoicesToCreate.length; c += chunkSize) {
    await prisma.invoice.createMany({
      data: invoicesToCreate.slice(c, c + chunkSize),
    });
  }

  console.log(`-> Inserting ${linesToCreate.length} Invoice Line records...`);
  for (let c = 0; c < linesToCreate.length; c += chunkSize) {
    await prisma.invoiceLine.createMany({
      data: linesToCreate.slice(c, c + chunkSize),
    });
  }

  console.log(`-> Inserting ${paymentsToCreate.length} Payment Records...`);
  for (let c = 0; c < paymentsToCreate.length; c += chunkSize) {
    await prisma.paymentRecord.createMany({
      data: paymentsToCreate.slice(c, c + chunkSize),
    });
  }
}
