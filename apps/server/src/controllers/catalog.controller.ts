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
  updateCustomer,
  deleteCustomer,
  createWarehouse,
  updateCustomerTierCeiling,
  updateCategoryCeiling,
  listUsers,
  updateUserRole,
  deleteUser,
} from "../services/catalog.service";
import {
  listProductsQuerySchema,
  listCustomersQuerySchema,
  listUsersQuerySchema,
} from "../validators/catalog.validator";

export async function getProductsController(c: Context) {
  const query = c.req.query();
  const validated = listProductsQuerySchema.parse(query);
  const products = await getCatalogProducts(validated);
  return sendSuccess(c, products);
}

export async function getCustomersController(c: Context) {
  const query = c.req.query();
  const validated = listCustomersQuerySchema.parse(query);
  const customers = await getCatalogCustomers(validated);
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

export async function updateCustomerController(c: Context) {
  const id = c.req.param("id");
  if (!id) {
    throw new ValidationError("Customer ID is required.");
  }
  const body = await c.req.json();
  const updated = await updateCustomer(id, body);
  return sendSuccess(c, updated, 200, "Customer updated successfully.");
}

export async function deleteCustomerController(c: Context) {
  const id = c.req.param("id");
  if (!id) {
    throw new ValidationError("Customer ID is required.");
  }
  await deleteCustomer(id);
  return sendSuccess(c, { id }, 200, "Customer deleted successfully.");
}

export async function getUsersController(c: Context) {
  const query = c.req.query();
  const validated = listUsersQuerySchema.parse(query);
  const users = await listUsers(validated);
  return sendSuccess(c, users);
}

export async function updateUserRoleController(c: Context) {
  const id = c.req.param("id");
  if (!id) {
    throw new ValidationError("User ID is required.");
  }
  const body = await c.req.json();
  if (!body.role) {
    throw new ValidationError("Role is required.");
  }
  const updated = await updateUserRole(id, body.role);
  return sendSuccess(c, updated, 200, "User role updated successfully.");
}

export async function deleteUserController(c: Context) {
  const id = c.req.param("id");
  if (!id) {
    throw new ValidationError("User ID is required.");
  }
  await deleteUser(id);
  return sendSuccess(c, { id }, 200, "User deleted successfully.");
}
