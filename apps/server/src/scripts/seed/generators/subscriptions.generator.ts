import prisma, { BillingInterval } from "@DealFlow360/db";
import { GUJARAT_CUSTOMERS } from "../data/customers.data.js";

export interface SeedSubscriptionResult {
  plans: { id: string; code: string; unitPrice: number }[];
  contractIds: string[];
}

export async function generateSubscriptions(): Promise<SeedSubscriptionResult> {
  console.log("-> Seeding Subscription Plans...");

  const plansData = [
    {
      id: "plan_core_monthly",
      name: "DealFlow360 Platform Seat (Monthly)",
      code: "PLAN-CORE-MONTHLY",
      interval: BillingInterval.MONTHLY,
      unitPrice: 3800.0,
      prorationMethod: "DAILY",
      cancellationRefundPolicy: "PRO_RATA_CREDIT",
    },
    {
      id: "plan_core_annual",
      name: "DealFlow360 Platform Seat (Annual)",
      code: "PLAN-CORE-ANNUAL",
      interval: BillingInterval.YEARLY,
      unitPrice: 38000.0,
      prorationMethod: "DAILY",
      cancellationRefundPolicy: "30_DAY_MONEY_BACK",
    },
    {
      id: "plan_ent_monthly",
      name: "DealFlow360 AI Enterprise Suite (Monthly)",
      code: "PLAN-ENT-MONTHLY",
      interval: BillingInterval.MONTHLY,
      unitPrice: 7500.0,
      prorationMethod: "DAILY",
      cancellationRefundPolicy: "PRO_RATA_CREDIT",
    },
    {
      id: "plan_ent_annual",
      name: "DealFlow360 AI Enterprise Suite (Annual)",
      code: "PLAN-ENT-ANNUAL",
      interval: BillingInterval.YEARLY,
      unitPrice: 75000.0,
      prorationMethod: "DAILY",
      cancellationRefundPolicy: "PRO_RATA_CREDIT",
    },
  ];

  for (const p of plansData) {
    await prisma.subscriptionPlan.create({ data: p });
  }

  console.log("-> Generating 30 Subscription Contracts with Billing Schedules...");

  const targetCustomers = GUJARAT_CUSTOMERS.slice(0, 30);
  const contractIds: string[] = [];

  const now = new Date();

  for (let i = 0; i < targetCustomers.length; i++) {
    const cust = targetCustomers[i]!;
    const plan = plansData[i % plansData.length]!;
    const seats = 10 + ((i * 7) % 90);
    const recurringAmount = plan.unitPrice * seats;
    const contractNum = `CNT-2026-${String(i + 1).padStart(4, "0")}`;

    const startDate = new Date(now.getTime() - (30 + (i * 3)) * 24 * 60 * 60 * 1000);
    const endDate = new Date(startDate.getTime() + (plan.interval === BillingInterval.YEARLY ? 365 : 30) * 24 * 60 * 60 * 1000);

    const contract = await prisma.subscriptionContract.create({
      data: {
        id: `cnt_2026_${String(i + 1).padStart(4, "0")}`,
        contractNumber: contractNum,
        customerId: cust.id,
        planId: plan.id,
        seats,
        unitPrice: plan.unitPrice,
        recurringAmount,
        status: "ACTIVE",
        currentPeriodStart: startDate,
        currentPeriodEnd: endDate,
      },
    });

    contractIds.push(contract.id);

    for (let s = 1; s <= 3; s++) {
      const scheduleDate = new Date(endDate.getTime() + (s - 1) * (plan.interval === BillingInterval.YEARLY ? 365 : 30) * 24 * 60 * 60 * 1000);
      await prisma.subscriptionBillingSchedule.create({
        data: {
          id: `sch_${contract.id}_${s}`,
          contractId: contract.id,
          billingDate: scheduleDate,
          amount: recurringAmount,
          status: s === 1 ? "READY" : "PENDING",
        },
      });
    }
  }

  return {
    plans: plansData.map((p) => ({ id: p.id, code: p.code, unitPrice: p.unitPrice })),
    contractIds,
  };
}
