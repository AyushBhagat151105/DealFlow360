import prisma, {
  CustomerTier,
  ProductCategory,
  type Prisma,
} from "@DealFlow360/db";
import { NotFoundError, ValidationError } from "../utils/errors";
import { getPaginationParams, buildPaginationMeta } from "../utils/pagination";

export type CatalogProductsQuery = {
  page?: number;
  limit?: number;
  search?: string;
  category?: ProductCategory;
  all?: boolean;
};

export async function getCatalogProducts(query?: CatalogProductsQuery) {
  const where: Prisma.ProductWhereInput = {};

  if (query?.category) {
    where.category = query.category;
  }
  if (query?.search) {
    const term = query.search.trim();
    where.OR = [
      { name: { contains: term, mode: "insensitive" } },
      { sku: { contains: term, mode: "insensitive" } },
      { description: { contains: term, mode: "insensitive" } },
    ];
  }

  const isPaginated = !query?.all && (query?.page !== undefined || query?.limit !== undefined);

  if (isPaginated) {
    const { page, limit, skip } = getPaginationParams(query ?? {}, 20);

    const [rawProducts, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          variants: true,
          stocks: true,
        },
        orderBy: { name: "asc" },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    const products = rawProducts.map((p) => {
      const totalStock = p.stocks.reduce(
        (acc, s) => acc + Math.max(0, s.quantityOnHand - s.reservedQuantity),
        0,
      );
      return {
        ...p,
        totalStock,
      };
    });

    const meta = buildPaginationMeta(total, page, limit);

    return {
      products,
      total,
      page: meta.page,
      limit: meta.limit,
      totalPages: meta.totalPages,
      hasMore: meta.hasMore,
    };
  }

  const products = await prisma.product.findMany({
    where,
    include: {
      variants: true,
      stocks: true,
    },
    orderBy: { name: "asc" },
  });

  return products.map((p) => {
    const totalStock = p.stocks.reduce(
      (acc, s) => acc + Math.max(0, s.quantityOnHand - s.reservedQuantity),
      0,
    );
    return {
      ...p,
      totalStock,
    };
  });
}

export type CatalogCustomersQuery = {
  page?: number;
  limit?: number;
  search?: string;
  tier?: CustomerTier;
  all?: boolean;
};

export async function getCatalogCustomers(query?: CatalogCustomersQuery) {
  const where: Prisma.CustomerWhereInput = {};

  if (query?.tier) {
    where.tier = query.tier;
  }
  if (query?.search) {
    const term = query.search.trim();
    where.OR = [
      { name: { contains: term, mode: "insensitive" } },
      { email: { contains: term, mode: "insensitive" } },
      { contactName: { contains: term, mode: "insensitive" } },
    ];
  }

  const isPaginated = !query?.all && (query?.page !== undefined || query?.limit !== undefined);

  if (isPaginated) {
    const { page, limit, skip } = getPaginationParams(query ?? {}, 20);

    const [customers, total, tierConfigs] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy: { name: "asc" },
        skip,
        take: limit,
      }),
      prisma.customer.count({ where }),
      prisma.customerTierConfig.findMany(),
    ]);

    const ceilingMap = new Map(
      tierConfigs.map((tc) => [tc.tier, tc.defaultDiscountCeiling]),
    );

    const items = customers.map((c) => ({
      ...c,
      allowedDiscountCeiling: ceilingMap.get(c.tier) ?? 5.0,
    }));

    const meta = buildPaginationMeta(total, page, limit);

    return {
      customers: items,
      total,
      page: meta.page,
      limit: meta.limit,
      totalPages: meta.totalPages,
      hasMore: meta.hasMore,
    };
  }

  const [customers, tierConfigs] = await Promise.all([
    prisma.customer.findMany({ where, orderBy: { name: "asc" } }),
    prisma.customerTierConfig.findMany(),
  ]);

  const ceilingMap = new Map(
    tierConfigs.map((tc) => [tc.tier, tc.defaultDiscountCeiling]),
  );

  return customers.map((c) => ({
    ...c,
    allowedDiscountCeiling: ceilingMap.get(c.tier) ?? 5.0,
  }));
}

export async function getCatalogWarehouses() {
  return prisma.warehouse.findMany({
    include: {
      stocks: {
        include: { product: true, variant: true },
      },
    },
    orderBy: { isPrimary: "desc" },
  });
}

