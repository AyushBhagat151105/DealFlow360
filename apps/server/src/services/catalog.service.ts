import prisma, {
  CustomerTier,
  ProductCategory,
} from "@DealFlow360/db";

export async function getCatalogProducts() {
  const products = await prisma.product.findMany({
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

export async function getCatalogCustomers() {
  const [customers, tierConfigs] = await Promise.all([
    prisma.customer.findMany({ orderBy: { name: "asc" } }),
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
  description?: string;
  category: ProductCategory;
  unit?: string;
  costPrice: number;
  basePrice: number;
  taxRate?: number;
  isPromoted?: boolean;
  minMarginThreshold?: number;
};

export async function createProduct(input: CreateProductInput) {
  return prisma.product.create({
    data: {
      sku: input.sku,
      name: input.name,
      description: input.description ?? null,
      category: input.category,
      unit: input.unit ?? "unit",
      costPrice: input.costPrice,
      basePrice: input.basePrice,
      taxRate: input.taxRate ?? 10.0,
      isPromoted: input.isPromoted ?? false,
      minMarginThreshold: input.minMarginThreshold ?? 15.0,
    },
  });
}

export type CreateCustomerInput = {
  name: string;
  contactName: string;
  email: string;
  phone?: string;
  address?: string;
  tier?: CustomerTier;
};

export async function createCustomer(input: CreateCustomerInput) {
  return prisma.customer.create({
    data: {
      name: input.name,
      contactName: input.contactName,
      email: input.email,
      phone: input.phone ?? null,
      address: input.address ?? null,
      tier: input.tier ?? CustomerTier.BRONZE,
    },
  });
}

export type CreateWarehouseInput = {
  code: string;
  name: string;
  location?: string;
  shippingCostWeight?: number;
  isPrimary?: boolean;
};

export async function createWarehouse(input: CreateWarehouseInput) {
  return prisma.warehouse.create({
    data: {
      code: input.code,
      name: input.name,
      location: input.location ?? null,
      shippingCostWeight: input.shippingCostWeight ?? 1.0,
      isPrimary: input.isPrimary ?? false,
    },
  });
}

export async function updateCustomerTierCeiling(tier: CustomerTier, ceilingPercent: number) {
  return prisma.customerTierConfig.upsert({
    where: { tier },
    update: { defaultDiscountCeiling: ceilingPercent },
    create: {
      tier,
      defaultDiscountCeiling: ceilingPercent,
    },
  });
}

export async function updateCategoryCeiling(category: ProductCategory, ceilingPercent: number) {
  return prisma.categoryDiscountCeiling.upsert({
    where: { category },
    update: { maxDiscountCeiling: ceilingPercent },
    create: {
      category,
      maxDiscountCeiling: ceilingPercent,
    },
  });
}

