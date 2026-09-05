import prisma, {
  Prisma,
  ProductCategory,
  InvoiceType,
  InvoiceStatus,
  BillingInterval,
} from "@DealFlow360/db";
import { NotFoundError, ValidationError } from "../utils/errors";
import { getPaginationParams, buildPaginationMeta } from "../utils/pagination";

export async function generateOrderInvoicesAndSubscriptions(quoteId: string) {
  const quote = await prisma.quotation.findUnique({
    where: { id: quoteId },
    include: {
      customer: true,
      lines: {
        include: {
          product: true,
          subscriptionPlan: true,
        },
      },
    },
  });

  if (!quote) {
    throw new NotFoundError("Quotation", quoteId);
  }

  const oneTimeLines = quote.lines.filter(
    (line) => line.product.category !== ProductCategory.SUBSCRIPTION,
  );
  const recurringLines = quote.lines.filter(
    (line) => line.product.category === ProductCategory.SUBSCRIPTION,
  );

  return prisma.$transaction(async (tx) => {
    let createdInvoice = null;

    if (oneTimeLines.length > 0) {
      const oneTimeTotal = oneTimeLines.reduce((sum, line) => sum + line.subtotal, 0);
      const invoiceNumber = await generateInvoiceNumber(tx);
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 15);

      createdInvoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          customerId: quote.customerId,
          quotationId: quote.id,
          type: InvoiceType.ONE_TIME,
          status: InvoiceStatus.ISSUED,
          amount: Math.round(oneTimeTotal * 100) / 100,
          dueDate,
          lines: {
            create: oneTimeLines.map((line) => ({
              description: `${line.product.name} (Qty: ${line.quantity}, Disc: ${line.discountPercent}%)`,
              quantity: line.quantity,
              unitPrice: line.effectivePrice,
              amount: line.subtotal,
            })),
          },
        },
        include: { lines: true },
      });
    }

    const createdContracts = [];

    for (const subLine of recurringLines) {
      if (!subLine.subscriptionPlanId) {
        continue;
      }

      const plan = subLine.subscriptionPlan;
      if (!plan) {
        continue;
      }

      const contractNumber = await generateContractNumber(tx);
      const periodStart = new Date();
      const periodEnd = computePeriodEndDate(periodStart, plan.interval);
      const recurringAmount = Math.round(subLine.subtotal * 100) / 100;

      const contract = await tx.subscriptionContract.create({
        data: {
          contractNumber,
          customerId: quote.customerId,
          quotationId: quote.id,
          planId: plan.id,
          seats: subLine.quantity,
          unitPrice: subLine.effectivePrice,
          recurringAmount,
          status: "ACTIVE",
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          schedules: {
            create: [
              {
                billingDate: periodEnd,
                amount: recurringAmount,
                status: "PENDING",
              },
              {
                billingDate: computePeriodEndDate(periodEnd, plan.interval),
                amount: recurringAmount,
                status: "PENDING",
              },
            ],
          },
        },
        include: { schedules: true, plan: true },
      });

      createdContracts.push(contract);
    }

    return {
      invoice: createdInvoice,
      contracts: createdContracts,
    };
  });
}

