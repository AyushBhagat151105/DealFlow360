import prisma, {
  ProductCategory,
  QuotationStatus,
} from "@DealFlow360/db";
import { NotFoundError, ValidationError } from "../utils/errors";

export type SplitAllocationItem = {
  quotationLineId: string;
  productId: string;
  productName: string;
  warehouseId: string | null;
  warehouseName: string | null;
  quantityRequested: number;
  quantityAllocated: number;
  quantityBackordered: number;
  status: "ALLOCATED" | "BACKORDER";
};

export type WarehouseSplitPlan = {
  quoteId: string;
  totalRequiredShipments: number;
  totalEstimatedShippingCost: number;
  hasBackorders: boolean;
  allocations: SplitAllocationItem[];
};

export async function computeWarehouseSplit(quoteId: string): Promise<WarehouseSplitPlan> {
  const quote = await prisma.quotation.findUnique({
    where: { id: quoteId },
    include: {
      lines: {
        include: {
          product: true,
          variant: true,
        },
      },
    },
  });

  if (!quote) {
    throw new NotFoundError("Quotation", quoteId);
  }

  const hardwareLines = quote.lines.filter(
    (line) => line.product.category === ProductCategory.HARDWARE,
  );

  if (hardwareLines.length === 0) {
    return {
      quoteId,
      totalRequiredShipments: 0,
      totalEstimatedShippingCost: 0,
      hasBackorders: false,
      allocations: [],
    };
  }

  const warehouses = await prisma.warehouse.findMany({
    include: {
      stocks: true,
    },
    orderBy: { shippingCostWeight: "asc" },
  });

  if (warehouses.length === 0) {
    throw new ValidationError("No fulfillment warehouses configured.");
  }

  const singleWarehouseCandidate = warehouses.find((wh) => {
    return hardwareLines.every((line) => {
      const stock = wh.stocks.find(
        (s) =>
          s.productId === line.productId &&
          (line.variantId ? s.variantId === line.variantId : true),
      );
      const available = (stock?.quantityOnHand ?? 0) - (stock?.reservedQuantity ?? 0);
      return available >= line.quantity;
    });
  });

  const allocations: SplitAllocationItem[] = [];
  const usedWarehouseIds = new Set<string>();
  let hasBackorders = false;

  if (singleWarehouseCandidate) {
    usedWarehouseIds.add(singleWarehouseCandidate.id);
    for (const line of hardwareLines) {
      allocations.push({
        quotationLineId: line.id,
        productId: line.productId,
        productName: line.product.name,
        warehouseId: singleWarehouseCandidate.id,
        warehouseName: singleWarehouseCandidate.name,
        quantityRequested: line.quantity,
        quantityAllocated: line.quantity,
        quantityBackordered: 0,
        status: "ALLOCATED",
      });
    }
  } else {
    for (const line of hardwareLines) {
      let remainingToFulfill = line.quantity;

      const rankedWarehouses = [...warehouses].sort((a, b) => {
        const stockA =
          a.stocks.find(
            (s) =>
              s.productId === line.productId &&
              (line.variantId ? s.variantId === line.variantId : true),
          )?.quantityOnHand ?? 0;
        const stockB =
          b.stocks.find(
            (s) =>
              s.productId === line.productId &&
              (line.variantId ? s.variantId === line.variantId : true),
          )?.quantityOnHand ?? 0;
        return stockB - stockA || a.shippingCostWeight - b.shippingCostWeight;
      });

      for (const wh of rankedWarehouses) {
        if (remainingToFulfill <= 0) {
          break;
        }

        const stock = wh.stocks.find(
          (s) =>
            s.productId === line.productId &&
            (line.variantId ? s.variantId === line.variantId : true),
        );
        const available = Math.max(
          0,
          (stock?.quantityOnHand ?? 0) - (stock?.reservedQuantity ?? 0),
        );

        if (available > 0) {
          const allocateQty = Math.min(available, remainingToFulfill);
          remainingToFulfill -= allocateQty;
          usedWarehouseIds.add(wh.id);

          allocations.push({
            quotationLineId: line.id,
            productId: line.productId,
            productName: line.product.name,
            warehouseId: wh.id,
            warehouseName: wh.name,
            quantityRequested: line.quantity,
            quantityAllocated: allocateQty,
            quantityBackordered: 0,
            status: "ALLOCATED",
          });
        }
      }

      if (remainingToFulfill > 0) {
        hasBackorders = true;
        allocations.push({
          quotationLineId: line.id,
          productId: line.productId,
          productName: line.product.name,
          warehouseId: null,
          warehouseName: "Unallocated / Backorder",
          quantityRequested: line.quantity,
          quantityAllocated: 0,
          quantityBackordered: remainingToFulfill,
          status: "BACKORDER",
        });
      }
    }
  }

  const baseShippingRatePerShipment = 15;
  let totalEstimatedShippingCost = 0;

  for (const whId of usedWarehouseIds) {
    const wh = warehouses.find((w) => w.id === whId);
    const weight = wh?.shippingCostWeight ?? 1;
    totalEstimatedShippingCost += baseShippingRatePerShipment * weight;
  }

  return {
    quoteId,
    totalRequiredShipments: usedWarehouseIds.size,
    totalEstimatedShippingCost: Math.round(totalEstimatedShippingCost * 100) / 100,
    hasBackorders,
    allocations,
  };
}

