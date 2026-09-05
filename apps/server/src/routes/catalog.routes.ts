import { Hono } from "hono";
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

export const catalogRoutes = new Hono();

catalogRoutes.get("/products", optionalAuth, getProductsController);
catalogRoutes.get("/customers", optionalAuth, getCustomersController);
catalogRoutes.get("/warehouses", optionalAuth, getWarehousesController);
catalogRoutes.get("/plans", optionalAuth, getSubscriptionPlansController);
catalogRoutes.get("/ceilings", optionalAuth, getCeilingsController);

catalogRoutes.post("/products", requireAuth, requireRole(["admin"]), createProductController);
catalogRoutes.post("/customers", requireAuth, createCustomerController);
catalogRoutes.post("/warehouses", requireAuth, requireRole(["admin"]), createWarehouseController);
catalogRoutes.patch(
  "/ceilings/customer-tier/:tier",
  requireAuth,
  requireRole(["admin", "manager"]),
  updateCustomerTierCeilingController,
);
catalogRoutes.patch(
  "/ceilings/category/:category",
  requireAuth,
  requireRole(["admin", "manager"]),
  updateCategoryCeilingController,
);

