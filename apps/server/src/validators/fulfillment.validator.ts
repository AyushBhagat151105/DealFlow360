import { z } from "zod";

export const manualAllocationOverrideSchema = z.object({
  quotationLineId: z.string().min(1),
  warehouseId: z.string().nullable(),
  quantityAllocated: z.number().int().nonnegative(),
  quantityBackordered: z.number().int().nonnegative(),
});

export const confirmFulfillmentSchema = z.object({
  overrides: z.array(manualAllocationOverrideSchema).optional(),
});

export const replenishStockSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  quantityAdded: z.number().int().positive("Quantity must be greater than zero"),
  variantId: z.string().optional().nullable(),
});

export const warehouseIdParamSchema = z.object({
  warehouseId: z.string().min(1, "Warehouse ID is required"),
});

export const fulfillmentQuoteIdParamSchema = z.object({
  id: z.string().min(1, "Quotation ID is required"),
});

export type ManualAllocationOverrideInput = z.infer<typeof manualAllocationOverrideSchema>;
export type ConfirmFulfillmentInput = z.infer<typeof confirmFulfillmentSchema>;
export type ReplenishStockInput = z.infer<typeof replenishStockSchema>;