export async function getCatalogSubscriptionPlans() {
  return prisma.subscriptionPlan.findMany({
    orderBy: { unitPrice: "asc" },
  });
}

export async function getDiscountCeilingsMatrix() {
  const [tierConfigs, categoryCeilings] = await Promise.all([
    prisma.customerTierConfig.findMany(),
    prisma.categoryDiscountCeiling.findMany(),
  ]);

  return {
    customerTiers: tierConfigs,
    productCategories: categoryCeilings,
  };
}

export type CreateProductInput = {
  sku: string;
  name: string;
  description?: string | null;
  category: ProductCategory | "SOFTWARE_SUBSCRIPTION" | "SOFTWARE";
  unit?: string;
  costPrice?: number;
  standardCost?: number;
  cost?: number;
  basePrice?: number;
  listPrice?: number;
  price?: number;
  taxRate?: number;
  isPromoted?: boolean;
  minMarginThreshold?: number;
};

export async function createProduct(input: CreateProductInput) {
  const basePrice = input.basePrice ?? input.listPrice ?? input.price;
  const costPrice = input.costPrice ?? input.standardCost ?? input.cost ?? 0;

  if (basePrice === undefined || isNaN(Number(basePrice))) {
    throw new ValidationError("basePrice (or listPrice) is required and must be a valid number.");
  }

  let category: ProductCategory = ProductCategory.HARDWARE;
  const rawCategory = String(input.category || "").toUpperCase();
  if (rawCategory === "SOFTWARE_SUBSCRIPTION" || rawCategory === "SUBSCRIPTION" || rawCategory === "SOFTWARE") {
    category = ProductCategory.SUBSCRIPTION;
  } else if (rawCategory === "SERVICE") {
    category = ProductCategory.SERVICE;
  } else {
    category = ProductCategory.HARDWARE;
  }

  return prisma.product.create({
    data: {
      sku: input.sku,
      name: input.name,
      description: input.description ?? null,
      category,
      unit: input.unit ?? "unit",
      costPrice: Number(costPrice),
      basePrice: Number(basePrice),
      taxRate: input.taxRate !== undefined ? Number(input.taxRate) : 10.0,
      isPromoted: input.isPromoted ?? false,
      minMarginThreshold: input.minMarginThreshold !== undefined ? Number(input.minMarginThreshold) : 15.0,
    },
  });
}

export type CreateCustomerInput = {
  name: string;
  contactName?: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  tier?: CustomerTier | "STANDARD" | string;
};

export async function createCustomer(input: CreateCustomerInput) {
  let tier: CustomerTier = CustomerTier.BRONZE;
  const rawTier = String(input.tier || "").toUpperCase();
  if (rawTier === "SILVER") {
    tier = CustomerTier.SILVER;
  } else if (rawTier === "GOLD") {
    tier = CustomerTier.GOLD;
  } else {
    tier = CustomerTier.BRONZE;
  }

  return prisma.customer.create({
    data: {
      name: input.name,
      contactName: input.contactName ?? input.name,
      email: input.email,
      phone: input.phone ?? null,
      address: input.address ?? null,
      tier,
    },
  });
}

export type UpdateCustomerInput = Partial<CreateCustomerInput>;

export async function updateCustomer(id: string, input: UpdateCustomerInput) {
  const existing = await prisma.customer.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError("Customer", id);
  }

  let tier = existing.tier;
  if (input.tier) {
    const rawTier = String(input.tier).toUpperCase();
    if (rawTier === "SILVER") tier = CustomerTier.SILVER;
    else if (rawTier === "GOLD") tier = CustomerTier.GOLD;
    else tier = CustomerTier.BRONZE;
  }

  return prisma.customer.update({
    where: { id },
    data: {
      name: input.name ?? existing.name,
      contactName: input.contactName !== undefined ? input.contactName : existing.contactName,
      email: input.email ?? existing.email,
      phone: input.phone !== undefined ? input.phone : existing.phone,
      address: input.address !== undefined ? input.address : existing.address,
      tier,
    },
  });
}

export async function deleteCustomer(id: string) {
  const existing = await prisma.customer.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError("Customer", id);
  }

  const quoteCount = await prisma.quotation.count({ where: { customerId: id } });
  if (quoteCount > 0) {
    throw new ValidationError(`Cannot delete customer with ${quoteCount} associated quotation(s).`);
  }

  return prisma.customer.delete({ where: { id } });
}

