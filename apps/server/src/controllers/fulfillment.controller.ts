import type { Context } from "hono";
import { sendSuccess } from "../utils/api-response";
import {
  computeWarehouseSplit,
  confirmFulfillmentSplit,
  replenishWarehouseStock,
} from "../services/fulfillment.service";
import {
  confirmFulfillmentSchema,
  replenishStockSchema,
  warehouseIdParamSchema,
  fulfillmentQuoteIdParamSchema,
} from "../validators/fulfillment.validator";

export async function getFulfillmentSplitController(c: Context) {
  const { id } = fulfillmentQuoteIdParamSchema.parse({ id: c.req.param("id") });
  const plan = await computeWarehouseSplit(id);
  return sendSuccess(c, plan);
}

export async function confirmFulfillmentController(c: Context) {
  const { id } = fulfillmentQuoteIdParamSchema.parse({ id: c.req.param("id") });
  const body = await c.req.json().catch(() => ({}));
  const validated = confirmFulfillmentSchema.parse(body);
  const result = await confirmFulfillmentSplit(id, validated.overrides);
  return sendSuccess(c, result, 200, "Fulfillment split confirmed.");
}

export async function replenishStockController(c: Context) {
  const { warehouseId } = warehouseIdParamSchema.parse({ warehouseId: c.req.param("warehouseId") });
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
