import { z } from "zod";

export const listProductsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().optional(),
  category: z.enum(["HARDWARE", "SERVICE", "SUBSCRIPTION"]).optional(),
  all: z.coerce.boolean().optional(),
});

export const listCustomersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().optional(),
  tier: z.enum(["BRONZE", "SILVER", "GOLD"]).optional(),
  all: z.coerce.boolean().optional(),
});

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().optional(),
  role: z.enum(["rep", "manager", "finance", "admin"]).optional(),
  all: z.coerce.boolean().optional(),
});

export const createProductSchema = z.object({
  sku: z.string().min(1, "Product SKU is required"),
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional().default(""),
  category: z.enum(["HARDWARE", "SERVICE", "SUBSCRIPTION", "SOFTWARE_SUBSCRIPTION", "SOFTWARE"]),
  unit: z.string().optional().default("unit"),
  basePrice: z.coerce.number().nonnegative("Base price must be non-negative").optional(),
  listPrice: z.coerce.number().nonnegative("List price must be non-negative").optional(),
  costPrice: z.coerce.number().nonnegative("Cost price must be non-negative").optional(),
  standardCost: z.coerce.number().nonnegative("Standard cost must be non-negative").optional(),
  taxRate: z.coerce.number().optional().default(18.0),
  isPromoted: z.boolean().optional().default(false),
  minMarginThreshold: z.coerce.number().optional().default(15.0),
});

export const createCustomerSchema = z.object({
  name: z.string().min(1, "Company name is required"),
  contactName: z.string().optional(),
  email: z.string().email("Valid email address is required"),
  phone: z.string().optional(),
  address: z.string().optional(),
  tier: z.enum(["STANDARD", "BRONZE", "SILVER", "GOLD"]).optional().default("BRONZE"),
});

export const updateCustomerSchema = z.object({
  name: z.string().min(1).optional(),
  contactName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  tier: z.enum(["STANDARD", "BRONZE", "SILVER", "GOLD"]).optional(),
});

export const createWarehouseSchema = z.object({
  code: z.string().min(1, "Warehouse code is required"),
  name: z.string().min(1, "Warehouse facility name is required"),
  location: z.string().optional(),
  shippingCostWeight: z.coerce.number().optional().default(1.0),
  preferenceWeight: z.coerce.number().optional().default(1.0),
  isPrimary: z.boolean().optional().default(false),
});

export const updateCeilingSchema = z.object({
  ceilingPercent: z.coerce
    .number()
    .min(0, "Ceiling percentage cannot be negative")
    .max(100, "Ceiling percentage cannot exceed 100"),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(["rep", "manager", "finance", "admin"]),
});

export const idParamSchema = z.object({
  id: z.string().min(1, "ID is required"),
});

export const customerTierParamSchema = z.object({
  tier: z.string().min(1, "Tier is required"),
});

export const categoryParamSchema = z.object({
  category: z.string().min(1, "Category is required"),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type CreateWarehouseInput = z.infer<typeof createWarehouseSchema>;
export type UpdateCeilingInput = z.infer<typeof updateCeilingSchema>;
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
