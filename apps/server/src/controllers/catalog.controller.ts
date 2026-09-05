import type { Context } from "hono";
import { sendSuccess } from "../utils/api-response";
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
  createProductSchema,
  createCustomerSchema,
  updateCustomerSchema,
  createWarehouseSchema,
  updateCeilingSchema,
  updateUserRoleSchema,
  idParamSchema,
  customerTierParamSchema,
  categoryParamSchema,
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
  const validated = createProductSchema.parse(body);
  const created = await createProduct(validated);
  return sendSuccess(c, created, 201, "Product created successfully.");
}

export async function createCustomerController(c: Context) {
  const body = await c.req.json();
  const validated = createCustomerSchema.parse(body);
  const created = await createCustomer(validated);
  return sendSuccess(c, created, 201, "Customer created successfully.");
}

export async function createWarehouseController(c: Context) {
  const body = await c.req.json();
  const validated = createWarehouseSchema.parse(body);
  const created = await createWarehouse(validated);
  return sendSuccess(c, created, 201, "Warehouse created successfully.");
}

export async function updateCustomerTierCeilingController(c: Context) {
  const { tier } = customerTierParamSchema.parse({ tier: c.req.param("tier") });
  const body = await c.req.json();
  const { ceilingPercent } = updateCeilingSchema.parse(body);
  const updated = await updateCustomerTierCeiling(tier, ceilingPercent);
  return sendSuccess(c, updated, 200, "Customer tier ceiling updated.");
}

export async function updateCategoryCeilingController(c: Context) {
  const { category } = categoryParamSchema.parse({ category: c.req.param("category") });
  const body = await c.req.json();
  const { ceilingPercent } = updateCeilingSchema.parse(body);
  const updated = await updateCategoryCeiling(category, ceilingPercent);
  return sendSuccess(c, updated, 200, "Category ceiling updated.");
}

export async function updateCustomerController(c: Context) {
  const { id } = idParamSchema.parse({ id: c.req.param("id") });
  const body = await c.req.json();
  const validated = updateCustomerSchema.parse(body);
  const updated = await updateCustomer(id, validated);
  return sendSuccess(c, updated, 200, "Customer updated successfully.");
}

export async function deleteCustomerController(c: Context) {
  const { id } = idParamSchema.parse({ id: c.req.param("id") });
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
  const { id } = idParamSchema.parse({ id: c.req.param("id") });
  const body = await c.req.json();
  const { role } = updateUserRoleSchema.parse(body);
  const updated = await updateUserRole(id, role);
  return sendSuccess(c, updated, 200, "User role updated successfully.");
}

export async function deleteUserController(c: Context) {
  const { id } = idParamSchema.parse({ id: c.req.param("id") });
  await deleteUser(id);
  return sendSuccess(c, { id }, 200, "User deleted successfully.");
}
