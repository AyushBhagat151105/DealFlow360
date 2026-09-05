import { useState, useMemo } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  Search,
  ArrowRight,
  UserCircle,
  Package,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useProducts, useCustomers } from "@/hooks/use-catalog";
import { useSubmitQuoteForApproval } from "@/hooks/use-quotes";
import { UpsellDrawer, UpsellDrawerContent } from "@/components/upsell-drawer";
import { LiveMarginIndicator } from "@/components/live-margin-indicator";
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
import { Separator } from "@/components/ui/separator";
import type { Customer, Product, UpsellSuggestion } from "@/lib/mock-data";
import { useAuthStore } from "@/stores/auth-store";

export const Route = createFileRoute("/workspace/builder")({
  component: BuilderComponent,
});

interface CartLine {
  productId: string;
  productName: string;
  sku: string;
  category: "HARDWARE" | "SERVICE" | "SUBSCRIPTION";
  quantity: number;
  unitPrice: number;
  costPrice: number;
  minMarginThreshold: number;
  discountPercent: number;
}

function calcLineSubtotal(line: CartLine): number {
  return line.unitPrice * line.quantity * (1 - line.discountPercent / 100);
}

function calcLineMarginPercent(line: CartLine): number {
  const subtotal = calcLineSubtotal(line);
  const cost = line.costPrice * line.quantity;
  if (subtotal <= 0) return 0;
  return ((subtotal - cost) / subtotal) * 100;
}

function calcBlendedRiskScore(
  lines: CartLine[],
  customer: Customer | null
): { score: number; level: "NONE" | "SALES_MANAGER" | "FINANCE" } {
  let score = 0;

  for (const line of lines) {
    const lineMargin = calcLineMarginPercent(line);
    if (lineMargin < line.minMarginThreshold) {
      score += Math.ceil(line.minMarginThreshold - lineMargin);
    }
    if (customer && line.discountPercent > customer.allowedDiscountCeiling) {
      score += 3;
    }
  }

  const level: "NONE" | "SALES_MANAGER" | "FINANCE" =
    score === 0 ? "NONE" : score <= 10 ? "SALES_MANAGER" : "FINANCE";

  return { score, level };
}

function calcBlendedMargin(lines: CartLine[]): number {
  const totalSubtotal = lines.reduce((s, l) => s + calcLineSubtotal(l), 0);
  const totalCost = lines.reduce((s, l) => s + l.costPrice * l.quantity, 0);
  if (totalSubtotal <= 0) return 0;
  return ((totalSubtotal - totalCost) / totalSubtotal) * 100;
}

const TIER_BADGE_STYLES: Record<string, string> = {
  GOLD: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  SILVER: "bg-slate-400/15 text-slate-500 dark:text-slate-300 border-slate-400/30",
  BRONZE: "bg-orange-700/15 text-orange-700 dark:text-orange-400 border-orange-700/30",
};