export async function getQuoteBilling(quoteId: string) {
  const [invoices, contracts] = await Promise.all([
    prisma.invoice.findMany({
      where: { quotationId: quoteId },
      include: {
        lines: true,
        payments: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.subscriptionContract.findMany({
      where: { quotationId: quoteId },
      include: {
        plan: true,
        schedules: { orderBy: { billingDate: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return {
    invoices,
    contracts,
  };
}

export type RecordPaymentInput = {
  invoiceId: string;
  amount: number;
  paymentMethod: string;
  reference?: string;
};

export async function recordInvoicePayment(input: RecordPaymentInput) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: input.invoiceId },
    include: { payments: true },
  });

  if (!invoice) {
    throw new NotFoundError("Invoice", input.invoiceId);
  }

  if (invoice.status === InvoiceStatus.PAID) {
    throw new ValidationError("Invoice is already fully paid.");
  }

  return prisma.$transaction(async (tx) => {
    const payment = await tx.paymentRecord.create({
      data: {
        invoiceId: input.invoiceId,
        amount: input.amount,
        paymentMethod: input.paymentMethod,
        reference: input.reference ?? null,
      },
    });

    const totalPaid =
      invoice.payments.reduce((sum, p) => sum + p.amount, 0) + input.amount;

    const isFullyPaid = totalPaid >= invoice.amount;

    const updatedInvoice = await tx.invoice.update({
      where: { id: input.invoiceId },
      data: {
        status: isFullyPaid ? InvoiceStatus.PAID : InvoiceStatus.ISSUED,
        paidAt: isFullyPaid ? new Date() : null,
      },
      include: {
        lines: true,
        payments: true,
      },
    });

    return {
      payment,
      invoice: updatedInvoice,
    };
  });
}

export async function modifySubscriptionSeats(contractId: string, newSeatCount: number) {
  if (newSeatCount <= 0) {
    throw new ValidationError("Seat count must be at least 1.");
  }

  const contract = await prisma.subscriptionContract.findUnique({
    where: { id: contractId },
    include: { plan: true },
  });

  if (!contract) {
    throw new NotFoundError("SubscriptionContract", contractId);
  }

  if (contract.seats === newSeatCount) {
    return { contract, supplementalInvoice: null };
  }

  const seatDelta = newSeatCount - contract.seats;
  const now = new Date();
  const periodTotalMs = contract.currentPeriodEnd.getTime() - contract.currentPeriodStart.getTime();
  const remainingMs = Math.max(0, contract.currentPeriodEnd.getTime() - now.getTime());
  const prorationRatio = periodTotalMs > 0 ? remainingMs / periodTotalMs : 1;

  return prisma.$transaction(async (tx) => {
    let supplementalInvoice = null;

    if (seatDelta > 0) {
      const fullPeriodAddedAmount = seatDelta * contract.unitPrice;
      const proratedAmount = Math.round(fullPeriodAddedAmount * prorationRatio * 100) / 100;
      const invoiceNumber = await generateInvoiceNumber(tx);

      supplementalInvoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          customerId: contract.customerId,
          contractId: contract.id,
          quotationId: contract.quotationId ?? null,
          type: InvoiceType.PRORATED_SUPPLEMENTAL,
          status: InvoiceStatus.ISSUED,
          amount: proratedAmount,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          lines: {
            create: [
              {
                description: `Prorated addition of ${seatDelta} seat(s) on ${contract.plan.name}`,
                quantity: seatDelta,
                unitPrice: contract.unitPrice,
                amount: proratedAmount,
              },
            ],
          },
        },
        include: { lines: true },
      });
    }

    const newRecurringAmount = Math.round(newSeatCount * contract.unitPrice * 100) / 100;

    const updatedContract = await tx.subscriptionContract.update({
      where: { id: contractId },
      data: {
        seats: newSeatCount,
        recurringAmount: newRecurringAmount,
      },
      include: { plan: true, schedules: true },
    });

    return {
      contract: updatedContract,
      supplementalInvoice,
    };
  });
}

export async function cancelSubscription(contractId: string) {
  const contract = await prisma.subscriptionContract.findUnique({
    where: { id: contractId },
    include: { plan: true },
  });

  if (!contract) {
    throw new NotFoundError("SubscriptionContract", contractId);
  }

  const now = new Date();
  const periodTotalMs = contract.currentPeriodEnd.getTime() - contract.currentPeriodStart.getTime();
  const remainingMs = Math.max(0, contract.currentPeriodEnd.getTime() - now.getTime());
  const prorationRatio = periodTotalMs > 0 ? remainingMs / periodTotalMs : 0;
  const unusedCredit = Math.round(contract.recurringAmount * prorationRatio * 100) / 100;

  return prisma.$transaction(async (tx) => {
    let creditNote = null;

    if (unusedCredit > 0) {
      const invoiceNumber = await generateInvoiceNumber(tx, "CR");

      creditNote = await tx.invoice.create({
        data: {
          invoiceNumber,
          customerId: contract.customerId,
          contractId: contract.id,
          quotationId: contract.quotationId ?? null,
          type: InvoiceType.CREDIT_NOTE,
          status: InvoiceStatus.ISSUED,
          amount: unusedCredit,
          dueDate: now,
          lines: {
            create: [
              {
                description: `Credit note for cancellation of ${contract.plan.name} (unused duration)`,
                quantity: 1,
                unitPrice: unusedCredit,
                amount: unusedCredit,
              },
            ],
          },
        },
        include: { lines: true },
      });
    }

    const updated = await tx.subscriptionContract.update({
      where: { id: contractId },
      data: { status: "CANCELLED" },
    });

    return {
      contract: updated,
      creditNote,
    };
  });
}

function computePeriodEndDate(startDate: Date, interval: BillingInterval): Date {
  const end = new Date(startDate);
  switch (interval) {
    case BillingInterval.YEARLY:
      end.setFullYear(end.getFullYear() + 1);
      break;
    case BillingInterval.QUARTERLY:
      end.setMonth(end.getMonth() + 3);
      break;
    case BillingInterval.MONTHLY:
    default:
      end.setMonth(end.getMonth() + 1);
      break;
  }
  return end;
}

async function generateInvoiceNumber(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  prefix = "INV",
): Promise<string> {
  const year = new Date().getFullYear();
  const count = await tx.invoice.count();
  const sequence = String(count + 1).padStart(4, "0");
  return `${prefix}-${year}-${sequence}`;
}

async function generateContractNumber(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
): Promise<string> {
  const year = new Date().getFullYear();
  const count = await tx.subscriptionContract.count();
  const sequence = String(count + 1).padStart(4, "0");
  return `SUB-${year}-${sequence}`;
}

export type ListInvoicesFilter = {
  status?: InvoiceStatus;
  type?: InvoiceType;
  customerId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  offset?: number;
};

export async function listInvoices(filters: ListInvoicesFilter = {}) {
  const where: Prisma.InvoiceWhereInput = {};

  if (filters.status) where.status = filters.status;
  if (filters.type) where.type = filters.type;
  if (filters.customerId) where.customerId = filters.customerId;

  if (filters.startDate || filters.endDate) {
    where.createdAt = {
      ...(filters.startDate ? { gte: new Date(filters.startDate) } : {}),
      ...(filters.endDate ? { lte: new Date(filters.endDate) } : {}),
    };
  }

  if (filters.search) {
    const term = filters.search.trim();
    where.OR = [
      { invoiceNumber: { contains: term, mode: "insensitive" } },
      { customer: { name: { contains: term, mode: "insensitive" } } },
      { quotation: { quoteNumber: { contains: term, mode: "insensitive" } } },
    ];
  }

  const { page, limit, skip } = getPaginationParams(filters, 20);

  const [invoices, total, allSummaryInvoices] = await Promise.all([
    prisma.invoice.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            contactName: true,
            email: true,
            tier: true,
          },
        },
        quotation: {
          select: {
            id: true,
            quoteNumber: true,
            status: true,
          },
        },
        lines: true,
        payments: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip,
    }),
    prisma.invoice.count({ where }),
    prisma.invoice.findMany({
      select: {
        status: true,
        amount: true,
        dueDate: true,
      },
    }),
  ]);

  const now = new Date();
  let totalInvoiced = 0;
  let totalPaid = 0;
  let totalOutstanding = 0;
  let overdueCount = 0;

  for (const inv of allSummaryInvoices) {
    if (inv.status !== InvoiceStatus.CANCELLED) {
      totalInvoiced += inv.amount;
    }
    if (inv.status === InvoiceStatus.PAID) {
      totalPaid += inv.amount;
    } else if (inv.status === InvoiceStatus.ISSUED) {
      totalOutstanding += inv.amount;
      if (inv.dueDate < now) {
        overdueCount += 1;
      }
    }
  }

  const meta = buildPaginationMeta(total, page, limit);

  return {
    invoices,
    total,
    page: meta.page,
    limit: meta.limit,
    totalPages: meta.totalPages,
    hasMore: meta.hasMore,
    summary: {
      totalInvoiced: Math.round(totalInvoiced * 100) / 100,
      totalPaid: Math.round(totalPaid * 100) / 100,
      totalOutstanding: Math.round(totalOutstanding * 100) / 100,
      overdueCount,
    },
  };
}

