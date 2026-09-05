import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import {
  getProductsController,
  getCustomersController,
  getWarehousesController,
  getSubscriptionPlansController,
  getCeilingsController,
  createProductController,
  createCustomerController,
  createWarehouseController,
  updateCustomerTierCeilingController,
  updateCategoryCeilingController,
  updateCustomerController,
  deleteCustomerController,
  getUsersController,
  updateUserRoleController,
  deleteUserController,
} from "../controllers/catalog.controller";
import { requireAuth, requireRole, optionalAuth } from "../middlewares/auth";

import {
  listProductsQuerySchema,
  listCustomersQuerySchema,
  listUsersQuerySchema,
} from "../validators/catalog.validator";

export const catalogRoutes = new OpenAPIHono();

const getProductsRoute = createRoute({
  method: "get",
  path: "/products",
  tags: ["Catalog"],
  summary: "List catalog products and variants with optional pagination",
  request: {
    query: listProductsQuerySchema,
  },
  responses: {
    200: { description: "Catalog products list or paginated response" },
  },
});

const getCustomersRoute = createRoute({
  method: "get",
  path: "/customers",
  tags: ["Catalog"],
  summary: "List customers with assigned tiers and ceilings with optional pagination",
  request: {
    query: listCustomersQuerySchema,
  },
  responses: {
    200: { description: "List of customers or paginated response" },
  },
});

const getWarehousesRoute = createRoute({
  method: "get",
  path: "/warehouses",
  tags: ["Catalog"],
  summary: "List warehouses and current inventory stock levels",
  responses: {
    200: { description: "List of warehouses with stock" },
  },
});

const getPlansRoute = createRoute({
  method: "get",
  path: "/plans",
  tags: ["Catalog"],
  summary: "List active subscription plans and billing intervals",
  responses: {
    200: { description: "List of subscription plans" },
  },
});

const getCeilingsRoute = createRoute({
  method: "get",
  path: "/ceilings",
  tags: ["Catalog"],
  summary: "Get discount ceilings matrix for tiers and categories",
  responses: {
    200: { description: "Discount ceilings matrix" },
  },
});

const createProductRoute = createRoute({
  method: "post",
  path: "/products",
  tags: ["Catalog"],
  summary: "Create a new catalog product (Admin only)",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            sku: z.string().describe("Unique product SKU code"),
            name: z.string().describe("Product display name"),
            description: z.string().optional().default(""),
            category: z.enum(["HARDWARE", "SOFTWARE_SUBSCRIPTION", "SERVICE"]),
            unit: z.string().optional().default("unit"),
            basePrice: z.number().optional().describe("Base / list price"),
            listPrice: z.number().optional().describe("Alternative field for selling price"),
            costPrice: z.number().optional().describe("Internal standard unit cost"),
            standardCost: z.number().optional().describe("Alternative field for internal cost"),
            taxRate: z.number().optional().default(10.0),
            isPromoted: z.boolean().optional().default(false),
            minMarginThreshold: z.number().optional().default(15.0),
          }),
        },
      },
    },
  },
  responses: {
    201: { description: "Product created successfully" },
    400: { description: "Validation error" },
  },
});

const createCustomerRoute = createRoute({
  method: "post",
  path: "/customers",
  tags: ["Catalog"],
  summary: "Create a new customer account",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            name: z.string().describe("Company or organization name"),
            contactName: z.string().optional().describe("Primary contact person"),
            email: z.string().email().describe("Primary contact email"),
            phone: z.string().optional().describe("Phone number"),
            address: z.string().optional().describe("Physical or billing address"),
            tier: z.enum(["STANDARD", "BRONZE", "SILVER", "GOLD"]).optional().default("BRONZE"),
          }),
        },
      },
    },
  },
  responses: {
    201: { description: "Customer created successfully" },
    400: { description: "Validation error" },
  },
});

const createWarehouseRoute = createRoute({
  method: "post",
  path: "/warehouses",
  tags: ["Catalog"],
  summary: "Create a new warehouse facility (Admin only)",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            code: z.string().describe("Unique warehouse code e.g. CHI-01"),
            name: z.string().describe("Warehouse facility name"),
            location: z.string().optional().describe("City or state location"),
            shippingCostWeight: z.number().optional().default(1.0).describe("Fulfillment preference weight"),
            preferenceWeight: z.number().optional().default(1.0).describe("Alternative field for preference weight"),
            isPrimary: z.boolean().optional().default(false),
          }),
        },
      },
    },
  },
  responses: {
    201: { description: "Warehouse created successfully" },
    400: { description: "Validation error" },
  },
});

const updateCustomerTierCeilingRoute = createRoute({
  method: "patch",
  path: "/ceilings/customer-tier/{tier}",
  tags: ["Catalog"],
  summary: "Update customer tier maximum discount ceiling",
  request: {
    params: z.object({
      tier: z.string().openapi({ param: { name: "tier", in: "path" } }),
    }),
    body: {
      content: {
        "application/json": {
          schema: z.object({
            ceilingPercent: z.number().min(0).max(100),
          }),
        },
      },
    },
  },
  responses: {
    200: { description: "Tier ceiling updated successfully" },
  },
});

