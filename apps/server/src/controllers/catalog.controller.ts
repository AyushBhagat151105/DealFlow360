import type { Context } from "hono";
import { sendSuccess } from "../utils/api-response";
import { ValidationError } from "../utils/errors";
import {
  getCatalogProducts,
  getCatalogCustomers,
  getCatalogWarehouses,
  getCatalogSubscriptionPlans,
  getDiscountCeilingsMatrix,
  createProduct,
  createCustomer,
  createWarehouse,
  updateCustomerTierCeiling,
  updateCategoryCeiling,
} from "../services/catalog.service";

export async function getProductsController(c: Context) {
  const products = await getCatalogProducts();
  return sendSuccess(c, products);
}

export async function getCustomersController(c: Context) {
  const customers = await getCatalogCustomers();
  return sendSuccess(c, customers);
}

export async function getWarehousesController(c: Context) {
  const warehouses = await getCatalogWarehouses();
  return sendSuccess(c, warehouses);
}

export async function getSubscriptionPlansController(c: Context) {
  const plans = await getCatalogSubscriptionPlans();
  return sendSuccess(c, plans);
}

export async function getCeilingsController(c: Context) {
  const ceilings = await getDiscountCeilingsMatrix();
  return sendSuccess(c, ceilings);
}

export async function createProductController(c: Context) {
  const body = await c.req.json();
  const created = await createProduct(body);
  return sendSuccess(c, created, 201, "Product created successfully.");
}

export async function createCustomerController(c: Context) {
  const body = await c.req.json();
  const created = await createCustomer(body);
  return sendSuccess(c, created, 201, "Customer created successfully.");
}

export async function createWarehouseController(c: Context) {
  const body = await c.req.json();
  const created = await createWarehouse(body);
  return sendSuccess(c, created, 201, "Warehouse created successfully.");
}

export async function updateCustomerTierCeilingController(c: Context) {
  const tier = c.req.param("tier");
  if (!tier) {
    throw new ValidationError("Customer tier is required.");
  }
  const body = await c.req.json();
  const ceiling = Number(body?.ceilingPercent);
  if (isNaN(ceiling) || ceiling < 0 || ceiling > 100) {
    throw new ValidationError("Valid ceiling percentage (0-100) is required.");
  }
  const updated = await updateCustomerTierCeiling(tier as never, ceiling);
  return sendSuccess(c, updated, 200, "Customer tier ceiling updated.");
}

export async function updateCategoryCeilingController(c: Context) {
  const category = c.req.param("category");
  if (!category) {
    throw new ValidationError("Category is required.");
  }
  const body = await c.req.json();
  const ceiling = Number(body?.ceilingPercent);
  if (isNaN(ceiling) || ceiling < 0 || ceiling > 100) {
    throw new ValidationError("Valid ceiling percentage (0-100) is required.");
  }
  const updated = await updateCategoryCeiling(category as never, ceiling);
  return sendSuccess(c, updated, 200, "Category ceiling updated.");
}