export type ManualAllocationOverride = {
  quotationLineId: string;
  warehouseId: string | null;
  quantityAllocated: number;
  quantityBackordered: number;
};

export async function confirmFulfillmentSplit(
  quoteId: string,
  overrides?: ManualAllocationOverride[],
) {
  const quote = await prisma.quotation.findUnique({
    where: { id: quoteId },
  });

  if (!quote) {
    throw new NotFoundError("Quotation", quoteId);
  }

  const allowedStatuses: QuotationStatus[] = [
    QuotationStatus.APPROVED,
    QuotationStatus.CONFIRMED,
  ];

  if (!allowedStatuses.includes(quote.status)) {
    throw new ValidationError(
      `Cannot fulfill quotation with status '${quote.status}'. Must be APPROVED or CONFIRMED.`,
    );
  }

  const plan = await computeWarehouseSplit(quoteId);
  const allocationsToSave = overrides && overrides.length > 0 ? overrides : plan.allocations;

  return prisma.$transaction(async (tx) => {
    await tx.fulfillmentSplit.deleteMany({
      where: { quotationId: quoteId },
    });

    let hasBackorder = false;

    for (const alloc of allocationsToSave) {
      if (alloc.quantityBackordered > 0) {
        hasBackorder = true;
      }

      await tx.fulfillmentSplit.create({
        data: {
          quotationId: quoteId,
          quotationLineId: alloc.quotationLineId,
          warehouseId: alloc.warehouseId ?? null,
          quantityAllocated: alloc.quantityAllocated,
          quantityBackordered: alloc.quantityBackordered,
          status: alloc.quantityBackordered > 0 ? "BACKORDER" : "ALLOCATED",
          isManualOverride: Boolean(overrides && overrides.length > 0),
        },
      });

      if (alloc.warehouseId && alloc.quantityAllocated > 0) {
        const line = await tx.quotationLine.findUnique({
          where: { id: alloc.quotationLineId },
        });

        if (line) {
          const stock = await tx.warehouseStock.findFirst({
            where: {
              warehouseId: alloc.warehouseId,
              productId: line.productId,
              variantId: line.variantId ?? null,
            },
          });

          if (stock) {
            await tx.warehouseStock.update({
              where: { id: stock.id },
              data: {
                quantityOnHand: Math.max(0, stock.quantityOnHand - alloc.quantityAllocated),
                reservedQuantity: Math.max(0, stock.reservedQuantity - alloc.quantityAllocated),
              },
            });
          }
        }
      }
    }

    const nextStatus = hasBackorder ? QuotationStatus.CONFIRMED : QuotationStatus.FULFILLED;

    return tx.quotation.update({
      where: { id: quoteId },
      data: { status: nextStatus },
      include: {
        fulfillmentSplits: {
          include: { warehouse: true },
        },
      },
    });
  });
}

export async function replenishWarehouseStock(
  warehouseId: string,
  productId: string,
  quantityAdded: number,
  variantId?: string | null,
) {
  if (quantityAdded <= 0) {
    throw new ValidationError("Replenishment quantity must be greater than zero.");
  }

  const warehouse = await prisma.warehouse.findUnique({
    where: { id: warehouseId },
  });

  if (!warehouse) {
    throw new NotFoundError("Warehouse", warehouseId);
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new NotFoundError("Product", productId);
  }

  const updatedStock = await prisma.$transaction(async (tx) => {
    const existing = await tx.warehouseStock.findFirst({
      where: {
        warehouseId,
        productId,
        variantId: variantId ?? null,
      },
    });

    if (existing) {
      return tx.warehouseStock.update({
        where: { id: existing.id },
        data: {
          quantityOnHand: existing.quantityOnHand + quantityAdded,
        },
      });
    }

    return tx.warehouseStock.create({
      data: {
        warehouseId,
        productId,
        variantId: variantId ?? null,
        quantityOnHand: quantityAdded,
      },
    });
  });

  const pendingBackorders = await prisma.fulfillmentSplit.findMany({
    where: {
      status: "BACKORDER",
      quotationLine: {
        productId,
        variantId: variantId ?? null,
      },
    },
  });

  return {
    stock: updatedStock,
    canConsolidateBackorders: pendingBackorders.length > 0,
    pendingBackordersCount: pendingBackorders.length,
  };
}

