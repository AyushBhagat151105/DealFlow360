import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Clock,
  TrendingDown,
  ChevronRight,
  Filter,
  CheckCircle2,
  XCircle,
  Activity,
  ShieldAlert,
} from "lucide-react";
import { useQuotes } from "@/hooks/use-quotes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Quote } from "@/lib/api-types";
import { useAuthStore } from "@/stores/auth-store";
import { ApprovalModal } from "@/components/approval-modal";
import { DealHealthPanel } from "@/components/deal-health-panel";

export const Route = createFileRoute("/workspace/approvals")({
  component: ApprovalsComponent,
});

const STATUS_BADGE: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground border-border",
  PENDING_APPROVAL: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  APPROVED: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  REJECTED: "bg-destructive/15 text-destructive border-destructive/30",
  UNDER_NEGOTIATION: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
  CONFIRMED: "bg-emerald-600/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40",
  FULFILLED: "bg-slate-500/15 text-slate-500 border-slate-500/30",
};

const RISK_BADGE: Record<string, string> = {
  NONE: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  SALES_MANAGER: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  FINANCE: "bg-destructive/15 text-destructive border-destructive/30",
};

function getRiskScore(quote: Quote): number {
  return quote.blendedRiskScore;
}

function ApprovalsComponent() {
  const { user } = useAuthStore();
  const quotesQuery = useQuotes();
  const quotes = quotesQuery.data ?? [];
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("PENDING_APPROVAL");
  const [mainTab, setMainTab] = useState<"queue" | "health">("queue");

  const displayQuotes = filterStatus === "ALL" ? quotes : quotes.filter((q) => q.status === filterStatus);

  const pendingCount = quotes.filter((q) => q.status === "PENDING_APPROVAL").length;

  const canApprove =
    user.role === "manager" || user.role === "finance" || user.role === "admin";

  if (quotesQuery.isLoading) {
    return <div className="flex min-h-full items-center justify-center bg-background p-6 text-sm text-muted-foreground">Loading approvals...</div>;
  }

  if (quotesQuery.isError) {
    return <div className="flex min-h-full flex-col items-center justify-center gap-3 bg-background p-6 text-sm text-muted-foreground"><span>Approvals could not be loaded.</span><Button variant="outline" onClick={() => quotesQuery.refetch()}>Try again</Button></div>;
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-[1400px] mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black tracking-tight text-foreground">
              Governance & Deal Operations
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Review discount approval queues, monitor deal health telemetry, and manage anomaly alerts.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {pendingCount > 0 && (
              <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 font-semibold gap-1.5 px-2.5 py-1">
                <Clock className="h-3.5 w-3.5" />
                {pendingCount} Pending Review
              </Badge>
            )}
            {!canApprove && (
              <Badge className="bg-muted text-muted-foreground border-border text-xs px-2.5 py-1">
                View-Only Mode — Switch to Manager/Finance role to act
              </Badge>
            )}
          </div>
        </div>

        {/* Top Level Navigation Tabs */}
        <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as "queue" | "health")}>
          <TabsList className="bg-muted p-1 max-w-md">
            <TabsTrigger value="queue" className="text-xs font-semibold gap-1.5">
              <Clock className="h-3.5 w-3.5 text-amber-500" />
              <span>Discount Approval Queue</span>
            </TabsTrigger>
            <TabsTrigger value="health" className="text-xs font-semibold gap-1.5">
              <Activity className="h-3.5 w-3.5 text-primary" />
              <span>Deal Health & Anomalies</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="queue" className="space-y-6 pt-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                {
                  label: "Pending",
                  count: quotes.filter((q) => q.status === "PENDING_APPROVAL").length,
                  color: "text-amber-500",
                  icon: Clock,
                },
                {
                  label: "Approved",
                  count: quotes.filter((q) => q.status === "APPROVED").length,
                  color: "text-emerald-500",
                  icon: CheckCircle2,
                },
                {
                  label: "Rejected",
                  count: quotes.filter((q) => q.status === "REJECTED").length,
                  color: "text-destructive",
                  icon: XCircle,
                },
                {
                  label: "High Risk",
                  count: quotes.filter((q) => q.requiredApprovalLevel === "FINANCE").length,
                  color: "text-destructive",
                  icon: TrendingDown,
                },
              ].map((stat) => (
                <Card key={stat.label} className="border-border bg-card">
                  <CardContent className="p-3.5 flex items-center gap-3">
                    <stat.icon className={`h-5 w-5 ${stat.color} shrink-0`} />
                    <div>
                      <p className={`text-xl font-black font-mono ${stat.color}`}>{stat.count}</p>
                      <p className="text-[11px] text-muted-foreground">{stat.label}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="border-border bg-card">
              <CardHeader className="p-4 pb-0">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Filter className="h-4 w-4 text-primary" />
                    Quotation Queue
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <Tabs value={filterStatus} onValueChange={setFilterStatus}>
                  <TabsList className="bg-muted p-1 mb-4">
                    {[
                      { value: "PENDING_APPROVAL", label: "Pending" },
                      { value: "APPROVED", label: "Approved" },
                      { value: "REJECTED", label: "Rejected" },
                      { value: "ALL", label: "All Quotes" },
                    ].map((t) => (
                      <TabsTrigger key={t.value} value={t.value} className="text-xs font-medium">
                        {t.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  <TabsContent value={filterStatus}>
                    {displayQuotes.length === 0 ? (
                      <div className="py-10 text-center text-xs text-muted-foreground">
                        No quotations in this category.
                      </div>
                    ) : (
                      <Table>
                        <TableHeader className="bg-muted/40">
                          <TableRow>
                            <TableHead className="text-xs font-bold">Quote #</TableHead>
                            <TableHead className="text-xs font-bold">Customer</TableHead>
                            <TableHead className="text-xs font-bold">Tier</TableHead>
                            <TableHead className="text-xs font-bold text-right">Value</TableHead>
                            <TableHead className="text-xs font-bold text-right">Blended Margin</TableHead>
                            <TableHead className="text-xs font-bold text-center">Risk Score</TableHead>
                            <TableHead className="text-xs font-bold text-center">Approval Level</TableHead>
                            <TableHead className="text-xs font-bold text-center">Status</TableHead>
                            <TableHead className="w-10" />
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {displayQuotes.map((quote) => {
                            const risk = getRiskScore(quote);
                            return (
                              <TableRow
                                key={quote.id}
                                className={`cursor-pointer hover:bg-muted/30 ${
                                  quote.requiredApprovalLevel === "FINANCE" ? "border-l-2 border-l-destructive" : ""
                                }`}
                                onClick={() => setSelectedQuote(quote)}
                              >
                                <TableCell className="font-mono text-xs font-bold text-foreground">
                                  {quote.quoteNumber}
                                </TableCell>
                                <TableCell className="text-xs font-medium">{quote.customerName}</TableCell>
                                <TableCell>
                                  <Badge
                                    className={`text-[10px] px-1.5 py-0 border ${
                                      quote.customerTier === "GOLD"
                                        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                                        : quote.customerTier === "SILVER"
                                        ? "bg-slate-400/15 text-slate-500 dark:text-slate-300 border-slate-400/30"
                                        : "bg-orange-700/15 text-orange-700 dark:text-orange-400 border-orange-700/30"
                                    }`}
                                  >
                                    {quote.customerTier}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right font-mono font-bold text-xs">
                                  ${quote.totalSubtotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                </TableCell>
                                <TableCell className="text-right">
                                  <span
                                    className={`text-xs font-mono font-bold ${
                                      quote.totalMarginPercent >= 30
                                        ? "text-emerald-500"
                                        : quote.totalMarginPercent >= 15
                                        ? "text-amber-500"
                                        : "text-destructive"
                                    }`}
                                  >
                                    {quote.totalMarginPercent.toFixed(1)}%
                                  </span>
                                </TableCell>
                                <TableCell className="text-center">
                                  <span
                                    className={`text-xs font-mono font-bold ${
                                      risk > 10 ? "text-destructive" : risk > 0 ? "text-amber-500" : "text-emerald-500"
                                    }`}
                                  >
                                    {risk}
                                  </span>
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge className={`text-[10px] border ${RISK_BADGE[quote.requiredApprovalLevel]}`}>
                                    {quote.requiredApprovalLevel === "NONE"
                                      ? "Auto"
                                      : quote.requiredApprovalLevel === "SALES_MANAGER"
                                      ? "Manager"
                                      : "Finance"}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge className={`text-[10px] border ${STATUS_BADGE[quote.status] || ""}`}>
                                    {quote.status.replace(/_/g, " ")}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Deal Health Panel Tab */}
          <TabsContent value="health" className="pt-4">
            <DealHealthPanel />
          </TabsContent>
        </Tabs>
      </div>

      {selectedQuote && (
        <ApprovalModal
          quote={selectedQuote}
          onClose={() => setSelectedQuote(null)}
          onApprove={() => setSelectedQuote(null)}
          onReject={() => setSelectedQuote(null)}
          onReturn={() => setSelectedQuote(null)}
        />
      )}
    </div>
  );
}
