import { useState, useMemo, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Plus,
  ArrowLeft,
  Search,
  UserCircle,
  Package,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  Percent,
  ChevronRight,
  DollarSign,
  Activity,
  History,
} from "lucide-react";
import { toast } from "sonner";
import { useProducts, useCustomers } from "@/hooks/use-catalog";
import {
  useQuotes,
  useQuote,
  useCreateQuote,
  useQuotePreview,
  useSubmitQuoteForApproval,
  useApproveQuote,
  useRejectQuote,
  useReturnQuoteForRevision,
} from "@/hooks/use-quotes";
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
import type { Customer, Product, ProductCategory, Quote, UpsellSuggestion } from "@/lib/api-types";
import { useAuthStore } from "@/stores/auth-store";

import { CartTable, type CartLine, calcLineSubtotal, calcLineMarginPercent } from "@/components/cart-table";
import { CustomerSelector, TIER_BADGE_STYLES } from "@/components/customer-selector";

export const Route = createFileRoute("/workspace/builder")({
  component: BuilderComponent,
});

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const STATUS_BADGE_STYLES: Record<string, string> = {
  DRAFT: "bg-slate-500/15 text-slate-400 border-slate-500/30",
  PENDING_APPROVAL: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  APPROVED: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
  UNDER_NEGOTIATION: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  CONFIRMED: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  REJECTED: "bg-red-500/15 text-red-400 border-red-500/30",
  FULFILLED: "bg-teal-500/15 text-teal-400 border-teal-500/30",
};

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
    if (customer && customer.allowedDiscountCeiling !== undefined && line.discountPercent > customer.allowedDiscountCeiling) {
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

function BuilderComponent() {
  const { user } = useAuthStore();
  const [viewMode, setViewMode] = useState<"LIST" | "CREATE" | "DETAILS">("LIST");
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);

  // Queries
  const { data: quotes = [], isLoading: isQuotesLoading } = useQuotes();
  const { data: quoteDetail, isLoading: isDetailLoading } = useQuote(selectedQuoteId ?? undefined);
  const { data: products = [] } = useProducts();
  const { data: customers = [] } = useCustomers();

  // Mutations
  const createQuoteMutation = useCreateQuote();
  const {
    data: preview,
    mutate: previewQuote,
    reset: resetPreview,
  } = useQuotePreview();
  const submitMutation = useSubmitQuoteForApproval();
  const approveMutation = useApproveQuote();
  const rejectMutation = useRejectQuote();

  // Creation State
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [notes, setNotes] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);

  // Filtering State for Quotations List View
  const [listSearch, setListSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const filteredQuotes = useMemo(() => {
    return quotes.filter((q) => {
      const matchesSearch =
        q.quoteNumber.toLowerCase().includes(listSearch.toLowerCase()) ||
        q.customerName.toLowerCase().includes(listSearch.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || q.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [quotes, listSearch, statusFilter]);

  const filteredProducts = useMemo(() => {
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.sku.toLowerCase().includes(productSearch.toLowerCase())
    );
  }, [products, productSearch]);

  const localBlendedMargin = useMemo(() => calcBlendedMargin(cart), [cart]);
  const localRisk = useMemo(
    () => calcBlendedRiskScore(cart, selectedCustomer),
    [cart, selectedCustomer]
  );
  const blendedMargin = preview?.totalMarginPercent ?? localBlendedMargin;
  const riskScore = preview?.blendedRiskScore ?? localRisk.score;
  const approvalLevel = preview?.requiredApprovalLevel ?? localRisk.level;
  const totalSubtotal = useMemo(
    () => cart.reduce((s, l) => s + calcLineSubtotal(l), 0),
    [cart]
  );

  useEffect(() => {
    if (!selectedCustomer || cart.length === 0) {
      resetPreview();
      return;
    }

    previewQuote({
      customerId: selectedCustomer.id,
      lines: cart.map((line) => ({
        productId: line.productId,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        discountPercent: line.discountPercent,
      })),
    });
  }, [cart, previewQuote, resetPreview, selectedCustomer]);

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
          minMarginThreshold: product.minMarginThreshold ?? 15,
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
      prev.map((l) => (l.productId === productId ? { ...l, quantity: Math.max(1, l.quantity + delta) } : l))
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

  const handleConfirmSubmit = async () => {
    if (!selectedCustomer || cart.length === 0) return;

    try {
      const quote = await createQuoteMutation.mutateAsync({
        customerId: selectedCustomer.id,
        notes: notes || undefined,
        lines: cart.map((line) => ({
          productId: line.productId,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          discountPercent: line.discountPercent,
        })),
      });

      await submitMutation.mutateAsync({
        quoteId: quote.id,
        actorName: user.name,
        actorRole: user.role,
      });

      toast.success("Quotation created & submitted for review", {
        description:
          approvalLevel === "NONE"
            ? "Approved automatically because it is within allowed limits."
            : `Sent to ${approvalLevel === "FINANCE" ? "Finance" : "Sales Manager"} for review.`,
      });
      setSubmitDialogOpen(false);
      setCart([]);
      setSelectedCustomer(null);
      setNotes("");
      setViewMode("LIST");
    } catch {
      toast.error("We could not submit the quotation", {
        description: "Check the quotation details and try again.",
      });
    }
  };

  const handleReviewQuote = async (quoteId: string, action: "APPROVE" | "REJECT") => {
    try {
      if (action === "APPROVE") {
        await approveMutation.mutateAsync({
          quoteId,
          actorName: user.name,
          actorRole: user.role === "finance" ? "finance" : "manager",
        });
        toast.success("Quotation approved successfully");
      } else {
        await rejectMutation.mutateAsync({
          quoteId,
          reason: "Discount ceiling violation rejected during review",
        });
        toast.success("Quotation rejected");
      }
    } catch {
      toast.error("Failed to process quotation review");
    }
  };

  const cartProductIds = cart.map((l) => l.productId);

  // VIEW 1: QUOTATIONS LIST VIEW (DEFAULT)
  if (viewMode === "LIST") {
    return (
      <div className="min-h-full overflow-y-auto bg-[#090d13] text-foreground">
        <div className="max-w-[1600px] mx-auto p-4 sm:p-6 space-y-6">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-[#0d141b] p-5 shadow-[0_0_0_1px_rgba(148,163,184,0.04)]">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-[0.22em] text-slate-400 font-mono">
                  SALES OPERATIONS
                </span>
                <Badge variant="outline" className="text-[10px] border-sky-500/30 text-sky-400">
                  DEAL MANAGER
                </Badge>
              </div>
              <h1 className="text-2xl font-black tracking-tight text-white">Quotations Overview</h1>
              <p className="text-xs text-slate-400 mt-1">
                Browse customer deal quotes, inspect line discounts, or build a new quotation.
              </p>
            </div>

            <Button
              onClick={() => setViewMode("CREATE")}
              className="gap-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-4 py-2 text-xs shadow-md cursor-pointer"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              Create New Quotation
            </Button>
          </div>

          {/* Metric KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-slate-800 bg-[#0d141b] shadow-none">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs">Total Quotations</span>
                  <FileText className="h-4 w-4 text-sky-400" />
                </div>
                <p className="text-2xl font-bold text-white">{quotes.length}</p>
                <p className="text-[11px] text-slate-400">Active deal quotes in workspace</p>
              </CardContent>
            </Card>

            <Card className="border-slate-800 bg-[#0d141b] shadow-none">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs">Pending Approvals</span>
                  <Clock className="h-4 w-4 text-amber-400" />
                </div>
                <p className="text-2xl font-bold text-white">
                  {quotes.filter((q) => q.status === "PENDING_APPROVAL").length}
                </p>
                <p className="text-[11px] text-slate-400">Requires Manager/Finance review</p>
              </CardContent>
            </Card>

            <Card className="border-slate-800 bg-[#0d141b] shadow-none">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs">Active Pipeline Value</span>
                  <DollarSign className="h-4 w-4 text-emerald-400" />
                </div>
                <p className="text-2xl font-bold text-white">
                  {currencyFormatter.format(
                    quotes.reduce((acc, q) => acc + (q.totalSubtotal || 0), 0)
                  )}
                </p>
                <p className="text-[11px] text-slate-400">Total net quotation value</p>
              </CardContent>
            </Card>

            <Card className="border-slate-800 bg-[#0d141b] shadow-none">
              <CardContent className="p-4 space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs">Avg Blended Margin</span>
                  <Percent className="h-4 w-4 text-purple-400" />
                </div>
                <p className="text-2xl font-bold text-white">
                  {quotes.length > 0
                    ? (
                        quotes.reduce((acc, q) => acc + (q.totalMarginPercent || 0), 0) /
                        quotes.length
                      ).toFixed(1)
                    : 0}
                  %
                </p>
                <p className="text-[11px] text-slate-400">Blended margin performance</p>
              </CardContent>
            </Card>
          </div>

          {/* Filter Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 flex-1 max-w-lg">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                <Input
                  placeholder="Search by quote # or customer name..."
                  value={listSearch}
                  onChange={(e) => setListSearch(e.target.value)}
                  className="pl-8 h-9 text-xs bg-slate-900/80 border-slate-800 text-white"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 px-3 text-xs bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500 rounded-md"
              >
                <option value="ALL">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="PENDING_APPROVAL">Pending Approval</option>
                <option value="APPROVED">Approved</option>
                <option value="UNDER_NEGOTIATION">Under Negotiation</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>

          {/* Quotations Table */}
          <Card className="border-slate-800 bg-[#0d141b] shadow-none overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-900/60 border-slate-800">
                <TableRow className="border-slate-800 hover:bg-transparent">
                  <TableHead className="text-xs font-mono text-slate-400">Quote #</TableHead>
                  <TableHead className="text-xs text-slate-400">Customer Account</TableHead>
                  <TableHead className="text-xs text-slate-400">Created Date</TableHead>
                  <TableHead className="text-xs text-slate-400 text-right">Net Subtotal</TableHead>
                  <TableHead className="text-xs text-slate-400 text-right">Margin %</TableHead>
                  <TableHead className="text-xs text-slate-400 text-center">Risk Score</TableHead>
                  <TableHead className="text-xs text-slate-400">Status</TableHead>
                  <TableHead className="text-xs text-slate-400 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-slate-800/60">
                {isQuotesLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-xs text-slate-400">
                      Loading quotations list...
                    </TableCell>
                  </TableRow>
                ) : filteredQuotes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-xs text-slate-400">
                      No quotations found. Click "+ Create New Quotation" to build one.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredQuotes.map((quote) => (
                    <TableRow
                      key={quote.id}
                      onClick={() => {
                        setSelectedQuoteId(quote.id);
                        setViewMode("DETAILS");
                      }}
                      className="border-slate-800 hover:bg-slate-900/50 cursor-pointer transition-colors"
                    >
                      <TableCell className="font-mono text-xs font-bold text-sky-400">
                        {quote.quoteNumber}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-xs font-semibold text-white">{quote.customerName}</p>
                          <Badge className={`text-[9px] px-1 py-0 border ${TIER_BADGE_STYLES[quote.customerTier]}`}>
                            {quote.customerTier}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-slate-400 font-mono">
                        {new Date(quote.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs font-semibold text-white">
                        {currencyFormatter.format(quote.totalSubtotal)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs font-semibold">
                        <span
                          className={
                            quote.totalMarginPercent >= 30
                              ? "text-emerald-400"
                              : quote.totalMarginPercent >= 15
                              ? "text-amber-400"
                              : "text-red-400"
                          }
                        >
                          {quote.totalMarginPercent.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={`font-mono text-[10px] border ${
                            quote.blendedRiskScore === 0
                              ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                              : quote.blendedRiskScore <= 10
                              ? "border-amber-500/30 text-amber-400 bg-amber-500/10"
                              : "border-red-500/30 text-red-400 bg-red-500/10"
                          }`}
                        >
                          Risk: {quote.blendedRiskScore}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-[10px] border ${STATUS_BADGE_STYLES[quote.status] ?? STATUS_BADGE_STYLES.DRAFT}`}>
                          {quote.status.replaceAll("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-sky-400 hover:text-sky-300 gap-1"
                        >
                          Details
                          <ChevronRight className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      </div>
    );
  }

  // VIEW 2: QUOTATION DETAILS VIEW
  if (viewMode === "DETAILS") {
    return (
      <div className="min-h-full overflow-y-auto bg-[#090d13] text-foreground">
        <div className="max-w-[1400px] mx-auto p-4 sm:p-6 space-y-6">
          {/* Back Header */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedQuoteId(null);
                setViewMode("LIST");
              }}
              className="gap-2 text-xs border-slate-800 text-slate-300 hover:bg-slate-800 cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Quotations List
            </Button>

            <div className="flex items-center gap-2">
              {quoteDetail?.portalAccessToken && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    window.open(`/portal/quote/${quoteDetail.portalAccessToken}`, "_blank")
                  }
                  className="gap-1.5 text-xs border-emerald-500/30 text-emerald-400 hover:bg-emerald-950/40"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open Customer Portal
                </Button>
              )}
            </div>
          </div>

          {isDetailLoading || !quoteDetail ? (
            <div className="text-center py-16 text-slate-400 text-xs">
              Loading quotation details...
            </div>
          ) : (
            <>
              {/* Quote Main Info Header */}
              <div className="rounded-xl border border-slate-800 bg-[#0d141b] p-6 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h1 className="text-2xl font-black tracking-tight text-white font-mono">
                        Quote #{quoteDetail.quoteNumber}
                      </h1>
                      <Badge className={`text-xs border ${STATUS_BADGE_STYLES[quoteDetail.status]}`}>
                        {quoteDetail.status.replaceAll("_", " ")}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Customer: <span className="text-white font-semibold">{quoteDetail.customerName}</span> · Created on {new Date(quoteDetail.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Actions for Pending Approvals */}
                  {quoteDetail.status === "PENDING_APPROVAL" &&
                    (user.role === "manager" || user.role === "finance" || user.role === "admin") && (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReviewQuote(quoteDetail.id, "REJECT")}
                          disabled={rejectMutation.isPending}
                          className="border-red-500/30 text-red-400 hover:bg-red-950/40 text-xs"
                        >
                          Reject Quote
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleReviewQuote(quoteDetail.id, "APPROVE")}
                          disabled={approveMutation.isPending}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs gap-1.5"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Approve Quote
                        </Button>
                      </div>
                    )}
                </div>

                {/* KPI Metrics */}
                <div className="grid gap-4 sm:grid-cols-4">
                  <div className="bg-slate-900/60 p-3.5 border border-slate-800 rounded-lg">
                    <span className="text-[11px] text-slate-400">Net Subtotal</span>
                    <p className="text-xl font-bold font-mono text-white mt-1">
                      {currencyFormatter.format(quoteDetail.totalSubtotal)}
                    </p>
                  </div>

                  <div className="bg-slate-900/60 p-3.5 border border-slate-800 rounded-lg">
                    <span className="text-[11px] text-slate-400">Standard Cost</span>
                    <p className="text-xl font-bold font-mono text-slate-300 mt-1">
                      {currencyFormatter.format(quoteDetail.totalCost)}
                    </p>
                  </div>

                  <div className="bg-slate-900/60 p-3.5 border border-slate-800 rounded-lg">
                    <span className="text-[11px] text-slate-400">Blended Margin</span>
                    <p className="text-xl font-bold font-mono text-emerald-400 mt-1">
                      {quoteDetail.totalMarginPercent.toFixed(1)}%
                    </p>
                  </div>

                  <div className="bg-slate-900/60 p-3.5 border border-slate-800 rounded-lg">
                    <span className="text-[11px] text-slate-400">Risk Score & Routing</span>
                    <p className="text-xl font-bold font-mono text-amber-400 mt-1 flex items-center gap-2">
                      Score: {quoteDetail.blendedRiskScore}
                    </p>
                  </div>
                </div>
              </div>

              {/* Line Items Table */}
              <Card className="border-slate-800 bg-[#0d141b] shadow-none overflow-hidden">
                <CardHeader className="p-4 border-b border-slate-800">
                  <CardTitle className="text-xs font-mono tracking-wider uppercase text-slate-400">
                    Quotation Line Items ({quoteDetail.lines.length})
                  </CardTitle>
                </CardHeader>
                <Table>
                  <TableHeader className="bg-slate-900/60 border-slate-800">
                    <TableRow className="border-slate-800">
                      <TableHead className="text-xs text-slate-400">Product</TableHead>
                      <TableHead className="text-xs text-slate-400">Category</TableHead>
                      <TableHead className="text-xs text-slate-400 text-right">Quantity</TableHead>
                      <TableHead className="text-xs text-slate-400 text-right">Unit Price</TableHead>
                      <TableHead className="text-xs text-slate-400 text-right">Discount %</TableHead>
                      <TableHead className="text-xs text-slate-400 text-right">Line Margin %</TableHead>
                      <TableHead className="text-xs text-slate-400 text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-slate-800/60">
                    {quoteDetail.lines.map((line) => {
                      const lineCost = (line.costPrice || 0) * line.quantity;
                      const lineMargin = line.lineSubtotal > 0 ? ((line.lineSubtotal - lineCost) / line.lineSubtotal) * 100 : 0;
                      return (
                        <TableRow key={line.id} className="border-slate-800">
                          <TableCell>
                            <div>
                              <p className="text-xs font-semibold text-white">{line.productName}</p>
                              <p className="text-[10px] font-mono text-slate-400">{line.productId}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px]">
                              {line.category}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs text-white">
                            {line.quantity}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs text-slate-300">
                            {currencyFormatter.format(line.unitPrice)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs text-amber-400">
                            {line.discountPercent}%
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs text-emerald-400">
                            {lineMargin.toFixed(1)}%
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs font-bold text-white">
                            {currencyFormatter.format(line.lineSubtotal)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Card>

              {/* Audit History Timeline */}
              {quoteDetail.auditLogs && quoteDetail.auditLogs.length > 0 && (
                <Card className="border-slate-800 bg-[#0d141b] shadow-none">
                  <CardHeader className="p-4 border-b border-slate-800">
                    <CardTitle className="text-xs font-mono tracking-wider uppercase text-slate-400 flex items-center gap-2">
                      <History className="h-3.5 w-3.5 text-sky-400" />
                      Approval Audit Trail History
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 divide-y divide-slate-800/60">
                    {quoteDetail.auditLogs.map((log) => (
                      <div key={log.id} className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-4 text-xs">
                        <div>
                          <p className="font-semibold text-white">{log.action.replaceAll("_", " ")}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            By {log.actorName} ({log.actorRole}) {log.reason ? `— "${log.reason}"` : ""}
                          </p>
                        </div>
                        <span className="font-mono text-[10px] text-slate-500">
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // VIEW 3: QUOTATION BUILDER VIEW (`viewMode === "CREATE"`)
  return (
    <div className="h-full overflow-y-auto bg-[#090d13] text-foreground">
      <div className="max-w-[1600px] mx-auto p-4 sm:p-6 space-y-4">
        {/* Creation Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-[#0d141b] p-4 shadow-[0_0_0_1px_rgba(148,163,184,0.04)]">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode("LIST")}
              className="gap-2 text-xs border-slate-800 text-slate-300 hover:bg-slate-800 cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to List
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-sky-400" />
                <span className="text-[10px] uppercase tracking-[0.22em] text-slate-400 font-mono">
                  NEW QUOTATION
                </span>
              </div>
              <h1 className="text-xl font-black tracking-tight text-white">Create New Quotation</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-300 rounded-md border border-slate-700 bg-slate-900 px-3 py-2">
            <UserCircle className="h-4 w-4 text-sky-400" />
            <span>Rep: <span className="font-semibold text-white">{user.name}</span></span>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-4">
          <div className="space-y-4">
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
                        .filter((p) => p.category === cat || (cat === "SUBSCRIPTION" && p.category === "SOFTWARE_SUBSCRIPTION"))
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
                                <p className="text-[11px] text-muted-foreground font-mono">
                                  SKU: {product.sku} · List: ${product.basePrice} · Cost: ${product.costPrice}
                                </p>
                              </div>
                              <Button
                                size="sm"
                                variant={isInCart ? "secondary" : "default"}
                                onClick={() => addProductToCart(product)}
                                className="h-7 text-xs px-2.5 shrink-0 gap-1"
                              >
                                <Plus className="h-3 w-3" />
                                {isInCart ? "Add More" : "Add to Cart"}
                              </Button>
                            </div>
                          );
                        })}
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>

            <Card className="border-slate-800 bg-[#0d141b] shadow-[inset_0_0_0_1px_rgba(148,163,184,0.05)]">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-semibold flex items-center justify-between text-white">
                  <span>Quotation Shopping Cart ({cart.length} items)</span>
                  <span className="font-mono text-sky-400 text-xs font-bold">
                    Net: {currencyFormatter.format(totalSubtotal)}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <CartTable
                  cart={cart}
                  selectedCustomer={selectedCustomer}
                  onUpdateQuantity={updateQuantity}
                  onUpdateDiscount={updateDiscount}
                  onRemoveLine={removeLine}
                  onAddUpsell={addUpsellToCart}
                  cartProductIds={cartProductIds}
                />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="border-slate-800 bg-[#0d141b] shadow-[inset_0_0_0_1px_rgba(148,163,184,0.05)]">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-semibold text-white">Live Margin & Governance Meter</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-4">
                <LiveMarginIndicator
                  marginPercent={blendedMargin}
                  riskScore={riskScore}
                  requiredApprovalLevel={approvalLevel}
                />

                <div className="space-y-1.5">
                  <Label htmlFor="q-notes" className="text-xs text-slate-300">
                    Deal Notes / Approval Context
                  </Label>
                  <textarea
                    id="q-notes"
                    placeholder="Enter deal justification or custom discount reasoning..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full min-h-[70px] p-2.5 text-xs bg-slate-900/80 border border-slate-800 text-white rounded-md focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={cart.length === 0 || !selectedCustomer}
                  className="w-full bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs py-2.5 shadow-md cursor-pointer"
                >
                  Submit Quotation for Approval
                </Button>
              </CardContent>
            </Card>

            <UpsellDrawer addedProductIds={cartProductIds} onAddUpsell={addUpsellToCart} />
          </div>
        </div>

        {/* Submit Modal */}
        <Dialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
          <DialogContent className="sm:max-w-md bg-[#0d141b] border-slate-800 text-white">
            <DialogHeader>
              <DialogTitle className="text-base">Confirm Quotation Submission</DialogTitle>
              <DialogDescription className="text-xs text-slate-400">
                Review line discount ceilings and approval routing before submitting.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-3 text-xs">
              <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-md space-y-1">
                <div className="flex justify-between font-medium">
                  <span>Customer:</span>
                  <span className="text-white">{selectedCustomer?.name}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Net Total:</span>
                  <span className="font-mono text-sky-400">{currencyFormatter.format(totalSubtotal)}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Blended Margin:</span>
                  <span className="font-mono text-emerald-400">{blendedMargin.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Blended Risk Score:</span>
                  <span className="font-mono text-amber-400">{riskScore}</span>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setSubmitDialogOpen(false)} className="border-slate-800 text-slate-300">
                Cancel
              </Button>
              <Button size="sm" onClick={handleConfirmSubmit} disabled={createQuoteMutation.isPending} className="bg-sky-500 text-slate-950 font-bold">
                {createQuoteMutation.isPending ? "Submitting..." : "Confirm & Submit"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