function CustomerSelector({
  customers,
  selected,
  onSelect,
}: {
  customers: Customer[];
  selected: Customer | null;
  onSelect: (c: Customer) => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search customers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8 h-8 text-xs"
        />
      </div>
      <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
        {filtered.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onSelect(c)}
            className={`w-full text-left p-2.5 rounded-none border text-xs transition-colors cursor-pointer ${
              selected?.id === c.id
                ? "border-primary/60 bg-primary/5"
                : "border-border hover:border-border/80 hover:bg-muted/40 bg-card"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground">{c.name}</span>
              <Badge className={`text-[10px] px-1.5 py-0 border ${TIER_BADGE_STYLES[c.tier]}`}>
                {c.tier}
              </Badge>
            </div>
            <div className="flex items-center gap-3 mt-1 text-muted-foreground">
              <span>{c.contactName}</span>
              <span className="font-mono">Discount ceiling: {c.allowedDiscountCeiling}%</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function BuilderComponent() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { data: products = [] } = useProducts();
  const { data: customers = [] } = useCustomers();
  const submitMutation = useSubmitQuoteForApproval();

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [notes, setNotes] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);

  const filteredProducts = useMemo(() => {
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.sku.toLowerCase().includes(productSearch.toLowerCase())
    );
  }, [products, productSearch]);

  const blendedMargin = useMemo(() => calcBlendedMargin(cart), [cart]);
  const { score: riskScore, level: approvalLevel } = useMemo(
    () => calcBlendedRiskScore(cart, selectedCustomer),
    [cart, selectedCustomer]
  );
  const totalSubtotal = useMemo(
    () => cart.reduce((s, l) => s + calcLineSubtotal(l), 0),
    [cart]
  );

  const addProductToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((l) => l.productId === product.id);
      if (existing) {
        return prev.map((l) =>
          l.productId === product.id ? { ...l, quantity: l.quantity + 1 } : l
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          category: product.category,
          quantity: 1,
          unitPrice: product.basePrice,
          costPrice: product.costPrice,
          minMarginThreshold: product.minMarginThreshold,
          discountPercent: 0,
        },
      ];
    });
    toast.success(`Added "${product.name}" to quote.`);
  };

  const addUpsellToCart = (suggestion: UpsellSuggestion) => {
    const product = products.find((p) => p.id === suggestion.productId);
    if (product) {
      addProductToCart(product);
    } else {
      setCart((prev) => {
        const existing = prev.find((l) => l.productId === suggestion.productId);
        if (existing) return prev.map((l) => l.productId === suggestion.productId ? { ...l, quantity: l.quantity + 1 } : l);
        return [
          ...prev,
          {
            productId: suggestion.productId,
            productName: suggestion.name,
            sku: suggestion.productId,
            category: suggestion.category,
            quantity: 1,
            unitPrice: suggestion.basePrice,
            costPrice: suggestion.costPrice ?? suggestion.basePrice * 0.5,
            minMarginThreshold: 20,
            discountPercent: 0,
          },
        ];
      });
      toast.success(`Added "${suggestion.name}" to quote.`);
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((l) => (l.productId === productId ? { ...l, quantity: Math.max(1, l.quantity + delta) } : l))
    );
  };

  const updateDiscount = (productId: string, val: string) => {
    const num = Math.min(100, Math.max(0, parseFloat(val) || 0));
    setCart((prev) =>
      prev.map((l) => (l.productId === productId ? { ...l, discountPercent: num } : l))
    );
  };

  const removeLine = (productId: string) => {
    setCart((prev) => prev.filter((l) => l.productId !== productId));
  };

  const handleSubmit = () => {
    if (!selectedCustomer) {
      toast.error("Please select a customer before submitting.");
      return;
    }
    if (cart.length === 0) {
      toast.error("Add at least one product to the quote.");
      return;
    }
    setSubmitDialogOpen(true);
  };

  const handleConfirmSubmit = () => {
    submitMutation.mutate("new-quote", {
      onSuccess: () => {
        toast.success("Quotation submitted for approval!", {
          description: approvalLevel === "NONE"
            ? "Auto-approved — no manual review needed."
            : `Routed to ${approvalLevel === "FINANCE" ? "Finance" : "Sales Manager"} for review.`,
        });
        setSubmitDialogOpen(false);
        navigate({ to: "/workspace/approvals" });
      },
    });
  };

  const cartProductIds = cart.map((l) => l.productId);

  return (
    <div className="h-full overflow-y-auto bg-[#090d13] text-foreground">
      <div className="max-w-[1600px] mx-auto p-4 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-[#0d141b] p-4 shadow-[0_0_0_1px_rgba(148,163,184,0.04)]">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-sky-400" />
              <span className="text-[10px] uppercase tracking-[0.22em] text-slate-400">Pricing Operations</span>
            </div>
            <h1 className="text-xl font-black tracking-tight text-white">
              Quotation Builder
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Configure deal scope, discount governance, and live margin calculation in real-time.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-300 rounded-md border border-slate-700 bg-slate-900 px-3 py-2">
            <UserCircle className="h-4 w-4 text-sky-400" />
            <span>Logged in as: <span className="font-semibold text-white">{user.name}</span> ({user.role.replace("_", " ")})</span>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-4">
          {/* LEFT: Product Catalog + Cart */}
          <div className="space-y-4">
            {/* Customer Selector */}
            <Card className="border-slate-800 bg-[#0d141b] shadow-[inset_0_0_0_1px_rgba(148,163,184,0.05)]">
              <CardHeader className="p-4 pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-white">
                  <UserCircle className="h-4 w-4 text-sky-400" />
                  Select Customer Account
                  {selectedCustomer && (
                    <Badge className={`ml-2 text-[10px] px-1.5 py-0 border ${TIER_BADGE_STYLES[selectedCustomer.tier]}`}>
                      {selectedCustomer.tier} — Ceiling: {selectedCustomer.allowedDiscountCeiling}%
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <CustomerSelector
                  customers={customers}
                  selected={selectedCustomer}
                  onSelect={setSelectedCustomer}
                />
              </CardContent>
            </Card>

            {/* Product Catalog Tabs */}
            <Card className="border-slate-800 bg-[#0d141b] shadow-[inset_0_0_0_1px_rgba(148,163,184,0.05)]">
              <CardHeader className="p-4 pb-0">
                <div className="flex items-center justify-between gap-4">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2 text-white">
                    <Package className="h-4 w-4 text-sky-400" />
                    Product Catalog
                  </CardTitle>
                  <div className="relative w-48">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                    <Input
                      placeholder="Search products..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="pl-8 h-7 text-xs"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <Tabs defaultValue="HARDWARE" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 bg-muted p-1 mb-3">
                    {(["HARDWARE", "SERVICE", "SUBSCRIPTION"] as const).map((cat) => (
                      <TabsTrigger key={cat} value={cat} className="text-xs font-medium">
                        {cat.charAt(0) + cat.slice(1).toLowerCase()}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {(["HARDWARE", "SERVICE", "SUBSCRIPTION"] as const).map((cat) => (
                    <TabsContent key={cat} value={cat} className="space-y-2 mt-0">
                      {filteredProducts
                        .filter((p) => p.category === cat)
                        .map((product) => {
                          const isInCart = cart.some((l) => l.productId === product.id);
                          return (
                            <div
                              key={product.id}
                              className={`flex items-center justify-between gap-3 p-3 border rounded-none transition-colors ${
                                isInCart ? "border-primary/30 bg-primary/5" : "border-border bg-card hover:bg-muted/30"
                              }`}
                            >
                              <div className="min-w-0 space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-semibold text-foreground truncate">
                                    {product.name}
                                  </span>
                                  {product.isPromoted && (
                                    <Badge className="bg-emerald-600/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] px-1.5 py-0">
                                      Promoted
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-[11px] text-muted-foreground truncate">
                                  {product.sku} — {product.description}
                                </p>
                                <span className="text-[11px] font-mono text-muted-foreground">
                                  ${product.basePrice.toLocaleString("en-US", { minimumFractionDigits: 2 })} list price
                                </span>
                              </div>
                              <Button
                                size="sm"
                                variant={isInCart ? "secondary" : "default"}
                                onClick={() => addProductToCart(product)}
                                className="shrink-0 h-7 gap-1.5 text-xs"
                              >
                                <Plus className="h-3.5 w-3.5" />
                                {isInCart ? "Add Again" : "Add to Quote"}
                              </Button>
                            </div>
                          );
                        })}
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>

            {/* Cart Table */}
            <Card className="border-slate-800 bg-[#0d141b] shadow-[inset_0_0_0_1px_rgba(148,163,184,0.05)]">
              <CardHeader className="p-4 pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2 text-white">
                    <ShoppingCart className="h-4 w-4 text-sky-400" />
                    Line Items
                    {cart.length > 0 && (
                      <Badge variant="secondary" className="text-[10px] font-mono ml-1">
                        {cart.length} items
                      </Badge>
                    )}
                  </CardTitle>
                  <UpsellDrawer
                    onAddUpsell={addUpsellToCart}
                    addedProductIds={cartProductIds}
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {cart.length === 0 ? (
                  <div className="p-8 text-center text-xs text-muted-foreground">
                    No products added yet. Select from the catalog above.
                  </div>
                ) : (
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead className="text-xs font-bold pl-4">Product</TableHead>
                        <TableHead className="text-xs font-bold text-center">Qty</TableHead>
                        <TableHead className="text-xs font-bold text-right">Unit Price</TableHead>
                        <TableHead className="text-xs font-bold text-right w-28">Discount %</TableHead>
                        <TableHead className="text-xs font-bold text-right">Net Total</TableHead>
                        <TableHead className="text-xs font-bold text-right">Line Margin</TableHead>
                        <TableHead className="w-10" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cart.map((line) => {
                        const lineMargin = calcLineMarginPercent(line);
                        const lineTotal = calcLineSubtotal(line);
                        const isBelowThreshold = lineMargin < line.minMarginThreshold;
                        const isDiscountAboveCeiling =
                          selectedCustomer &&
                          line.discountPercent > selectedCustomer.allowedDiscountCeiling;

                        return (
                          <TableRow
                            key={line.productId}
                            className={isBelowThreshold ? "bg-destructive/5" : ""}
                          >
                            <TableCell className="pl-4">
                              <div>
                                <p className="text-xs font-semibold text-foreground">{line.productName}</p>
                                <p className="text-[10px] text-muted-foreground font-mono">{line.sku}</p>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  variant="outline"
                                  size="icon-xs"
                                  onClick={() => updateQuantity(line.productId, -1)}
                                  disabled={line.quantity <= 1}
                                  className="h-6 w-6"
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="font-mono text-xs w-6 text-center">{line.quantity}</span>
                                <Button
                                  variant="outline"
                                  size="icon-xs"
                                  onClick={() => updateQuantity(line.productId, 1)}
                                  className="h-6 w-6"
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs text-muted-foreground">
                              ${line.unitPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.5"
                                  value={line.discountPercent}
                                  onChange={(e) => updateDiscount(line.productId, e.target.value)}
                                  className={`h-7 w-20 text-right font-mono text-xs ${
                                    isDiscountAboveCeiling ? "border-amber-500/60 text-amber-600" : ""
                                  }`}
                                />
                                <span className="text-xs text-muted-foreground">%</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-mono font-bold text-xs">
                              ${lineTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell className="text-right">
                              <span
                                className={`text-xs font-mono font-bold ${
                                  isBelowThreshold
                                    ? "text-destructive"
                                    : lineMargin < 30
                                    ? "text-amber-500"
                                    : "text-emerald-500"
                                }`}
                              >
                                {lineMargin.toFixed(1)}%
                              </span>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                onClick={() => removeLine(line.productId)}
                                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Notes */}
            {cart.length > 0 && (
              <Card className="border-border bg-card">
                <CardContent className="p-4 space-y-1.5">
                  <Label className="text-xs font-semibold">Internal Notes (optional)</Label>
                  <Input
                    placeholder="e.g. Q1 workstation refresh — urgent delivery by March 31"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="h-9 text-xs"
                  />
                </CardContent>
              </Card>
            )}
          </div>

          {/* RIGHT SIDEBAR: Live Metrics + Upsell */}
          <div className="space-y-4">
            {/* Live Margin + Risk */}
            <Card className="border-slate-800 bg-[#0d141b] sticky top-4 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.05)]">
              <CardHeader className="p-4 pb-3">
                <CardTitle className="text-sm font-semibold text-white">Live Quotation Analytics</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-4">
                {cart.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">
                    Add products to see live margin and risk analysis.
                  </p>
                ) : (
                  <>
                    <LiveMarginIndicator
                      marginPercent={blendedMargin}
                      riskScore={riskScore}
                      requiredApprovalLevel={approvalLevel}
                    />

                    <Separator />

                    {/* Totals Summary */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Subtotal (Discounted)</span>
                        <span className="font-mono font-bold text-foreground">
                          ${totalSubtotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Total Cost Basis</span>
                        <span className="font-mono text-foreground">
                          ${cart.reduce((s, l) => s + l.costPrice * l.quantity, 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Gross Profit</span>
                        <span className={`font-mono font-bold ${blendedMargin >= 30 ? "text-emerald-500" : blendedMargin >= 15 ? "text-amber-500" : "text-destructive"}`}>
                          ${(totalSubtotal - cart.reduce((s, l) => s + l.costPrice * l.quantity, 0)).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      {selectedCustomer && (
                        <div className="flex justify-between text-xs pt-1 border-t border-border/40">
                          <span className="text-muted-foreground">Customer Tier</span>
                          <Badge className={`text-[10px] px-1.5 py-0 border ${TIER_BADGE_STYLES[selectedCustomer.tier]}`}>
                            {selectedCustomer.tier} (≤{selectedCustomer.allowedDiscountCeiling}%)
                          </Badge>
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* Line Violations Alert */}
                    {cart.some(
                      (l) =>
                        calcLineMarginPercent(l) < l.minMarginThreshold ||
                        (selectedCustomer && l.discountPercent > selectedCustomer.allowedDiscountCeiling)
                    ) && (
                      <div className="text-[11px] bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 p-2.5 rounded-none space-y-1">
                        <p className="font-semibold">Discount Ceiling Violations:</p>
                        {cart
                          .filter(
                            (l) =>
                              calcLineMarginPercent(l) < l.minMarginThreshold ||
                              (selectedCustomer && l.discountPercent > selectedCustomer.allowedDiscountCeiling)
                          )
                          .map((l) => (
                            <p key={l.productId} className="font-mono">
                              · {l.productName}: {l.discountPercent}% discount
                            </p>
                          ))}
                      </div>
                    )}

                    <Button
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2 font-semibold"
                      onClick={handleSubmit}
                      disabled={submitMutation.isPending}
                    >
                      {submitMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ArrowRight className="h-4 w-4" />
                      )}
                      Submit for Approval
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Upsell Suggestions (inline for sidebar) */}
            {cart.length > 0 && (
              <Card className="border-slate-800 bg-[#0d141b] shadow-[inset_0_0_0_1px_rgba(148,163,184,0.05)]">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-semibold text-white">Recommended Additions</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <UpsellDrawerContent
                    onAddUpsell={addUpsellToCart}
                    addedProductIds={cartProductIds}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Submit Confirmation Dialog */}
      <Dialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
        <DialogContent className="sm:max-w-lg bg-card text-card-foreground border-border">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Submit Quotation for Approval</DialogTitle>
            <DialogDescription className="text-xs">
              Review the discount governance analysis below before submitting.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <LiveMarginIndicator
              marginPercent={blendedMargin}
              riskScore={riskScore}
              requiredApprovalLevel={approvalLevel}
            />

            <Separator />

            <div className="space-y-2 text-xs">
              <p className="font-semibold text-foreground">Line Item Breakdown:</p>
              {cart.map((line) => {
                const margin = calcLineMarginPercent(line);
                const isBad = margin < line.minMarginThreshold;
                return (
                  <div key={line.productId} className="flex justify-between text-muted-foreground">
                    <span>{line.productName}</span>
                    <span className={`font-mono font-bold ${isBad ? "text-destructive" : "text-emerald-500"}`}>
                      {margin.toFixed(1)}% margin {isBad ? `(min: ${line.minMarginThreshold}%)` : "✓"}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between text-sm font-bold">
              <span>Total Value</span>
              <span className="font-mono">${totalSubtotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setSubmitDialogOpen(false)}>
              Back to Edit
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmSubmit}
              disabled={submitMutation.isPending}
              className="bg-primary text-primary-foreground gap-1.5"
            >
              {submitMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Confirm & Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