const updateCategoryCeilingRoute = createRoute({
  method: "patch",
  path: "/ceilings/category/{category}",
  tags: ["Catalog"],
  summary: "Update product category maximum discount ceiling",
  request: {
    params: z.object({
      category: z.string().openapi({ param: { name: "category", in: "path" } }),
    }),
    body: {
      content: {
        "application/json": {
          schema: z.object({
            ceilingPercent: z.number().min(0).max(100),
          }),
        },
      },
    },
  },
  responses: {
    200: { description: "Category ceiling updated successfully" },
  },
});

const updateCustomerRoute = createRoute({
  method: "patch",
  path: "/customers/{id}",
  tags: ["Catalog"],
  summary: "Update customer details",
  request: {
    params: z.object({
      id: z.string().openapi({ param: { name: "id", in: "path" } }),
    }),
    body: {
      content: {
        "application/json": {
          schema: z.object({
            name: z.string().optional(),
            contactName: z.string().optional(),
            email: z.string().email().optional(),
            phone: z.string().optional(),
            address: z.string().optional(),
            tier: z.enum(["STANDARD", "BRONZE", "SILVER", "GOLD"]).optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: { description: "Customer updated successfully" },
    400: { description: "Validation error" },
    404: { description: "Customer not found" },
  },
});

const deleteCustomerRoute = createRoute({
  method: "delete",
  path: "/customers/{id}",
  tags: ["Catalog"],
  summary: "Delete customer account (Admin only)",
  request: {
    params: z.object({
      id: z.string().openapi({ param: { name: "id", in: "path" } }),
    }),
  },
  responses: {
    200: { description: "Customer deleted successfully" },
    404: { description: "Customer not found" },
  },
});

const getUsersRoute = createRoute({
  method: "get",
  path: "/users",
  tags: ["Catalog"],
  summary: "List all workspace team members and roles with optional pagination",
  request: {
    query: listUsersQuerySchema,
  },
  responses: {
    200: { description: "List of workspace users or paginated response" },
  },
});

const updateUserRoleRoute = createRoute({
  method: "patch",
  path: "/users/{id}/role",
  tags: ["Catalog"],
  summary: "Update user role (Admin only)",
  request: {
    params: z.object({
      id: z.string().openapi({ param: { name: "id", in: "path" } }),
    }),
    body: {
      content: {
        "application/json": {
          schema: z.object({
            role: z.enum(["rep", "manager", "finance", "admin"]),
          }),
        },
      },
    },
  },
  responses: {
    200: { description: "User role updated successfully" },
    404: { description: "User not found" },
  },
});

const deleteUserRoute = createRoute({
  method: "delete",
  path: "/users/{id}",
  tags: ["Catalog"],
  summary: "Delete user account (Admin only)",
  request: {
    params: z.object({
      id: z.string().openapi({ param: { name: "id", in: "path" } }),
    }),
  },
  responses: {
    200: { description: "User deleted successfully" },
    404: { description: "User not found" },
  },
});

catalogRoutes.use("/products", optionalAuth);
catalogRoutes.use("/customers", optionalAuth);
catalogRoutes.use("/warehouses", optionalAuth);
catalogRoutes.use("/plans", optionalAuth);
catalogRoutes.use("/ceilings", optionalAuth);
catalogRoutes.use("/users", optionalAuth);

catalogRoutes.openapi(getProductsRoute, getProductsController);
catalogRoutes.openapi(getCustomersRoute, getCustomersController);
catalogRoutes.openapi(getWarehousesRoute, getWarehousesController);
catalogRoutes.openapi(getPlansRoute, getSubscriptionPlansController);
catalogRoutes.openapi(getCeilingsRoute, getCeilingsController);

catalogRoutes.openapi(createProductRoute, async (c) => {
  await requireAuth(c, async () => { });
  await requireRole(["admin"])(c, async () => { });
  return createProductController(c);
});

catalogRoutes.openapi(createCustomerRoute, async (c) => {
  await requireAuth(c, async () => { });
  return createCustomerController(c);
});

catalogRoutes.openapi(updateCustomerRoute, async (c) => {
  await requireAuth(c, async () => { });
  return updateCustomerController(c);
});

catalogRoutes.openapi(deleteCustomerRoute, async (c) => {
  await requireAuth(c, async () => { });
  await requireRole(["admin"])(c, async () => { });
  return deleteCustomerController(c);
});

catalogRoutes.openapi(createWarehouseRoute, async (c) => {
  await requireAuth(c, async () => { });
  await requireRole(["admin"])(c, async () => { });
  return createWarehouseController(c);
});

catalogRoutes.openapi(updateCustomerTierCeilingRoute, async (c) => {
  await requireAuth(c, async () => { });
  await requireRole(["admin", "manager"])(c, async () => { });
  return updateCustomerTierCeilingController(c);
});

catalogRoutes.openapi(updateCategoryCeilingRoute, async (c) => {
  await requireAuth(c, async () => { });
  await requireRole(["admin", "manager"])(c, async () => { });
  return updateCategoryCeilingController(c);
});

catalogRoutes.openapi(getUsersRoute, async (c) => {
  await requireAuth(c, async () => { });
  return getUsersController(c);
});

catalogRoutes.openapi(updateUserRoleRoute, async (c) => {
  await requireAuth(c, async () => { });
  await requireRole(["admin"])(c, async () => { });
  return updateUserRoleController(c);
});

catalogRoutes.openapi(deleteUserRoute, async (c) => {
  await requireAuth(c, async () => { });
  await requireRole(["admin"])(c, async () => { });
  return deleteUserController(c);
});