export async function getInvoiceById(id: string) {
  const invoice = await prisma.invoice.findFirst({
    where: {
      OR: [{ id }, { invoiceNumber: id }],
    },
    include: {
      customer: true,
      quotation: {
        include: {
          lines: {
            include: { product: true },
          },
        },
      },
      lines: true,
      payments: {
        orderBy: { paidAt: "desc" },
      },
      contract: {
        include: { plan: true },
      },
    },
  });

  if (!invoice) {
    throw new NotFoundError("Invoice", id);
  }

  return invoice;
}

export async function exportInvoicesCsv(filters: ListInvoicesFilter = {}) {
  const where: Prisma.InvoiceWhereInput = {};

  if (filters.status) where.status = filters.status;
  if (filters.type) where.type = filters.type;
  if (filters.customerId) where.customerId = filters.customerId;

  if (filters.startDate || filters.endDate) {
    where.createdAt = {
      ...(filters.startDate ? { gte: new Date(filters.startDate) } : {}),
      ...(filters.endDate ? { lte: new Date(filters.endDate) } : {}),
    };
  }

  const invoices = await prisma.invoice.findMany({
    where,
    include: {
      customer: true,
      quotation: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const headers = [
    "Invoice Number",
    "Customer Name",
    "Customer Tier",
    "Customer Email",
    "Quotation Number",
    "Invoice Type",
    "Status",
    "Amount",
    "Due Date",
    "Paid At",
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

  const rows = invoices.map((inv) => [
    inv.invoiceNumber,
    inv.customer.name,
    inv.customer.tier,
    inv.customer.email,
    inv.quotation?.quoteNumber ?? "N/A",
    inv.type,
    inv.status,
    inv.amount.toFixed(2),
    inv.dueDate.toISOString().split("T")[0],
    inv.paidAt ? inv.paidAt.toISOString().split("T")[0] : "",
    inv.createdAt.toISOString().split("T")[0],
  ]);

  return [
    headers.join(","),
    ...rows.map((row) => row.map(escapeCsv).join(",")),
  ].join("\n");
}

export async function generateInvoicePrintHtml(id: string): Promise<string> {
  const invoice = await getInvoiceById(id);
  const formattedAmount = invoice.amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
  const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
  const formattedPaid = totalPaid.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
  const balanceDue = Math.max(0, invoice.amount - totalPaid);
  const formattedBalanceDue = balanceDue.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });

  const statusColor =
    invoice.status === InvoiceStatus.PAID
      ? "#16a34a"
      : invoice.status === InvoiceStatus.ISSUED
        ? "#2563eb"
        : "#6b7280";

  const linesHtml = invoice.lines
    .map(
      (line) => `
    <tr>
      <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #1f2937;">${line.description}</td>
      <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 14px; text-align: center; color: #4b5563;">${line.quantity}</td>
      <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 14px; text-align: right; color: #4b5563;">$${line.unitPrice.toFixed(2)}</td>
      <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 14px; text-align: right; font-weight: 600; color: #111827;">$${line.amount.toFixed(2)}</td>
    </tr>
  `,
    )
    .join("");

  const paymentsHtml =
    invoice.payments.length > 0
      ? `
    <div style="margin-top: 32px;">
      <h3 style="font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #4b5563; margin-bottom: 12px;">Payment Records</h3>
      <table style="width: 100%; border-collapse: collapse; background: #f9fafb; border-radius: 6px; overflow: hidden;">
        <thead>
          <tr style="border-bottom: 1px solid #e5e7eb; text-align: left; font-size: 12px; color: #6b7280;">
            <th style="padding: 10px 16px;">Date</th>
            <th style="padding: 10px 16px;">Method</th>
            <th style="padding: 10px 16px;">Reference</th>
            <th style="padding: 10px 16px; text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.payments
        .map(
          (p) => `
            <tr style="border-bottom: 1px solid #f3f4f6; font-size: 13px;">
              <td style="padding: 8px 16px; color: #374151;">${new Date(p.paidAt).toLocaleDateString()}</td>
              <td style="padding: 8px 16px; color: #374151;">${p.paymentMethod}</td>
              <td style="padding: 8px 16px; color: #6b7280; font-family: monospace;">${p.reference ?? "Direct"}</td>
              <td style="padding: 8px 16px; text-align: right; font-weight: 600; color: #16a34a;">$${p.amount.toFixed(2)}</td>
            </tr>
          `,
        )
        .join("")}
        </tbody>
      </table>
    </div>
  `
      : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Invoice ${invoice.invoiceNumber} - DealFlow360</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 40px; background-color: #f3f4f6; color: #111827; }
    .invoice-card { max-width: 800px; margin: 0 auto; background: #ffffff; padding: 48px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .no-print-bar { max-width: 800px; margin: 0 auto 20px; display: flex; justify-content: flex-end; gap: 12px; }
    .btn { padding: 8px 16px; border-radius: 6px; font-weight: 600; font-size: 14px; cursor: pointer; border: none; }
    .btn-primary { background: #0284c7; color: white; }
    .btn-secondary { background: #e5e7eb; color: #374151; }
    @media print {
      body { background: white; padding: 0; }
      .invoice-card { box-shadow: none; padding: 0; max-width: 100%; }
      .no-print-bar { display: none; }
    }
  </style>
</head>
<body>
  <div class="no-print-bar">
    <button class="btn btn-secondary" onclick="window.close()">Close</button>
    <button class="btn btn-primary" onclick="window.print()">Print / Save as PDF</button>
  </div>
  <div class="invoice-card">
    <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #f3f4f6; padding-bottom: 32px;">
      <div>
        <div style="font-size: 12px; font-weight: 700; color: #0284c7; letter-spacing: 0.1em; text-transform: uppercase;">DealFlow360 Sales Operations</div>
        <h1 style="margin: 4px 0 0; font-size: 28px; font-weight: 800; color: #0f172a;">INVOICE</h1>
        <div style="font-family: monospace; font-size: 16px; color: #64748b; margin-top: 4px;"># ${invoice.invoiceNumber}</div>
      </div>
      <div style="text-align: right;">
        <span style="display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 700; background: ${statusColor}15; color: ${statusColor}; border: 1px solid ${statusColor}30;">
          ${invoice.status}
        </span>
        <div style="font-size: 13px; color: #6b7280; margin-top: 8px;">Type: <strong>${invoice.type}</strong></div>
      </div>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px; padding: 28px 0; border-bottom: 1px solid #f3f4f6;">
      <div>
        <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #9ca3af; letter-spacing: 0.05em; margin-bottom: 6px;">Billed To</div>
        <div style="font-size: 16px; font-weight: 700; color: #111827;">${invoice.customer.name}</div>
        <div style="font-size: 14px; color: #4b5563; margin-top: 2px;">Attn: ${invoice.customer.contactName || "Accounts Payable"}</div>
        <div style="font-size: 13px; color: #6b7280; margin-top: 2px;">${invoice.customer.email}</div>
        <div style="display: inline-block; margin-top: 6px; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 4px; background: #f3f4f6; color: #4b5563;">Tier: ${invoice.customer.tier}</div>
      </div>
      <div style="text-align: right;">
        <div style="margin-bottom: 8px;">
          <span style="font-size: 13px; color: #6b7280;">Invoice Date:</span>
          <strong style="font-size: 13px; color: #111827; margin-left: 8px;">${new Date(invoice.createdAt).toLocaleDateString()}</strong>
        </div>
        <div style="margin-bottom: 8px;">
          <span style="font-size: 13px; color: #6b7280;">Due Date:</span>
          <strong style="font-size: 13px; color: #111827; margin-left: 8px;">${new Date(invoice.dueDate).toLocaleDateString()}</strong>
        </div>
        ${invoice.quotation
      ? `<div><span style="font-size: 13px; color: #6b7280;">Ref Quotation:</span> <strong style="font-size: 13px; font-family: monospace; color: #0284c7; margin-left: 8px;">${invoice.quotation.quoteNumber}</strong></div>`
      : ""
    }
      </div>
    </div>

    <table style="width: 100%; border-collapse: collapse; margin-top: 28px;">
      <thead>
        <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0; text-align: left; font-size: 12px; color: #64748b; text-transform: uppercase;">
          <th style="padding: 12px 16px;">Description</th>
          <th style="padding: 12px 16px; text-align: center;">Qty</th>
          <th style="padding: 12px 16px; text-align: right;">Unit Price</th>
          <th style="padding: 12px 16px; text-align: right;">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${linesHtml}
      </tbody>
    </table>

    <div style="display: flex; justify-content: flex-end; margin-top: 24px;">
      <div style="width: 280px; background: #f8fafc; border-radius: 6px; padding: 16px 20px; border: 1px solid #e2e8f0;">
        <div style="display: flex; justify-content: space-between; padding: 4px 0; font-size: 14px; color: #64748b;">
          <span>Subtotal:</span>
          <span style="color: #111827; font-weight: 600;">${formattedAmount}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 4px 0; font-size: 14px; color: #64748b;">
          <span>Amount Paid:</span>
          <span style="color: #16a34a; font-weight: 600;">${formattedPaid}</span>
        </div>
        <div style="border-top: 1px solid #e2e8f0; margin-top: 8px; padding-top: 8px; display: flex; justify-content: space-between; font-size: 16px;">
          <span style="font-weight: 700; color: #0f172a;">Balance Due:</span>
          <span style="font-weight: 800; color: ${balanceDue > 0 ? "#dc2626" : "#16a34a"}; font-family: monospace;">${formattedBalanceDue}</span>
        </div>
      </div>
    </div>

    ${paymentsHtml}

    <div style="margin-top: 48px; padding-top: 20px; border-top: 1px solid #f3f4f6; text-align: center; font-size: 12px; color: #9ca3af;">
      Thank you for your business. DealFlow360 Self-Governing Sales Operations Engine.
    </div>
  </div>
</body>
</html>`;
}
