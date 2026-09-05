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
