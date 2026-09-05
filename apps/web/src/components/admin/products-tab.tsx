import { useState, useMemo } from "react";
import { Package, Boxes, TrendingUp, Percent, Search, Plus } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { TablePagination } from "@/components/ui/pagination";
import {
  useProducts,
  usePaginatedProducts,
  useSubscriptionPlans,
  useCreateProduct,
} from "@/hooks/use-catalog";
import type { ProductCategory } from "@/lib/api-types";
import { currencyFormatter, CATEGORY_STYLES } from "./admin-utils";

export function ProductsTab() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  const productsQuery = useProducts();
  const paginatedProductsQuery = usePaginatedProducts({
    page,
    limit: pageSize,
    search: search || undefined,
    category: categoryFilter === "ALL" ? undefined : categoryFilter,
  });
  const plansQuery = useSubscriptionPlans();
  const createProductMutation = useCreateProduct();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [productName, setProductName] = useState("");
  const [productSku, setProductSku] = useState("");
  const [productCategory, setProductCategory] = useState<ProductCategory>("HARDWARE");
  const [productListPrice, setProductListPrice] = useState("");
  const [productStandardCost, setProductStandardCost] = useState("");
  const [productMinMargin, setProductMinMargin] = useState("15");
  const [productTaxRate, setProductTaxRate] = useState("10");
  const [productDescription, setProductDescription] = useState("");

  const allProducts = productsQuery.data ?? [];
  const paginatedData = paginatedProductsQuery.data;
  const products = paginatedData?.products ?? [];
  const plans = plansQuery.data ?? [];

  const calcPreviewMargin = () => {
    const lp = parseFloat(productListPrice);
    const sc = parseFloat(productStandardCost);
    if (isNaN(lp) || isNaN(sc) || lp <= 0) return 0;
    return ((lp - sc) / lp) * 100;
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const listPrice = parseFloat(productListPrice);
    const standardCost = parseFloat(productStandardCost);

    if (!productName || !productSku || isNaN(listPrice) || isNaN(standardCost)) {
      toast.error("Please fill in all required product fields");
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
      setDialogOpen(false);
      setProductName("");
      setProductSku("");
      setProductListPrice("");
      setProductStandardCost("");
      setProductDescription("");
    } catch {
      toast.error("Failed to create product");
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-lg border-border bg-card shadow-none">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs">Total Products</span>
              <Package className="h-4 w-4 text-primary" />
            </div>
            <p className="text-2xl font-semibold">{allProducts.length}</p>
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
              {allProducts.filter((p) => p.category === "HARDWARE").length}
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
              {allProducts.filter((p) => p.category !== "HARDWARE").length + plans.length}
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
              {allProducts.length > 0
                ? (
                  allProducts.reduce(
                    (acc, p) =>
                      acc +
                      (p.basePrice > 0
                        ? ((p.basePrice - p.costPrice) / p.basePrice) * 100
                        : 0),
                    0
                  ) / allProducts.length
                ).toFixed(1)
                : 0}
              %
            </p>
            <p className="text-[11px] text-muted-foreground">Target list margin ceiling</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search by SKU or Product Name..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-8 h-9 text-xs"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="h-9 px-3 text-xs bg-card border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="ALL">All Categories</option>
            <option value="HARDWARE">Hardware</option>
            <option value="SERVICE">Services</option>
            <option value="SUBSCRIPTION">Subscriptions</option>
          </select>
        </div>

        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

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
            {paginatedProductsQuery.isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-sm text-muted-foreground">
                  Loading catalog products...
                </TableCell>
              </TableRow>
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-sm text-muted-foreground">
                  No products found matching criteria.
                </TableCell>
              </TableRow>
            ) : (
              products.map((p) => {
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
        <TablePagination
          page={page}
          pageSize={pageSize}
          total={paginatedData?.total ?? 0}
          totalPages={paginatedData?.totalPages ?? 1}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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

              <div className="flex items-center justify-between p-2.5 bg-muted/40 border border-border rounded">
                <span className="text-[11px] text-muted-foreground">Expected List Margin:</span>
                <span
                  className={`font-mono font-bold text-xs ${calcPreviewMargin() >= 30
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
              <Button type="button" variant="outline" size="sm" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={createProductMutation.isPending}>
                {createProductMutation.isPending ? "Creating..." : "Save Product"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