export type UserResponse = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
};

export type ListUsersQuery = {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  all?: boolean;
};

export async function listUsers(query?: ListUsersQuery) {
  const where: Prisma.UserWhereInput = {};

  if (query?.search) {
    const term = query.search.trim();
    where.OR = [
      { name: { contains: term, mode: "insensitive" } },
      { email: { contains: term, mode: "insensitive" } },
    ];
  }

  if (query?.role) {
    where.members = {
      some: {
        role: query.role,
      },
    };
  }

  const isPaginated = !query?.all && (query?.page !== undefined || query?.limit !== undefined);

  if (isPaginated) {
    const { page, limit, skip } = getPaginationParams(query ?? {}, 20);

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          members: true,
        },
        orderBy: { createdAt: "asc" },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    const items = users.map((u) => {
      const memberRole = u.members[0]?.role || "rep";
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: memberRole,
        createdAt: u.createdAt,
      };
    });

    const meta = buildPaginationMeta(total, page, limit);

    return {
      users: items,
      total,
      page: meta.page,
      limit: meta.limit,
      totalPages: meta.totalPages,
      hasMore: meta.hasMore,
    };
  }

  const users = await prisma.user.findMany({
    where,
    include: {
      members: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return users.map((u) => {
    const memberRole = u.members[0]?.role || "rep";
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: memberRole,
      createdAt: u.createdAt,
    };
  });
}

export async function updateUserRole(userId: string, role: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { members: true },
  });

  if (!user) {
    throw new NotFoundError("User", userId);
  }

  const firstMember = user.members[0];
  if (firstMember) {
    await prisma.member.update({
      where: { id: firstMember.id },
      data: { role },
    });
  } else {
    const org = await prisma.organization.findFirst();
    if (org) {
      await prisma.member.create({
        data: {
          id: `mem_${Date.now()}`,
          userId,
          organizationId: org.id,
          role,
        },
      });
    }
  }

  return { id: user.id, name: user.name, email: user.email, role };
}

export async function deleteUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new NotFoundError("User", userId);
  }

  await prisma.user.delete({ where: { id: userId } });
  return { success: true };
}

export type CreateWarehouseInput = {
  code: string;
  name: string;
  location?: string | null;
  shippingCostWeight?: number;
  preferenceWeight?: number;
  isPrimary?: boolean;
};

export async function createWarehouse(input: CreateWarehouseInput) {
  const weight = input.shippingCostWeight ?? input.preferenceWeight ?? 1.0;
  return prisma.warehouse.create({
    data: {
      code: input.code,
      name: input.name,
      location: input.location ?? null,
      shippingCostWeight: Number(weight),
      isPrimary: input.isPrimary ?? false,
    },
  });
}

export async function updateCustomerTierCeiling(tier: string, ceilingPercent: number) {
  let resolvedTier: CustomerTier = CustomerTier.BRONZE;
  const rawTier = String(tier || "").toUpperCase();
  if (rawTier === "SILVER") resolvedTier = CustomerTier.SILVER;
  else if (rawTier === "GOLD") resolvedTier = CustomerTier.GOLD;
  else resolvedTier = CustomerTier.BRONZE;

  return prisma.customerTierConfig.upsert({
    where: { tier: resolvedTier },
    update: { defaultDiscountCeiling: ceilingPercent },
    create: {
      tier: resolvedTier,
      defaultDiscountCeiling: ceilingPercent,
    },
  });
}

export async function updateCategoryCeiling(category: string, ceilingPercent: number) {
  let resolvedCategory: ProductCategory = ProductCategory.HARDWARE;
  const rawCategory = String(category || "").toUpperCase();
  if (rawCategory === "SOFTWARE_SUBSCRIPTION" || rawCategory === "SUBSCRIPTION" || rawCategory === "SOFTWARE") {
    resolvedCategory = ProductCategory.SUBSCRIPTION;
  } else if (rawCategory === "SERVICE") {
    resolvedCategory = ProductCategory.SERVICE;
  } else {
    resolvedCategory = ProductCategory.HARDWARE;
  }

  return prisma.categoryDiscountCeiling.upsert({
    where: { category: resolvedCategory },
    update: { maxDiscountCeiling: ceilingPercent },
    create: {
      category: resolvedCategory,
      maxDiscountCeiling: ceilingPercent,
    },
  });
}
