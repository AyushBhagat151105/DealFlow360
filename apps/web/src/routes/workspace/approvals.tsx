import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  AlertTriangle,
  FileText,
  Clock,
  TrendingDown,
  ChevronRight,
  Filter,
  Loader2,
  History,
} from "lucide-react";
import { toast } from "sonner";
import { useQuotes, useApproveQuote, useRejectQuote, useReturnQuoteForRevision } from "@/hooks/use-quotes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Quote } from "@/lib/mock-data";
import { useAuthStore } from "@/stores/auth-store";

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

function ApprovalDetailDrawer({
  quote,
  onClose,
  onApprove,
  onReject,
  onReturn,
}: {
  quote: Quote;
  onClose: () => void;
  onApprove: (id: string, notes: string) => void;
  onReject: (id: string, reason: string) => void;
  onReturn: (id: string, reason: string) => void;
}) {
  const [actionNotes, setActionNotes] = useState("");
  const approveMutation = useApproveQuote();
  const rejectMutation = useRejectQuote();
  const returnMutation = useReturnQuoteForRevision();

  const handleApprove = () => {
    approveMutation.mutate(
      { quoteId: quote.id, notes: actionNotes },
      {
        onSuccess: () => {
          toast.success(`Quotation ${quote.quoteNumber} approved!`);
          onApprove(quote.id, actionNotes);
          onClose();
        },
      }
    );
  };

  const handleReject = () => {
    if (!actionNotes.trim()) {
      toast.error("Please provide a rejection reason.");
      return;
    }
    rejectMutation.mutate(
      { quoteId: quote.id, reason: actionNotes },
      {
        onSuccess: () => {
          toast.error(`Quotation ${quote.quoteNumber} rejected.`);
          onReject(quote.id, actionNotes);
          onClose();
        },
      }
    );
  };

  const handleReturn = () => {
    if (!actionNotes.trim()) {
      toast.error("Please provide return notes for the Sales Rep.");
      return;
    }
    returnMutation.mutate(
      { quoteId: quote.id, reason: actionNotes },
      {
        onSuccess: () => {
          toast.info(`Quotation ${quote.quoteNumber} returned for revision.`);
          onReturn(quote.id, actionNotes);
          onClose();
        },
      }
    );
  };

  const isAnyPending =
    approveMutation.isPending || rejectMutation.isPending || returnMutation.isPending;

  const lineViolations = quote.lines.filter((l) => {
    const lineSubtotal = l.lineSubtotal;
    const lineCost = l.costPrice * l.quantity;
    const margin = lineSubtotal > 0 ? ((lineSubtotal - lineCost) / lineSubtotal) * 100 : 0;
    return margin < l.minMarginThreshold;
  });

  // Mock audit trail
  const auditTrail = [
    {
      id: "evt_1",
      event: "Quote Created",
      actor: "Sales Rep",
      timestamp: quote.createdAt,
    },
    {
      id: "evt_2",
      event: "Submitted for Approval",
      actor: "Sales Rep",
      timestamp: quote.updatedAt,
    },
    ...(quote.status === "PENDING_APPROVAL"
      ? []
      : [
          {
            id: "evt_3",
            event: `Status: ${quote.status}`,
            actor: "Manager",
            timestamp: new Date().toISOString(),
          },
        ]),
  ];

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-card text-card-foreground border-border">
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Review: {quote.quoteNumber}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {quote.customerName} • {quote.customerTier} Tier • Created {new Date(quote.createdAt).toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="lines" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-muted p-1">
            <TabsTrigger value="lines" className="text-xs">Line Items</TabsTrigger>
            <TabsTrigger value="violations" className="text-xs">
              Violations
              {lineViolations.length > 0 && (
                <span className="ml-1.5 bg-destructive text-white text-[10px] rounded-full h-4 w-4 inline-flex items-center justify-center font-bold">
                  {lineViolations.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="audit" className="text-xs">Audit Trail</TabsTrigger>
          </TabsList>

          <TabsContent value="lines" className="pt-3 space-y-3">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="text-xs font-bold">Product</TableHead>
                  <TableHead className="text-xs font-bold text-center">Qty</TableHead>
                  <TableHead className="text-xs font-bold text-right">Discount</TableHead>
                  <TableHead className="text-xs font-bold text-right">Net Subtotal</TableHead>
                  <TableHead className="text-xs font-bold text-right">Margin</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quote.lines.map((line) => {
                  const lineCost = line.costPrice * line.quantity;
                  const margin =
                    line.lineSubtotal > 0
                      ? ((line.lineSubtotal - lineCost) / line.lineSubtotal) * 100
                      : 0;
                  const isBad = margin < line.minMarginThreshold;
                  return (
                    <TableRow key={line.id} className={isBad ? "bg-destructive/5" : ""}>
                      <TableCell className="text-xs font-medium">{line.productName}</TableCell>
                      <TableCell className="text-center font-mono text-xs">{line.quantity}</TableCell>
                      <TableCell className="text-right font-mono text-xs">{line.discountPercent}%</TableCell>
                      <TableCell className="text-right font-mono font-bold text-xs">
                        ${line.lineSubtotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`text-xs font-mono font-bold ${isBad ? "text-destructive" : "text-emerald-500"}`}>
                          {margin.toFixed(1)}%
                          {isBad && <span className="ml-1 text-[10px]">(min {line.minMarginThreshold}%)</span>}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <div className="flex justify-end text-xs pt-1 border-t border-border">
              <span className="text-muted-foreground mr-2">Total Blended Margin:</span>
              <span className={`font-mono font-bold ${
                quote.totalMarginPercent >= 30
                  ? "text-emerald-500"
                  : quote.totalMarginPercent >= 15
                  ? "text-amber-500"
                  : "text-destructive"
              }`}>
                {quote.totalMarginPercent.toFixed(1)}%
              </span>
            </div>
          </TabsContent>

          <TabsContent value="violations" className="pt-3 space-y-3">
            {lineViolations.length === 0 ? (
              <div className="py-6 text-center text-xs text-emerald-500 flex items-center justify-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                No margin threshold violations on this quote.
              </div>
            ) : (
              lineViolations.map((line) => {
                const lineCost = line.costPrice * line.quantity;
                const margin =
                  line.lineSubtotal > 0
                    ? ((line.lineSubtotal - lineCost) / line.lineSubtotal) * 100
                    : 0;
                return (
                  <div
                    key={line.id}
                    className="bg-destructive/5 border border-destructive/30 p-3 rounded-none text-xs space-y-1"
                  >
                    <div className="flex items-center gap-2 text-destructive font-semibold">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {line.productName}
                    </div>
                    <div className="text-muted-foreground space-y-0.5 pl-5">
                      <p>Applied discount: <span className="font-mono font-bold">{line.discountPercent}%</span></p>
                      <p>Resulting margin: <span className="font-mono font-bold text-destructive">{margin.toFixed(1)}%</span></p>
                      <p>Minimum required: <span className="font-mono font-bold">{line.minMarginThreshold}%</span></p>
                      <p>Violation severity: <span className="font-mono font-bold text-destructive">-{(line.minMarginThreshold - margin).toFixed(1)}% below floor</span></p>
                    </div>
                  </div>
                );
              })
            )}

            <div className="text-xs pt-2 border-t border-border">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Blended Risk Score</span>
                <span className="font-mono font-bold">{quote.blendedRiskScore} / 20</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground mt-1">
                <span>Required Approval Level</span>
                <Badge className={`text-[10px] border ${RISK_BADGE[quote.requiredApprovalLevel]}`}>
                  {quote.requiredApprovalLevel === "NONE"
                    ? "Auto-Approved"
                    : quote.requiredApprovalLevel === "SALES_MANAGER"
                    ? "Sales Manager"
                    : "Finance Sign-Off"}
                </Badge>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="audit" className="pt-3 space-y-2">
            <div className="space-y-2">
              {auditTrail.map((event, idx) => (
                <div key={event.id} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className="h-6 w-6 rounded-full bg-muted border border-border flex items-center justify-center">
                      <History className="h-3 w-3 text-muted-foreground" />
                    </div>
                    {idx < auditTrail.length - 1 && (
                      <div className="flex-1 w-px bg-border mt-1 h-6" />
                    )}
                  </div>
                  <div className="pb-4 text-xs">
                    <p className="font-semibold text-foreground">{event.event}</p>
                    <p className="text-muted-foreground">
                      {event.actor} • {new Date(event.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <Separator />

        {/* Action Notes + Buttons */}
        <div className="space-y-3 pt-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">
              Approval Notes / Rejection Reason
            </Label>
            <Input
              placeholder="Add context, conditions, or revision instructions..."
              value={actionNotes}
              onChange={(e) => setActionNotes(e.target.value)}
              className="h-9 text-xs"
            />
          </div>

          <DialogFooter className="flex flex-wrap sm:flex-row gap-2 pt-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReturn}
              disabled={isAnyPending}
              className="gap-1.5 text-xs"
            >
              {returnMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RotateCcw className="h-3.5 w-3.5 text-amber-500" />
              )}
              Return for Revision
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleReject}
              disabled={isAnyPending}
              className="gap-1.5 text-xs bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/30"
            >
              {rejectMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <XCircle className="h-3.5 w-3.5" />
              )}
              Reject
            </Button>
            <Button
              size="sm"
              onClick={handleApprove}
              disabled={isAnyPending}
              className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {approveMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
              Approve
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ApprovalsComponent() {
  const { user } = useAuthStore();
  const { data: quotes = [] } = useQuotes();
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("PENDING_APPROVAL");

  const displayQuotes = filterStatus === "ALL" ? quotes : quotes.filter((q) => q.status === filterStatus);

  const pendingCount = quotes.filter((q) => q.status === "PENDING_APPROVAL").length;

  const canApprove =
    user.role === "manager" || user.role === "finance" || user.role === "admin";

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-[1400px] mx-auto p-4 sm:p-6 space-y-4">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black tracking-tight text-foreground">
              Discount Approval Queue
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Review and approve or reject quotations requiring governance sign-off.
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

        {/* Stats Summary Cards */}
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

        {/* Filter Tabs + Table */}
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
      </div>

      {/* Detail Drawer */}
      {selectedQuote && (
        <ApprovalDetailDrawer
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
