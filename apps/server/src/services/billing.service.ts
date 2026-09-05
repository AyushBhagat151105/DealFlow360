import prisma, {
  ProductCategory,
  InvoiceType,
  InvoiceStatus,
  BillingInterval,
} from "@DealFlow360/db";
import { NotFoundError, ValidationError } from "../utils/errors";

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

