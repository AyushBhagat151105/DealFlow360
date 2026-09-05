import type { Context } from "hono";
import { sendSuccess } from "../utils/api-response";
import { ValidationError } from "../utils/errors";
import {
  computeWarehouseSplit,
  confirmFulfillmentSplit,
  replenishWarehouseStock,
} from "../services/fulfillment.service";
import {
  confirmFulfillmentSchema,
  replenishStockSchema,
} from "../validators/fulfillment.validator";

export async function getFulfillmentSplitController(c: Context) {
  const quoteId = c.req.param("id");
  if (!quoteId) {
    throw new ValidationError("Quotation ID is required.");
  }
  const plan = await computeWarehouseSplit(quoteId);
  return sendSuccess(c, plan);
}

export async function confirmFulfillmentController(c: Context) {
  const quoteId = c.req.param("id");
  if (!quoteId) {
    throw new ValidationError("Quotation ID is required.");
  }
  const body = await c.req.json().catch(() => ({}));
  const validated = confirmFulfillmentSchema.parse(body);
  const result = await confirmFulfillmentSplit(quoteId, validated.overrides);
  return sendSuccess(c, result, 200, "Fulfillment split confirmed.");
}

export async function replenishStockController(c: Context) {
  const warehouseId = c.req.param("warehouseId");
  if (!warehouseId) {
    throw new ValidationError("Warehouse ID is required.");
  }
  const body = await c.req.json();
  const validated = replenishStockSchema.parse(body);
  const result = await replenishWarehouseStock(
    warehouseId,
    validated.productId,
    validated.quantityAdded,
    validated.variantId,
  );
  return sendSuccess(c, result, 200, "Stock replenished successfully.");
}

