import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Package,
  Users,
  Warehouse as WarehouseIcon,
  SlidersHorizontal,
  Plus,
  Search,
  RefreshCw,
  TrendingUp,
  Percent,
  Building2,
  Boxes,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  useCeilingMatrix,
  useUpdateCategoryCeiling,
  useUpdateCustomerTierCeiling,
} from "@/hooks/use-admin-config";
import {
  useCreateCustomer,
  useCreateProduct,
  useCreateWarehouse,
  useCustomers,
  useProducts,
  useReplenishStock,
  useSubscriptionPlans,
  useWarehouses,
} from "@/hooks/use-catalog";
import type { CustomerTier, ProductCategory } from "@/lib/api-types";

export const Route = createFileRoute("/admin")({
  component: AdminComponent,
});

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const TIER_STYLES: Record<string, string> = {
  GOLD: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  SILVER: "bg-slate-400/15 text-slate-500 dark:text-slate-300 border-slate-400/30",
  BRONZE: "bg-orange-700/15 text-orange-700 dark:text-orange-400 border-orange-700/30",
  STANDARD: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
};

const CATEGORY_STYLES: Record<string, string> = {
  HARDWARE: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
  SERVICE: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  SUBSCRIPTION: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30",
  SOFTWARE_SUBSCRIPTION: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30",
};

