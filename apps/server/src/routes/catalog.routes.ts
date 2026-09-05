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
} from "../controllers/catalog.controller";
import { requireAuth, requireRole, optionalAuth } from "../middlewares/auth";

export const catalogRoutes = new OpenAPIHono();

const getProductsRoute = createRoute({
  method: "get",
  path: "/products",
  tags: ["Catalog"],
  summary: "List all active catalog products and variants",
  responses: {
    200: { description: "Active catalog products" },
  },
});

const getCustomersRoute = createRoute({
  method: "get",
  path: "/customers",
  tags: ["Catalog"],
  summary: "List all customers with assigned tiers and ceilings",
  responses: {
    200: { description: "List of customers" },
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
            name: z.string(),
            category: z.enum(["HARDWARE", "SOFTWARE_SUBSCRIPTION", "SERVICE"]),
            listPrice: z.number(),
            standardCost: z.number(),
            sku: z.string(),
          }),
        },
      },
    },
  },
  responses: {
    201: { description: "Product created successfully" },
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
            name: z.string(),
            email: z.string().email(),
            company: z.string().optional(),
            tier: z.enum(["STANDARD", "BRONZE", "SILVER", "GOLD"]),
          }),
        },
      },
    },
  },
  responses: {
    201: { description: "Customer created successfully" },
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
            name: z.string(),
            code: z.string(),
            location: z.string(),
            preferenceWeight: z.number().optional().default(1.0),
          }),
        },
      },
    },
  },
  responses: {
    201: { description: "Warehouse created successfully" },
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

catalogRoutes.use("/products", optionalAuth);
catalogRoutes.use("/customers", optionalAuth);
catalogRoutes.use("/warehouses", optionalAuth);
catalogRoutes.use("/plans", optionalAuth);
catalogRoutes.use("/ceilings", optionalAuth);

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

