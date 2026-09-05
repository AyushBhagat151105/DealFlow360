import { useMemo, useState } from "react";
import {
  Download,
  Filter,
  RefreshCw,
  ShieldAlert,
  Layers,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSalesAnalyticsReport, type SalesReportFilters } from "@/hooks/use-deal-health";
import { exportToCsv } from "@/lib/export-utils";
import type { ProductCategory, QuoteStatus } from "@/lib/api-types";
import { currencyFormatterNoDecimals } from "@/lib/currency";

const currency = currencyFormatterNoDecimals;

const CATEGORIES: ProductCategory[] = ["HARDWARE", "SOFTWARE_SUBSCRIPTION", "SERVICE", "SUBSCRIPTION"];
const STAGES: QuoteStatus[] = [
  "DRAFT",
  "PENDING_APPROVAL",
  "APPROVED",
  "UNDER_NEGOTIATION",
  "CONFIRMED",
  "FULFILLED",
];

export function SalesReportsView() {
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | "ALL">("ALL");
  const [selectedStatus, setSelectedStatus] = useState<QuoteStatus | "ALL">("ALL");
  const [categoryPage, setCategoryPage] = useState(1);
  const [tierPage, setTierPage] = useState(1);
  const [repPage, setRepPage] = useState(1);
  const pageSize = 5;

  const filters: SalesReportFilters = {
    category: selectedCategory === "ALL" ? undefined : selectedCategory,
    status: selectedStatus === "ALL" ? undefined : selectedStatus,
  };

  const { data, isLoading, isError, refetch, isFetching } = useSalesAnalyticsReport(filters);
  const categoryBreakdown = data?.categoryBreakdown ?? [];
  const tierGovernance = data?.tierGovernance ?? [];
  const repPerformance = data?.repPerformance ?? [];
  const categoryPageCount = Math.max(1, Math.ceil(categoryBreakdown.length / pageSize));
  const tierPageCount = Math.max(1, Math.ceil(tierGovernance.length / pageSize));
  const repPageCount = Math.max(1, Math.ceil(repPerformance.length / pageSize));
  const visibleCategories = useMemo(
    () => categoryBreakdown.slice((categoryPage - 1) * pageSize, categoryPage * pageSize),
    [categoryBreakdown, categoryPage],
  );
  const visibleTiers = useMemo(
    () => tierGovernance.slice((tierPage - 1) * pageSize, tierPage * pageSize),
    [tierGovernance, tierPage],
  );
  const visibleReps = useMemo(
    () => repPerformance.slice((repPage - 1) * pageSize, repPage * pageSize),
    [repPerformance, repPage],
  );

  const handleExportCategoryCsv = () => {
    if (!data?.categoryBreakdown || data.categoryBreakdown.length === 0) {
      toast.error("No category statistics available to export");
      return;
    }

    exportToCsv(
      `category-performance-${new Date().toISOString().slice(0, 10)}.csv`,
      data.categoryBreakdown,
      [
        { header: "Category", accessor: (item) => item.category },
        { header: "Revenue (INR)", accessor: (item) => item.revenue.toFixed(2) },
        { header: "Direct Cost (INR)", accessor: (item) => item.cost.toFixed(2) },
        { header: "Gross Profit (INR)", accessor: (item) => (item.revenue - item.cost).toFixed(2) },
        { header: "Margin %", accessor: (item) => item.marginPercent.toFixed(1) },
        { header: "Line Items Count", accessor: (item) => item.lineCount },
      ],
    );
    toast.success("Exported category breakdown to CSV");
  };

  const handleExportGovernanceCsv = () => {
    if (!data?.tierGovernance || data.tierGovernance.length === 0) {
      toast.error("No tier governance statistics available to export");
      return;
    }

    exportToCsv(
      `tier-discount-governance-${new Date().toISOString().slice(0, 10)}.csv`,
      data.tierGovernance,
      [
        { header: "Customer Tier", accessor: (item) => item.tier },
        { header: "Quote Count", accessor: (item) => item.quoteCount },
        { header: "Actual Avg Discount %", accessor: (item) => item.actualAvgDiscount.toFixed(1) },
        { header: "Statutory Ceiling %", accessor: (item) => item.ceilingPercent.toFixed(1) },
        { header: "Variance %", accessor: (item) => item.variance.toFixed(1) },
        { header: "Policy Breaches", accessor: (item) => item.breachCount },
      ],
    );
    toast.success("Exported tier governance data to CSV");
  };

  const handleExportRepsCsv = () => {
    if (!data?.repPerformance || data.repPerformance.length === 0) {
      toast.error("No sales rep performance statistics available to export");
      return;
    }

    exportToCsv(
      `sales-rep-leaderboard-${new Date().toISOString().slice(0, 10)}.csv`,
      data.repPerformance,
      [
        { header: "Rep Name", accessor: (item) => item.repName },
        { header: "Quotes Handled", accessor: (item) => item.quoteCount },
        { header: "Quoted Pipeline (INR)", accessor: (item) => item.totalPipeline.toFixed(2) },
        { header: "Won Revenue (INR)", accessor: (item) => item.wonRevenue.toFixed(2) },
        { header: "Avg Blended Margin %", accessor: (item) => item.avgMarginPercent.toFixed(1) },
      ],
    );
    toast.success("Exported sales rep leaderboard to CSV");
  };

  const handleDownloadRawQuotesCsv = () => {
    const params = new URLSearchParams();
    if (selectedCategory !== "ALL") params.append("category", selectedCategory);
    if (selectedStatus !== "ALL") params.append("status", selectedStatus);
    const queryString = params.toString() ? `?${params.toString()}` : "";
    window.open(`/api/deal-health/reports/export${queryString}`, "_blank");
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-3 text-sm text-muted-foreground">Generating financial reports...</span>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <p className="text-sm text-destructive">Failed to load sales and financial reports.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Try Again
        </Button>
      </div>
    );
  }

  const { summary } = data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Filters:</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Category:</span>
            <select
              aria-label="Filter by product category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as ProductCategory | "ALL")}
              className="h-8 rounded-md border border-border bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="ALL">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Stage:</span>
            <select
              aria-label="Filter by deal stage"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as QuoteStatus | "ALL")}
              className="h-8 rounded-md border border-border bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="ALL">All Stages</option>
              {STAGES.map((st) => (
                <option key={st} value={st}>
                  {st.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>

          {(selectedCategory !== "ALL" || selectedStatus !== "ALL") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedCategory("ALL");
                setSelectedStatus("ALL");
              }}
              className="h-8 text-xs text-muted-foreground hover:text-foreground"
            >
              Reset
            </Button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="h-8 text-xs gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadRawQuotesCsv}
            className="h-8 text-xs gap-1.5"
          >
            <Download className="h-3.5 w-3.5 text-primary" />
            Raw Quotes CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        <Card className="min-w-0 border-primary/40 bg-primary/5 p-4">
          <span className="text-xs font-medium text-primary">Total Quoted Revenue</span>
          <span className="block whitespace-nowrap text-lg font-black font-mono text-primary sm:text-xl" title={currency.format(summary.totalRevenue)}>
            {currency.format(summary.totalRevenue)}
          </span>
          <p className="text-[10px] text-muted-foreground pt-1">Across {summary.totalQuotes} analyzed deals</p>
        </Card>

        <Card className="min-w-0 border-border bg-card p-4">
          <span className="text-xs text-muted-foreground block font-medium">Direct Cost Basis</span>
          <span className="block whitespace-nowrap text-lg font-black font-mono text-muted-foreground sm:text-xl" title={currency.format(summary.totalCost)}>
            {currency.format(summary.totalCost)}
          </span>
          <p className="text-[10px] text-muted-foreground pt-1">Product & fulfillment costs</p>
        </Card>

        <Card className="min-w-0 border-border bg-card p-4">
          <span className="text-xs text-muted-foreground block font-medium">Net Gross Margin</span>
          <span className={`text-2xl font-black font-mono ${summary.avgMarginPercent >= 35 ? "text-emerald-500" : "text-amber-500"}`}>
            {summary.avgMarginPercent.toFixed(1)}%
          </span>
          <p className="text-[10px] text-muted-foreground pt-1">
            Profit: {currency.format(Math.max(0, summary.totalRevenue - summary.totalCost))}
          </p>
        </Card>

        <Card className="min-w-0 border-border bg-card p-4">
          <span className="text-xs text-muted-foreground block font-medium">Average Risk Score</span>
          <span className={`text-2xl font-black font-mono ${summary.avgRiskScore > 10 ? "text-red-500" : summary.avgRiskScore > 0 ? "text-amber-500" : "text-emerald-500"}`}>
            {summary.avgRiskScore.toFixed(1)}
          </span>
          <p className="text-[10px] text-muted-foreground pt-1">Blended discount exposure</p>
        </Card>

        <Card className="min-w-0 border-border bg-card p-4 col-span-2 sm:col-span-1">
          <span className="text-xs text-muted-foreground block font-medium">Policy Compliance</span>
          <span className="text-2xl font-black font-mono text-emerald-500">
            {tierGovernance.reduce((acc, t) => acc + t.breachCount, 0) === 0 ? "100%" : `${Math.max(0, 100 - tierGovernance.reduce((acc, t) => acc + t.breachCount, 0) * 10)}%`}
          </span>
          <p className="text-[10px] text-muted-foreground pt-1">
            {tierGovernance.reduce((acc, t) => acc + t.breachCount, 0)} ceiling breaches
          </p>
        </Card>
      </div>

      <Card className="border-border bg-card shadow-none">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Layers className="h-4 w-4 text-primary" />
              Category Revenue & Margin Performance
            </CardTitle>
            <CardDescription className="text-xs">
              Performance breakdown across Hardware, Software, Services, and Subscription lines.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleExportCategoryCsv} className="h-8 text-xs gap-1.5">
            <Download className="h-3.5 w-3.5" />
            Export Category CSV
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-xs font-semibold uppercase">Category</TableHead>
                <TableHead className="text-xs font-semibold uppercase text-right">Revenue</TableHead>
                <TableHead className="text-xs font-semibold uppercase text-right">Cost</TableHead>
                <TableHead className="text-xs font-semibold uppercase text-right">Gross Profit</TableHead>
                <TableHead className="text-xs font-semibold uppercase text-right">Margin %</TableHead>
                <TableHead className="text-xs font-semibold uppercase text-right">Line Items</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categoryBreakdown.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-sm text-muted-foreground">
                    No category data available for the selected filters.
                  </TableCell>
                </TableRow>
              ) : (
                visibleCategories.map((cat) => {
                  const profit = cat.revenue - cat.cost;
                  return (
                    <TableRow key={cat.category} className="border-border">
                      <TableCell className="font-semibold text-sm">
                        <Badge variant="outline" className="font-mono text-xs">
                          {cat.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium text-foreground">
                        {currency.format(cat.revenue)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">
                        {currency.format(cat.cost)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-emerald-500 font-semibold">
                        {currency.format(profit)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant="secondary"
                          className={`font-mono text-xs ${cat.marginPercent >= 40
                            ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/30"
                            : cat.marginPercent >= 20
                              ? "bg-blue-500/15 text-blue-500 border-blue-500/30"
                              : "bg-amber-500/15 text-amber-500 border-amber-500/30"
                            }`}
                        >
                          {cat.marginPercent.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-muted-foreground">
                        {cat.lineCount}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          {categoryBreakdown.length > pageSize && <ReportPagination page={categoryPage} pageCount={categoryPageCount} total={categoryBreakdown.length} onPageChange={setCategoryPage} />}
        </CardContent>
      </Card>

      <Card className="border-border bg-card shadow-none">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <ShieldAlert className="h-4 w-4 text-primary" />
              Customer Tier Discount Governance vs Policy Ceilings
            </CardTitle>
            <CardDescription className="text-xs">
              Audit actual average discounts against statutory tier ceilings to prevent unauthorized margin erosion.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleExportGovernanceCsv} className="h-8 text-xs gap-1.5">
            <Download className="h-3.5 w-3.5" />
            Export Governance CSV
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-xs font-semibold uppercase">Customer Tier</TableHead>
                <TableHead className="text-xs font-semibold uppercase text-right">Quoted Deals</TableHead>
                <TableHead className="text-xs font-semibold uppercase text-right">Actual Avg Discount</TableHead>
                <TableHead className="text-xs font-semibold uppercase text-right">Statutory Ceiling</TableHead>
                <TableHead className="text-xs font-semibold uppercase text-right">Policy Variance</TableHead>
                <TableHead className="text-xs font-semibold uppercase text-right">Ceiling Breaches</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tierGovernance.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-sm text-muted-foreground">
                    No tier governance data available.
                  </TableCell>
                </TableRow>
              ) : (
                visibleTiers.map((tier) => {
                  return (
                    <TableRow key={tier.tier} className="border-border">
                      <TableCell className="font-semibold text-sm">
                        <Badge variant="outline" className="font-mono text-xs uppercase">
                          {tier.tier}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">{tier.quoteCount}</TableCell>
                      <TableCell className="text-right font-mono text-sm font-semibold text-foreground">
                        {tier.actualAvgDiscount.toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-muted-foreground">
                        {tier.ceilingPercent.toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={`font-mono text-xs font-semibold ${tier.variance >= 0 ? "text-emerald-500" : "text-red-500"
                            }`}
                        >
                          {tier.variance >= 0 ? `+${tier.variance.toFixed(1)}% safe` : `${tier.variance.toFixed(1)}% over`}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {tier.breachCount > 0 ? (
                          <Badge variant="destructive" className="font-mono text-xs">
                            {tier.breachCount} Breaches
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="font-mono text-xs border-emerald-500/30 text-emerald-500 bg-emerald-500/10">
                            Compliant
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          {tierGovernance.length > pageSize && <ReportPagination page={tierPage} pageCount={tierPageCount} total={tierGovernance.length} onPageChange={setTierPage} />}
        </CardContent>
      </Card>

      <Card className="border-border bg-card shadow-none">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Users className="h-4 w-4 text-primary" />
              Sales Representative Performance Leaderboard
            </CardTitle>
            <CardDescription className="text-xs">
              Representative throughput, pipeline generation, won deal velocity, and blended margin retention.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleExportRepsCsv} className="h-8 text-xs gap-1.5">
            <Download className="h-3.5 w-3.5" />
            Export Reps CSV
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-xs font-semibold uppercase">Representative</TableHead>
                <TableHead className="text-xs font-semibold uppercase text-right">Quotes Handled</TableHead>
                <TableHead className="text-xs font-semibold uppercase text-right">Quoted Pipeline</TableHead>
                <TableHead className="text-xs font-semibold uppercase text-right">Won Revenue</TableHead>
                <TableHead className="text-xs font-semibold uppercase text-right">Avg Blended Margin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {repPerformance.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-sm text-muted-foreground">
                    No sales rep performance data recorded.
                  </TableCell>
                </TableRow>
              ) : (
                visibleReps.map((rep) => (
                  <TableRow key={rep.repId} className="border-border">
                    <TableCell className="font-medium text-sm text-foreground">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                          {rep.repName.charAt(0)}
                        </div>
                        <span>{rep.repName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">{rep.quoteCount}</TableCell>
                    <TableCell className="text-right font-mono text-sm font-medium text-foreground">
                      {currency.format(rep.totalPipeline)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm font-semibold text-emerald-500">
                      {currency.format(rep.wonRevenue)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant="secondary"
                        className={`font-mono text-xs ${rep.avgMarginPercent >= 35
                          ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/30"
                          : "bg-amber-500/15 text-amber-500 border-amber-500/30"
                          }`}
                      >
                        {rep.avgMarginPercent.toFixed(1)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {repPerformance.length > pageSize && <ReportPagination page={repPage} pageCount={repPageCount} total={repPerformance.length} onPageChange={setRepPage} />}
        </CardContent>
      </Card>
    </div>
  );
}

function ReportPagination({
  page,
  pageCount,
  total,
  onPageChange,
}: {
  page: number;
  pageCount: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="flex items-center justify-between border-t border-border px-4 py-3">
      <span className="text-xs text-muted-foreground">Page {page} of {pageCount} · {total} records</span>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={page === 1} onClick={() => onPageChange(page - 1)}>Previous</Button>
        <Button variant="outline" size="sm" disabled={page === pageCount} onClick={() => onPageChange(page + 1)}>Next</Button>
      </div>
    </div>
  );
}