function AdminComponent() {
  const [activeTab, setActiveTab] = useState("products");

  // Queries
  const productsQuery = useProducts();
  const customersQuery = useCustomers();
  const warehousesQuery = useWarehouses();
  const plansQuery = useSubscriptionPlans();
  const ceilingsQuery = useCeilingMatrix();

  // Mutations
  const createProductMutation = useCreateProduct();
  const createCustomerMutation = useCreateCustomer();
  const createWarehouseMutation = useCreateWarehouse();
  const replenishStockMutation = useReplenishStock();
  const updateTierCeilingMutation = useUpdateCustomerTierCeiling();
  const updateCategoryCeilingMutation = useUpdateCategoryCeiling();

  // Dialog States
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [warehouseDialogOpen, setWarehouseDialogOpen] = useState(false);
  const [replenishDialogOpen, setReplenishDialogOpen] = useState(false);

  // Form States - Product
  const [productName, setProductName] = useState("");
  const [productSku, setProductSku] = useState("");
  const [productCategory, setProductCategory] = useState<ProductCategory>("HARDWARE");
  const [productListPrice, setProductListPrice] = useState("");
  const [productStandardCost, setProductStandardCost] = useState("");
  const [productMinMargin, setProductMinMargin] = useState("15");
  const [productTaxRate, setProductTaxRate] = useState("10");
  const [productDescription, setProductDescription] = useState("");

  // Form States - Customer
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerContact, setCustomerContact] = useState("");
  const [customerCompany, setCustomerCompany] = useState("");
  const [customerTier, setCustomerTier] = useState<CustomerTier>("BRONZE");

  // Form States - Warehouse
  const [warehouseName, setWarehouseName] = useState("");
  const [warehouseCode, setWarehouseCode] = useState("");
  const [warehouseLocation, setWarehouseLocation] = useState("");
  const [warehouseWeight, setWarehouseWeight] = useState("1.0");

  // Form States - Replenish
  const [replenishWarehouseId, setReplenishWarehouseId] = useState("");
  const [replenishProductId, setReplenishProductId] = useState("");
  const [replenishQuantity, setReplenishQuantity] = useState("10");

  // Filter States
  const [productSearch, setProductSearch] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] = useState("ALL");
  const [customerSearch, setCustomerSearch] = useState("");

  const products = productsQuery.data ?? [];
  const customers = customersQuery.data ?? [];
  const warehouses = warehousesQuery.data ?? [];
  const plans = plansQuery.data ?? [];
  const ceilings = ceilingsQuery.data;

  // Filtered lists
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.sku.toLowerCase().includes(productSearch.toLowerCase());
      const matchesCategory =
        productCategoryFilter === "ALL" ||
        p.category === productCategoryFilter ||
        (productCategoryFilter === "SUBSCRIPTION" && p.category === "SOFTWARE_SUBSCRIPTION");
      return matchesSearch && matchesCategory;
    });
  }, [products, productSearch, productCategoryFilter]);

  const filteredCustomers = useMemo(() => {
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        c.email.toLowerCase().includes(customerSearch.toLowerCase()) ||
        (c.company && c.company.toLowerCase().includes(customerSearch.toLowerCase()))
    );
  }, [customers, customerSearch]);

  // Handlers
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName || !productSku || !productListPrice || !productStandardCost) {
      toast.error("Please fill in all required product fields");
      return;
    }
    const listPrice = parseFloat(productListPrice);
    const standardCost = parseFloat(productStandardCost);
    if (isNaN(listPrice) || isNaN(standardCost) || listPrice <= 0 || standardCost < 0) {
      toast.error("Valid positive list price and standard cost are required");
      return;
    }

    try {
      await createProductMutation.mutateAsync({
        name: productName,
        sku: productSku,
        category: productCategory,
        listPrice,
        standardCost,
        minMarginThreshold: parseFloat(productMinMargin) || 15,
        taxRate: parseFloat(productTaxRate) || 10,
        description: productDescription,
      });
      toast.success(`Catalog product "${productName}" created successfully`);
      setProductDialogOpen(false);
      // Reset
      setProductName("");
      setProductSku("");
      setProductListPrice("");
      setProductStandardCost("");
      setProductDescription("");
    } catch {
      toast.error("Failed to create product");
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerEmail) {
      toast.error("Name and Email are required");
      return;
    }

    try {
      await createCustomerMutation.mutateAsync({
        name: customerName,
        email: customerEmail,
        contactName: customerContact || customerName,
        company: customerCompany || customerName,
        tier: customerTier,
      });
      toast.success(`Customer "${customerName}" added to ${customerTier} tier`);
      setCustomerDialogOpen(false);
      setCustomerName("");
      setCustomerEmail("");
      setCustomerContact("");
      setCustomerCompany("");
    } catch {
      toast.error("Failed to create customer");
    }
  };

  const handleCreateWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!warehouseName || !warehouseCode || !warehouseLocation) {
      toast.error("Name, Code, and Location are required");
      return;
    }

    try {
      await createWarehouseMutation.mutateAsync({
        name: warehouseName,
        code: warehouseCode,
        location: warehouseLocation,
        preferenceWeight: parseFloat(warehouseWeight) || 1.0,
      });
      toast.success(`Warehouse facility "${warehouseName}" created`);
      setWarehouseDialogOpen(false);
      setWarehouseName("");
      setWarehouseCode("");
      setWarehouseLocation("");
    } catch {
      toast.error("Failed to create warehouse");
    }
  };

  const handleReplenishStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replenishWarehouseId || !replenishProductId) {
      toast.error("Select warehouse and product");
      return;
    }
    const qty = parseInt(replenishQuantity, 10);
    if (isNaN(qty) || qty <= 0) {
      toast.error("Quantity must be greater than zero");
      return;
    }

    try {
      await replenishStockMutation.mutateAsync({
        warehouseId: replenishWarehouseId,
        productId: replenishProductId,
        quantityAdded: qty,
      });
      toast.success(`Replenished ${qty} units in warehouse`);
      setReplenishDialogOpen(false);
    } catch {
      toast.error("Failed to replenish stock");
    }
  };

  const handleUpdateTierCeiling = async (tier: string, currentCeiling: number) => {
    const next = prompt(`Enter new discount ceiling % for ${tier} tier:`, String(currentCeiling));
    if (next === null) return;
    const val = parseFloat(next);
    if (isNaN(val) || val < 0 || val > 100) {
      toast.error("Invalid percentage (0-100)");
      return;
    }
    try {
      await updateTierCeilingMutation.mutateAsync({ tier, ceilingPercent: val });
      toast.success(`Updated ${tier} discount ceiling to ${val}%`);
    } catch {
      toast.error("Failed to update tier ceiling");
    }
  };

  const handleUpdateCategoryCeiling = async (category: string, currentCeiling: number) => {
    const next = prompt(`Enter max discount ceiling % for ${category} category:`, String(currentCeiling));
    if (next === null) return;
    const val = parseFloat(next);
    if (isNaN(val) || val < 0 || val > 100) {
      toast.error("Invalid percentage (0-100)");
      return;
    }
    try {
      await updateCategoryCeilingMutation.mutateAsync({ category, ceilingPercent: val });
      toast.success(`Updated ${category} category ceiling to ${val}%`);
    } catch {
      toast.error("Failed to update category ceiling");
    }
  };

  const isLoading =
    productsQuery.isLoading ||
    customersQuery.isLoading ||
    warehousesQuery.isLoading ||
    ceilingsQuery.isLoading;

  if (isLoading) {
    return (
      <main className="flex min-h-full items-center justify-center bg-background p-6">
        <div className="space-y-4 text-center">
          <RefreshCw className="mx-auto h-5 w-5 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading Admin Control Center...</p>
        </div>
      </main>
    );
  }

  // Preview margin calculation for creation form
  const calcPreviewMargin = () => {
    const lp = parseFloat(productListPrice);
    const sc = parseFloat(productStandardCost);
    if (isNaN(lp) || isNaN(sc) || lp <= 0) return 0;
    return ((lp - sc) / lp) * 100;
  };

  return (
    <main className="min-h-full overflow-y-auto bg-background">
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        {/* Header */}
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs tracking-[0.08em] text-muted-foreground uppercase">
                ADMIN CONTROL CENTER
              </span>
              <Badge variant="outline" className="text-[10px] font-mono border-primary/40 text-primary">
                FULL ACCESS
              </Badge>
            </div>
            <h1 className="text-2xl font-semibold tracking-[-0.02em]">Catalog & Governance Engine</h1>
            <p className="text-sm text-muted-foreground">
              Manage product catalog items, customer tiers, warehouse facilities, inventory levels, and discount ceilings.
            </p>
          </div>
        </header>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-2xl bg-muted/60">
            <TabsTrigger value="products" className="flex items-center gap-2 text-xs">
              <Package className="h-3.5 w-3.5" />
              Products ({products.length})
            </TabsTrigger>
            <TabsTrigger value="customers" className="flex items-center gap-2 text-xs">
              <Users className="h-3.5 w-3.5" />
              Customers ({customers.length})
            </TabsTrigger>
            <TabsTrigger value="warehouses" className="flex items-center gap-2 text-xs">
              <WarehouseIcon className="h-3.5 w-3.5" />
              Warehouses ({warehouses.length})
            </TabsTrigger>
            <TabsTrigger value="ceilings" className="flex items-center gap-2 text-xs">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Discount Rules
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: PRODUCTS */}
          <TabsContent value="products" className="space-y-6">
            {/* KPI Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="rounded-lg border-border bg-card shadow-none">
                <CardContent className="p-4 space-y-1">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-xs">Total Products</span>
                    <Package className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-2xl font-semibold">{products.length}</p>
                  <p className="text-[11px] text-muted-foreground">Hardware, Services & Plans</p>
                </CardContent>
              </Card>

              <Card className="rounded-lg border-border bg-card shadow-none">
                <CardContent className="p-4 space-y-1">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-xs">Hardware SKUs</span>
                    <Boxes className="h-4 w-4 text-indigo-500" />
                  </div>
                  <p className="text-2xl font-semibold">
                    {products.filter((p) => p.category === "HARDWARE").length}
                  </p>
                  <p className="text-[11px] text-muted-foreground">Physical items requiring fulfillment</p>
                </CardContent>
              </Card>

              <Card className="rounded-lg border-border bg-card shadow-none">
                <CardContent className="p-4 space-y-1">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-xs">Services & Subscriptions</span>
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                  </div>
                  <p className="text-2xl font-semibold">
                    {products.filter((p) => p.category !== "HARDWARE").length + plans.length}
                  </p>
                  <p className="text-[11px] text-muted-foreground">Recurring & Onboarding offerings</p>
                </CardContent>
              </Card>

              <Card className="rounded-lg border-border bg-card shadow-none">
                <CardContent className="p-4 space-y-1">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-xs">Avg Catalog Margin</span>
                    <Percent className="h-4 w-4 text-amber-500" />
                  </div>
                  <p className="text-2xl font-semibold">
                    {products.length > 0
                      ? (
                          products.reduce(
                            (acc, p) =>
                              acc +
                              (p.basePrice > 0
                                ? ((p.basePrice - p.costPrice) / p.basePrice) * 100
                                : 0),
                            0
                          ) / products.length
                        ).toFixed(1)
                      : 0}
                    %
                  </p>
                  <p className="text-[11px] text-muted-foreground">Target list margin ceiling</p>
                </CardContent>
              </Card>
            </div>

            {/* Filter & Action Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 flex-1 max-w-md">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Search by SKU or Product Name..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="pl-8 h-9 text-xs"
                  />
                </div>
                <select
                  value={productCategoryFilter}
                  onChange={(e) => setProductCategoryFilter(e.target.value)}
                  className="h-9 px-3 text-xs bg-card border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="ALL">All Categories</option>
                  <option value="HARDWARE">Hardware</option>
                  <option value="SERVICE">Services</option>
                  <option value="SUBSCRIPTION">Subscriptions</option>
                </select>
              </div>

              <Button onClick={() => setProductDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Product
              </Button>
            </div>

            {/* Products Table */}
            <Card className="rounded-lg border-border bg-card shadow-none overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="text-xs font-mono">SKU</TableHead>
                    <TableHead className="text-xs">Product Name</TableHead>
                    <TableHead className="text-xs">Category</TableHead>
                    <TableHead className="text-xs text-right">Standard Cost</TableHead>
                    <TableHead className="text-xs text-right">List Price</TableHead>
                    <TableHead className="text-xs text-right">Margin %</TableHead>
                    <TableHead className="text-xs text-right">Total Stock</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-sm text-muted-foreground">
                        No products found matching criteria.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts.map((p) => {
                      const marginPct =
                        p.basePrice > 0 ? ((p.basePrice - p.costPrice) / p.basePrice) * 100 : 0;
                      return (
                        <TableRow key={p.id}>
                          <TableCell className="font-mono text-xs font-medium">{p.sku}</TableCell>
                          <TableCell>
                            <div>
                              <p className="text-xs font-semibold">{p.name}</p>
                              {p.description && (
                                <p className="text-[11px] text-muted-foreground truncate max-w-xs">
                                  {p.description}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={`text-[10px] px-1.5 py-0 border ${CATEGORY_STYLES[p.category] ?? CATEGORY_STYLES.HARDWARE}`}>
                              {p.category.replaceAll("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs">
                            {currencyFormatter.format(p.costPrice)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs font-semibold">
                            {currencyFormatter.format(p.basePrice)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs">
                            <span
                              className={
                                marginPct >= 30
                                  ? "text-emerald-500 font-medium"
                                  : marginPct >= 15
                                  ? "text-amber-500 font-medium"
                                  : "text-red-500 font-medium"
                              }
                            >
                              {marginPct.toFixed(1)}%
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs">
                            {p.category === "HARDWARE" ? (
                              <span className={p.totalStock && p.totalStock > 0 ? "text-foreground" : "text-red-500 font-medium"}>
                                {p.totalStock ?? 0} units
                              </span>
                            ) : (
                              <span className="text-muted-foreground">Unlimited</span>
                            )}
                          </TableCell>
                        </TableRow> 
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* TAB 2: CUSTOMERS */}
          <TabsContent value="customers" className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Search customer account or email..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="pl-8 h-9 text-xs"
                />
              </div>

              <Button onClick={() => setCustomerDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Customer Account
              </Button>
            </div>

            <Card className="rounded-lg border-border bg-card shadow-none overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="text-xs">Account / Company</TableHead>
                    <TableHead className="text-xs">Contact Person</TableHead>
                    <TableHead className="text-xs">Email</TableHead>
                    <TableHead className="text-xs">Customer Tier</TableHead>
                    <TableHead className="text-xs text-right">Discount Ceiling</TableHead>
                    <TableHead className="text-xs text-right">Historical Avg Discount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-sm text-muted-foreground">
                        No customers found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCustomers.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium text-xs">
                          <div>
                            <p className="font-semibold">{c.name}</p>
                            {c.company && c.company !== c.name && (
                              <p className="text-[11px] text-muted-foreground">{c.company}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{c.contactName || c.name}</TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground">{c.email}</TableCell>
                        <TableCell>
                          <Badge className={`text-[10px] px-1.5 py-0 border ${TIER_STYLES[c.tier]}`}>
                            {c.tier}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs font-semibold">
                          {c.allowedDiscountCeiling ?? 5}%
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs text-muted-foreground">
                          {c.historicalAvgDiscount ? `${c.historicalAvgDiscount.toFixed(1)}%` : "N/A"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* TAB 3: WAREHOUSES & INVENTORY */}
          <TabsContent value="warehouses" className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold">Fulfillment Warehouses</h3>
                <p className="text-xs text-muted-foreground">Stock repositories used for multi-warehouse allocation splits.</p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setReplenishDialogOpen(true)} className="gap-2">
                  <Boxes className="h-4 w-4 text-primary" />
                  Replenish Stock
                </Button>
                <Button onClick={() => setWarehouseDialogOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Warehouse
                </Button>
              </div>
            </div>

            {/* Warehouse Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {warehouses.map((w) => (
                <Card key={w.id} className="rounded-lg border-border bg-card shadow-none p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
                        CODE: {w.code}
                      </span>
                      <h4 className="text-base font-semibold">{w.name}</h4>
                    </div>
                    <Badge variant="outline" className="font-mono text-[10px]">
                      Weight: {w.shippingCostWeight ?? 1.0}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p className="flex items-center gap-1">
                      <Building2 className="h-3.5 w-3.5 text-primary" />
                      {w.location || "Central Depot"}
                    </p>
                    <p className="font-mono text-[11px]">
                      Tracked SKUs: {w.stocks?.length ?? 0}
                    </p>
                  </div>
                </Card>
              ))}
            </div>

            {/* Warehouse Stock Details Table */}
            <Card className="rounded-lg border-border bg-card shadow-none overflow-hidden">
              <CardHeader className="border-b border-border bg-muted/20">
                <CardTitle className="text-xs font-mono tracking-wider uppercase text-muted-foreground flex items-center justify-between">
                  <span>Inventory Stock Table</span>
                  <span>{warehouses.reduce((acc, w) => acc + (w.stocks?.length ?? 0), 0)} Total Allocations</span>
                </CardTitle>
              </CardHeader>
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="text-xs font-mono">Warehouse Code</TableHead>
                    <TableHead className="text-xs">Product</TableHead>
                    <TableHead className="text-xs text-right">Quantity On Hand</TableHead>
                    <TableHead className="text-xs text-right">Reserved Units</TableHead>
                    <TableHead className="text-xs text-right">Net Available</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {warehouses.flatMap((w) => w.stocks ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-sm text-muted-foreground">
                        No inventory stock entries found. Click "Replenish Stock" to add inventory.
                      </TableCell>
                    </TableRow>
                  ) : (
                    warehouses.flatMap((w) =>
                      (w.stocks ?? []).map((s, idx) => {
                        const product = products.find((p) => p.id === s.productId);
                        const available = Math.max(0, s.quantityOnHand - (s.reserved ?? 0));
                        return (
                          <TableRow key={`${w.id}-${s.productId}-${idx}`}>
                            <TableCell className="font-mono text-xs font-semibold">{w.code}</TableCell>
                            <TableCell className="text-xs">
                              <span className="font-medium">{product?.name ?? s.productId}</span>
                              {product && <span className="font-mono text-[11px] text-muted-foreground ml-2">({product.sku})</span>}
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs">{s.quantityOnHand}</TableCell>
                            <TableCell className="text-right font-mono text-xs text-muted-foreground">{s.reserved ?? 0}</TableCell>
                            <TableCell className="text-right font-mono text-xs font-semibold">
                              <span className={available > 0 ? "text-emerald-500" : "text-red-500"}>
                                {available}
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* TAB 4: DISCOUNT CEILINGS */}
          <TabsContent value="ceilings" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Customer Tier Ceilings */}
              <Card className="rounded-lg border-border bg-card shadow-none">
                <CardHeader className="border-b border-border">
                  <CardTitle className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-amber-500" />
                      Customer Tier Discount Ceilings
                    </span>
                    <Badge variant="outline" className="text-[10px]">Auto-Calculated</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 divide-y divide-border">
                  {ceilings?.customerTiers.map((t, idx) => (
                    <div key={`${t.tier}-${idx}`} className="flex items-center justify-between p-4">
                      <div className="space-y-0.5">
                        <span className="text-sm font-semibold">{t.tier} Tier</span>
                        <p className="text-[11px] text-muted-foreground">Default Rep discount ceiling limit</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-bold text-amber-500">
                          {t.defaultDiscountCeiling}%
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleUpdateTierCeiling(t.tier!, t.defaultDiscountCeiling ?? 5)}
                          className="h-7 text-xs font-mono"
                        >
                          Edit
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Product Category Ceilings */}
              <Card className="rounded-lg border-border bg-card shadow-none">
                <CardHeader className="border-b border-border">
                  <CardTitle className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Percent className="h-4 w-4 text-indigo-500" />
                      Product Category Ceilings
                    </span>
                    <Badge variant="outline" className="text-[10px]">Governance</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 divide-y divide-border">
                  {ceilings?.productCategories.map((c, idx) => (
                    <div key={`${c.category}-${idx}`} className="flex items-center justify-between p-4">
                      <div className="space-y-0.5">
                        <span className="text-sm font-semibold">{c.category?.replaceAll("_", " ")}</span>
                        <p className="text-[11px] text-muted-foreground">Maximum ceiling allowed for category</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-bold text-indigo-500">
                          {c.maxDiscountCeiling}%
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleUpdateCategoryCeiling(c.category!, c.maxDiscountCeiling ?? 15)}
                          className="h-7 text-xs font-mono"
                        >
                          Edit
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* DIALOG 1: ADD PRODUCT */}
      <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleCreateProduct}>
            <DialogHeader>
              <DialogTitle className="text-base">Add Catalog Product</DialogTitle>
              <DialogDescription className="text-xs">
                Create a new Hardware, Service, or Subscription product for Sales Representatives.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                
                <div className="space-y-1">
                  <Label htmlFor="p-sku">SKU Code *</Label>
                  <Input
                    id="p-sku"
                    placeholder="e.g. HW-LAPTOP-01"
                    value={productSku}
                    onChange={(e) => setProductSku(e.target.value.toUpperCase())}
                    className="font-mono text-xs h-8"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="p-category">Category *</Label>
                  <select
                    id="p-category"
                    value={productCategory}
                    onChange={(e) => setProductCategory(e.target.value as ProductCategory)}
                    className="w-full h-8 px-2 text-xs bg-card border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="HARDWARE">Hardware</option>
                    <option value="SERVICE">Service</option>
                    <option value="SOFTWARE_SUBSCRIPTION">Software Subscription</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="p-name">Product Name *</Label>
                <Input
                  id="p-name"
                  placeholder="e.g. High-Performance Workstation Dock"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="text-xs h-8"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="p-cost">Standard Cost ($) *</Label>
                  <Input
                    id="p-cost"
                    type="number"
                    step="0.01"
                    placeholder="250.00"
                    value={productStandardCost}
                    onChange={(e) => setProductStandardCost(e.target.value)}
                    className="font-mono text-xs h-8"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="p-list">Base List Price ($) *</Label>
                  <Input
                    id="p-list"
                    type="number"
                    step="0.01"
                    placeholder="499.00"
                    value={productListPrice}
                    onChange={(e) => setProductListPrice(e.target.value)}
                    className="font-mono text-xs h-8"
                    required
                  />
                </div>
              </div>

              {/* Dynamic Margin Readout */}
              <div className="flex items-center justify-between p-2.5 bg-muted/40 border border-border rounded">
                <span className="text-[11px] text-muted-foreground">Expected List Margin:</span>
                <span
                  className={`font-mono font-bold text-xs ${
                    calcPreviewMargin() >= 30
                      ? "text-emerald-500"
                      : calcPreviewMargin() >= 15
                      ? "text-amber-500"
                      : "text-red-500"
                  }`}
                >
                  {calcPreviewMargin().toFixed(1)}%
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="p-margin">Min Margin Threshold (%)</Label>
                  <Input
                    id="p-margin"
                    type="number"
                    placeholder="15"
                    value={productMinMargin}
                    onChange={(e) => setProductMinMargin(e.target.value)}
                    className="font-mono text-xs h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="p-tax">Tax Rate (%)</Label>
                  <Input
                    id="p-tax"
                    type="number"
                    placeholder="10"
                    value={productTaxRate}
                    onChange={(e) => setProductTaxRate(e.target.value)}
                    className="font-mono text-xs h-8"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="p-desc">Description</Label>
                <Input
                  id="p-desc"
                  placeholder="Optional brief specifications"
                  value={productDescription}
                  onChange={(e) => setProductDescription(e.target.value)}
                  className="text-xs h-8"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setProductDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={createProductMutation.isPending}>
                {createProductMutation.isPending ? "Creating..." : "Save Product"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG 2: ADD CUSTOMER */}
      <Dialog open={customerDialogOpen} onOpenChange={setCustomerDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleCreateCustomer}>
            <DialogHeader>
              <DialogTitle className="text-base">Add Customer Account</DialogTitle>
              <DialogDescription className="text-xs">
                Create a customer profile and assign a discount tier ceiling.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 py-4 text-xs">
              <div className="space-y-1">
                <Label htmlFor="c-name">Account / Company Name *</Label>
                <Input
                  id="c-name"
                  placeholder="Acme Corporation"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="text-xs h-8"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="c-email">Contact Email *</Label>
                <Input
                  id="c-email"
                  type="email"
                  placeholder="procurement@acme.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="font-mono text-xs h-8"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="c-contact">Contact Person Name</Label>
                  <Input
                    id="c-contact"
                    placeholder="Jane Doe"
                    value={customerContact}
                    onChange={(e) => setCustomerContact(e.target.value)}
                    className="text-xs h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="c-tier">Customer Tier *</Label>
                  <select
                    id="c-tier"
                    value={customerTier}
                    onChange={(e) => setCustomerTier(e.target.value as CustomerTier)}
                    className="w-full h-8 px-2 text-xs bg-card border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="GOLD">GOLD (Highest Ceiling)</option>
                    <option value="SILVER">SILVER</option>
                    <option value="BRONZE">BRONZE</option>
                    <option value="STANDARD">STANDARD</option>
                  </select>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setCustomerDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={createCustomerMutation.isPending}>
                {createCustomerMutation.isPending ? "Adding..." : "Save Customer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG 3: ADD WAREHOUSE */}
      <Dialog open={warehouseDialogOpen} onOpenChange={setWarehouseDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleCreateWarehouse}>
            <DialogHeader>
              <DialogTitle className="text-base">Add Warehouse Facility</DialogTitle>
              <DialogDescription className="text-xs">
                Register a fulfillment warehouse depot for inventory auto-splits.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 py-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="w-code">Facility Code *</Label>
                  <Input
                    id="w-code"
                    placeholder="CHI-MAIN"
                    value={warehouseCode}
                    onChange={(e) => setWarehouseCode(e.target.value.toUpperCase())}
                    className="font-mono text-xs h-8"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="w-weight">Preference Weight</Label>
                  <Input
                    id="w-weight"
                    type="number"
                    step="0.1"
                    placeholder="1.0"
                    value={warehouseWeight}
                    onChange={(e) => setWarehouseWeight(e.target.value)}
                    className="font-mono text-xs h-8"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="w-name">Facility Name *</Label>
                <Input
                  id="w-name"
                  placeholder="Chicago Primary Logistics Center"
                  value={warehouseName}
                  onChange={(e) => setWarehouseName(e.target.value)}
                  className="text-xs h-8"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="w-loc">Location / Address *</Label>
                <Input
                  id="w-loc"
                  placeholder="Chicago, IL Depot"
                  value={warehouseLocation}
                  onChange={(e) => setWarehouseLocation(e.target.value)}
                  className="text-xs h-8"
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setWarehouseDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={createWarehouseMutation.isPending}>
                {createWarehouseMutation.isPending ? "Creating..." : "Save Warehouse"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG 4: REPLENISH STOCK */}
      <Dialog open={replenishDialogOpen} onOpenChange={setReplenishDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleReplenishStock}>
            <DialogHeader>
              <DialogTitle className="text-base">Replenish Warehouse Inventory</DialogTitle>
              <DialogDescription className="text-xs">
                Add stock units directly to a warehouse repository.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 py-4 text-xs">
              <div className="space-y-1">
                <Label htmlFor="r-warehouse">Select Warehouse *</Label>
                <select
                  id="r-warehouse"
                  value={replenishWarehouseId}
                  onChange={(e) => setReplenishWarehouseId(e.target.value)}
                  className="w-full h-8 px-2 text-xs bg-card border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                >
                  <option value="">-- Choose Warehouse --</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="r-product">Select Product *</Label>
                <select
                  id="r-product"
                  value={replenishProductId}
                  onChange={(e) => setReplenishProductId(e.target.value)}
                  className="w-full h-8 px-2 text-xs bg-card border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                >
                  <option value="">-- Choose Hardware Product --</option>
                  {products
                    .filter((p) => p.category === "HARDWARE")
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku})
                      </option>
                    ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="r-qty">Quantity to Add (+Units) *</Label>
                <Input
                  id="r-qty"
                  type="number"
                  placeholder="10"
                  value={replenishQuantity}
                  onChange={(e) => setReplenishQuantity(e.target.value)}
                  className="font-mono text-xs h-8"
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setReplenishDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={replenishStockMutation.isPending}>
                {replenishStockMutation.isPending ? "Replenishing..." : "Add Stock Units"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
