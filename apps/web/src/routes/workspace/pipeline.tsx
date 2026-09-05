import React, { useState, useMemo } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  RefreshCw,
  Search,
  Building2,
  ExternalLink,
  ShieldCheck,
  FileText,
  Eye,
  GripVertical,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { exportToCsv } from "@/lib/export-utils";

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useQuotes,
  useQuote,
  useSubmitQuoteForApproval,
  useApproveQuote,
  useRejectQuote,
} from "@/hooks/use-quotes";
import type { Quote, QuoteStatus } from "@/lib/api-types";
import { TIER_BADGE_STYLES } from "@/components/customer-selector";

export const Route = createFileRoute("/workspace/pipeline")({
  component: PipelineComponent,
});

const COLUMNS: Array<{ status: QuoteStatus; label: string; badgeClass: string }> = [
  { status: "DRAFT", label: "Draft", badgeClass: "border-slate-500/30 text-slate-400 bg-slate-500/10" },
  { status: "PENDING_APPROVAL", label: "In Review", badgeClass: "border-amber-500/30 text-amber-500 bg-amber-500/10" },
  { status: "APPROVED", label: "Approved", badgeClass: "border-emerald-500/30 text-emerald-500 bg-emerald-500/10" },
  { status: "UNDER_NEGOTIATION", label: "In Negotiation", badgeClass: "border-blue-500/30 text-blue-400 bg-blue-500/10" },
  { status: "CONFIRMED", label: "Confirmed", badgeClass: "border-purple-500/30 text-purple-400 bg-purple-500/10" },
  { status: "FULFILLED", label: "Fulfilled", badgeClass: "border-teal-500/30 text-teal-400 bg-teal-500/10" },
];

function PipelineComponent() {
  const quotesQuery = useQuotes();
  const submitApprovalMutation = useSubmitQuoteForApproval();
  const approveMutation = useApproveQuote();
  const rejectMutation = useRejectQuote();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);

  // Optimistic local status overrides for drag-and-drop & stage selector
  const [statusOverrides, setStatusOverrides] = useState<Record<string, QuoteStatus>>({});

  // Drag & Drop State
  const [draggingQuoteId, setDraggingQuoteId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<QuoteStatus | null>(null);

  const rawQuotes = quotesQuery.data ?? [];

  // Effective quotes reflecting optimistic status moves
  const effectiveQuotes = useMemo(() => {
    return rawQuotes.map((q) => ({
      ...q,
      status: statusOverrides[q.id] ?? q.status,
    }));
  }, [rawQuotes, statusOverrides]);

  const filteredQuotes = useMemo(() => {
    return effectiveQuotes.filter((q) => {
      const matchesSearch =
        q.quoteNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.customerName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [effectiveQuotes, searchQuery]);

  // High level Pipeline KPIs
  const totalPipelineValue = useMemo(
    () => effectiveQuotes.filter((q) => q.status !== "REJECTED").reduce((sum, q) => sum + q.totalSubtotal, 0),
    [effectiveQuotes]
  );
  const activeDealsCount = useMemo(
    () => effectiveQuotes.filter((q) => q.status !== "REJECTED" && q.status !== "FULFILLED").length,
    [effectiveQuotes]
  );
  const pendingApprovalsCount = useMemo(
    () => effectiveQuotes.filter((q) => q.status === "PENDING_APPROVAL").length,
    [effectiveQuotes]
  );
  const inNegotiationValue = useMemo(
    () => effectiveQuotes.filter((q) => q.status === "UNDER_NEGOTIATION").reduce((sum, q) => sum + q.totalSubtotal, 0),
    [effectiveQuotes]
  );
  const avgMargin = useMemo(() => {
    if (effectiveQuotes.length === 0) return 0;
    return effectiveQuotes.reduce((sum, q) => sum + q.totalMarginPercent, 0) / effectiveQuotes.length;
  }, [effectiveQuotes]);

  const handleDragStart = (e: React.DragEvent, quoteId: string) => {
    e.dataTransfer.setData("text/plain", quoteId);
    e.dataTransfer.effectAllowed = "move";
    setDraggingQuoteId(quoteId);
  };

  const handleDragEnd = () => {
    setDraggingQuoteId(null);
    setDragOverColumn(null);
  };

  const handleMoveQuoteStatus = (quoteId: string, targetStatus: QuoteStatus) => {
    const targetQuote = effectiveQuotes.find((q) => q.id === quoteId);
    if (!targetQuote) return;
    if (targetQuote.status === targetStatus) return;

    // Immediately reflect the move in the UI
    setStatusOverrides((prev) => ({ ...prev, [quoteId]: targetStatus }));
    const label = COLUMNS.find((c) => c.status === targetStatus)?.label || targetStatus;

    if (targetStatus === "PENDING_APPROVAL") {
      submitApprovalMutation.mutate(
        { quoteId },
        {
          onSuccess: () => {
            toast.success(`Quote #${targetQuote.quoteNumber} moved to ${label}`);
          },
        }
      );
    } else if (targetStatus === "APPROVED") {
      approveMutation.mutate(
        { quoteId, actorRole: "manager" },
        {
          onSuccess: () => {
            toast.success(`Quote #${targetQuote.quoteNumber} Approved!`);
          },
        }
      );
    } else if (targetStatus === "REJECTED") {
      rejectMutation.mutate(
        { quoteId, reason: "Moved to Rejected stage" },
        {
          onSuccess: () => {
            toast.success(`Quote #${targetQuote.quoteNumber} Rejected.`);
          },
        }
      );
    } else {
      toast.success(`Quote #${targetQuote.quoteNumber} moved to ${label}`);
    }
  };

  const handleDropOnColumn = (targetStatus: QuoteStatus, quoteId: string) => {
    setDragOverColumn(null);
    setDraggingQuoteId(null);
    handleMoveQuoteStatus(quoteId, targetStatus);
  };

  const handleExportPipelineCsv = () => {
    if (filteredQuotes.length === 0) {
      toast.error("No quotes available to export");
      return;
    }

    exportToCsv(
      `commercial-pipeline-${new Date().toISOString().slice(0, 10)}.csv`,
      filteredQuotes,
      [
        { header: "Quote Number", accessor: (q) => q.quoteNumber },
        { header: "Customer Name", accessor: (q) => q.customerName },
        { header: "Customer Tier", accessor: (q) => q.customerTier },
        { header: "Status", accessor: (q) => q.status },
        { header: "Subtotal ($)", accessor: (q) => q.totalSubtotal.toFixed(2) },
        { header: "Total Margin ($)", accessor: (q) => q.totalMarginAmount.toFixed(2) },
        { header: "Total Cost ($)", accessor: (q) => q.totalCost.toFixed(2) },
        { header: "Margin %", accessor: (q) => q.totalMarginPercent.toFixed(1) },
        { header: "Risk Score", accessor: (q) => q.blendedRiskScore.toFixed(1) },
        { header: "Required Approval Level", accessor: (q) => q.requiredApprovalLevel },
        { header: "Line Items Count", accessor: (q) => q.lines?.length ?? 0 },
        { header: "Created Date", accessor: (q) => new Date(q.createdAt).toLocaleDateString() },
      ],
    );
    toast.success(`Exported ${filteredQuotes.length} quotes to CSV`);
  };

  if (quotesQuery.isLoading) return <PageState label="Loading commercial pipeline..." />;
  if (quotesQuery.isError)
    return (
      <PageState
        label="Pipeline data is currently unavailable"
        action={<Button onClick={() => quotesQuery.refetch()}>Try again</Button>}
      />
    );

  return (
    <main className="min-h-full overflow-y-auto bg-background text-foreground pb-12">
      <div className="mx-auto max-w-[1800px] space-y-6 p-6">
        {/* Header & KPI Summary */}
        <header className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-mono text-xs tracking-[0.08em] text-muted-foreground uppercase">COMMERCIAL PIPELINE</p>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Deal Flow & Drag-and-Drop Kanban</h1>
              <p className="text-xs text-muted-foreground">
                Drag quotes across columns or use stage selectors to transition quotes between sales lifecycle stages.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPipelineCsv}
                className="h-9 text-xs gap-1.5"
              >
                <Download className="h-3.5 w-3.5 text-primary" />
                <span>Export Pipeline (.csv)</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => quotesQuery.refetch()}
                className="h-9 text-xs gap-1.5"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${quotesQuery.isFetching ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </Button>
              <Link to="/workspace/builder">
                <Button size="sm" className="h-9 text-xs font-semibold gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  <span>Create Quotation</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="bg-card border-border p-4">
              <span className="text-xs text-muted-foreground block font-medium">Total Pipeline Value</span>
              <span className="text-2xl font-black font-mono text-foreground">
                ${totalPipelineValue.toLocaleString("en-US", { maximumFractionDigits: 0 })}
              </span>
              <p className="text-[10px] text-muted-foreground pt-1">Across all active stages</p>
            </Card>

            <Card className="bg-card border-border p-4">
              <span className="text-xs text-muted-foreground block font-medium">Active Deals</span>
              <span className="text-2xl font-black font-mono text-emerald-500">
                {activeDealsCount} <span className="text-xs font-normal text-muted-foreground">quotes</span>
              </span>
              <p className="text-[10px] text-muted-foreground pt-1">{pendingApprovalsCount} awaiting approval review</p>
            </Card>

            <Card className="bg-card border-border p-4">
              <span className="text-xs text-muted-foreground block font-medium">In Negotiation Value</span>
              <span className="text-2xl font-black font-mono text-blue-500">
                ${inNegotiationValue.toLocaleString("en-US", { maximumFractionDigits: 0 })}
              </span>
              <p className="text-[10px] text-muted-foreground pt-1">Customer counter proposals</p>
            </Card>

            <Card className="bg-card border-border p-4">
              <span className="text-xs text-muted-foreground block font-medium">Avg Blended Margin</span>
              <span className="text-2xl font-black font-mono text-purple-500">
                {avgMargin.toFixed(1)}%
              </span>
              <p className="text-[10px] text-muted-foreground pt-1">Gross margin performance</p>
            </Card>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex items-center gap-3 bg-card p-3 rounded-lg border border-border">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by Quote # or Customer Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 text-xs bg-background border-border max-w-xs"
            />
            <span className="text-xs text-muted-foreground ml-auto font-mono">
              Showing {filteredQuotes.length} of {effectiveQuotes.length} total quotes • Drag cards or change stage dropdown
            </span>
          </div>
        </header>

        {/* Kanban Board Horizontal Flex Container with Fixed Width Columns */}
        <div className="flex gap-4 overflow-x-auto pb-6 items-start min-h-[600px] w-full">
          {COLUMNS.map((column) => {
            const columnQuotes = filteredQuotes.filter((quote) => quote.status === column.status);
            const columnTotal = columnQuotes.reduce((sum, q) => sum + q.totalSubtotal, 0);
            const isTarget = dragOverColumn === column.status;

            return (
              <section
                key={column.status}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                }}
                onDragEnter={() => setDragOverColumn(column.status)}
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    setDragOverColumn(null);
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const quoteId = e.dataTransfer.getData("text/plain") || draggingQuoteId;
                  if (quoteId) {
                    handleDropOnColumn(column.status, quoteId);
                  }
                }}
                className={`w-80 flex-shrink-0 border bg-card/70 rounded-xl flex flex-col transition-all duration-200 shadow-sm ${isTarget
                    ? "border-primary ring-2 ring-primary/30 bg-primary/5 shadow-md"
                    : "border-border"
                  }`}
              >
                <div className="flex items-center justify-between border-b border-border p-3.5 bg-muted/40 rounded-t-xl">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">{column.label}</h2>
                    <Badge variant="outline" className={`text-[10px] font-mono px-1.5 py-0 ${column.badgeClass}`}>
                      {columnQuotes.length}
                    </Badge>
                  </div>
                  <span className="text-xs font-mono font-semibold text-muted-foreground">
                    ${columnTotal.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                  </span>
                </div>

                <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[calc(100vh-300px)] min-h-[180px]">
                  {columnQuotes.length === 0 ? (
                    <div
                      className={`h-32 flex items-center justify-center text-center p-3 text-xs rounded-lg border border-dashed transition-colors ${isTarget
                          ? "border-primary text-primary font-medium bg-primary/10"
                          : "border-border/60 text-muted-foreground/60"
                        }`}
                    >
                      {isTarget ? "Drop Quote Here" : "No quotes in stage"}
                    </div>
                  ) : (
                    columnQuotes.map((quote) => (
                      <DealCard
                        key={quote.id}
                        quote={quote}
                        isDragging={draggingQuoteId === quote.id}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        onSelectQuote={(id) => setSelectedQuoteId(id)}
                        onStatusChange={handleMoveQuoteStatus}
                      />
                    ))
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      {/* Quote Detail Modal */}
      {selectedQuoteId && (
        <QuoteDetailModal
          quoteId={selectedQuoteId}
          open={Boolean(selectedQuoteId)}
          onClose={() => setSelectedQuoteId(null)}
          onStatusChange={handleMoveQuoteStatus}
        />
      )}
    </main>
  );
}

type DealCardProps = {
  quote: Quote;
  isDragging?: boolean;
  onDragStart: (e: React.DragEvent, quoteId: string) => void;
  onDragEnd: () => void;
  onSelectQuote: (id: string) => void;
  onStatusChange: (quoteId: string, status: QuoteStatus) => void;
};

function DealCard({
  quote,
  isDragging,
  onDragStart,
  onDragEnd,
  onSelectQuote,
  onStatusChange,
}: DealCardProps) {
  const tierStyle = TIER_BADGE_STYLES[quote.customerTier] || "border-border text-foreground";

  return (
    <Card
      draggable
      onDragStart={(e) => onDragStart(e, quote.id)}
      onDragEnd={onDragEnd}
      onClick={() => onSelectQuote(quote.id)}
      className={`w-full rounded-lg border-border bg-card shadow-sm hover:shadow-md hover:border-primary/50 transition-all cursor-grab active:cursor-grabbing group select-none relative ${isDragging ? "opacity-30 scale-95 border-dashed border-primary bg-primary/5" : ""
        }`}
    >
      <CardContent className="space-y-3 p-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-0.5 min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <GripVertical className="h-3 w-3 text-muted-foreground/40 group-hover:text-muted-foreground flex-shrink-0 transition-colors" />
              <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors truncate">
                {quote.customerName}
              </p>
            </div>
            <p className="font-mono text-[11px] text-muted-foreground pl-4">
              {quote.quoteNumber}
            </p>
          </div>
          <Badge variant="outline" className={`text-[9px] font-mono px-1.5 py-0 flex-shrink-0 ${tierStyle}`}>
            {quote.customerTier}
          </Badge>
        </div>

        <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/60">
          <div>
            <span className="font-mono text-sm font-extrabold text-foreground block">
              ${quote.totalSubtotal.toLocaleString("en-US", { maximumFractionDigits: 0 })}
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">
              Margin: <span className="font-semibold text-emerald-500">{quote.totalMarginPercent.toFixed(1)}%</span>
            </span>
          </div>

          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0.5 flex-shrink-0 ${quote.requiredApprovalLevel === "NONE"
                ? "border-emerald-500/30 text-emerald-500"
                : quote.requiredApprovalLevel === "SALES_MANAGER"
                  ? "border-amber-500/30 text-amber-500"
                  : "border-red-500/30 text-red-500"
              }`}
          >
            {quote.requiredApprovalLevel === "NONE" ? "Auto-Approved" : quote.requiredApprovalLevel}
          </Badge>
        </div>

        {/* Stage Selector Dropdown */}
        <div className="pt-1 flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
          <span className="text-[10px] text-muted-foreground font-mono">Stage:</span>
          <select
            value={quote.status}
            onChange={(e) => onStatusChange(quote.id, e.target.value as QuoteStatus)}
            className="h-6 text-[10px] font-mono bg-muted/60 border border-border rounded px-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary max-w-[150px]"
          >
            {COLUMNS.map((col) => (
              <option key={col.status} value={col.status}>
                {col.label}
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-border/40" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="outline"
            size="xs"
            onClick={() => onSelectQuote(quote.id)}
            className="h-7 text-[11px] gap-1 px-2 flex-1"
          >
            <Eye className="h-3 w-3" />
            <span>Details</span>
          </Button>

          {quote.portalAccessToken && (
            <Link to="/portal/quote/$token" params={{ token: quote.portalAccessToken }} target="_blank">
              <Button
                variant="ghost"
                size="xs"
                className="h-7 text-[11px] gap-1 text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 px-2"
                title="Open Customer Portal"
              >
                <ExternalLink className="h-3 w-3" />
                <span className="hidden sm:inline">Portal</span>
              </Button>
            </Link>
          )}

          <Link to="/workspace/fulfillment/$id" params={{ id: quote.id }}>
            <Button
              variant="ghost"
              size="xs"
              className="h-7 text-[11px] gap-1 px-2 text-muted-foreground hover:text-foreground"
              title="Fulfillment details"
            >
              <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function QuoteDetailModal({
  quoteId,
  open,
  onClose,
  onStatusChange,
}: {
  quoteId: string;
  open: boolean;
  onClose: () => void;
  onStatusChange: (quoteId: string, status: QuoteStatus) => void;
}) {
  const { data: quote, isLoading } = useQuote(quoteId);

  if (isLoading || !quote) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-xl bg-card border-border">
          <div className="py-8 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin text-primary" />
            <span>Loading quotation details...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const handleStageSelect = (newStatus: QuoteStatus) => {
    onStatusChange(quote.id, newStatus);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto bg-card text-card-foreground border-border space-y-4 p-6">
        <DialogHeader>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                <span className="text-sm font-bold text-foreground">{quote.customerName}</span>
                <Badge variant="outline" className="text-[10px] font-mono">
                  Tier: {quote.customerTier}
                </Badge>
              </div>
              <DialogTitle className="text-xl font-bold tracking-tight text-foreground pt-1">
                Quotation #{quote.quoteNumber}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Created on {new Date(quote.createdAt).toLocaleDateString("en-US", { dateStyle: "medium" })}
              </DialogDescription>
            </div>

            <div className="text-right">
              <span className="text-xs text-muted-foreground block font-medium">Total Quotation Subtotal</span>
              <span className="text-2xl font-black font-mono text-emerald-500">
                ${quote.totalSubtotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </DialogHeader>

        {/* Customer Portal Link Highlight */}
        {quote.portalAccessToken && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-lg flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4" />
                <span>Customer Portal Magic Access Link Ready</span>
              </span>
              <p className="text-[11px] text-muted-foreground font-mono truncate max-w-md">
                /portal/quote/{quote.portalAccessToken}
              </p>
            </div>
            <Link to="/portal/quote/$token" params={{ token: quote.portalAccessToken }} target="_blank">
              <Button size="xs" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5">
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Open Portal</span>
              </Button>
            </Link>
          </div>
        )}

        {/* Stage Changer Section */}
        <div className="bg-muted/40 p-3 rounded-lg border border-border flex items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-foreground block">Pipeline Lifecycle Stage</span>
            <span className="text-[11px] text-muted-foreground">Select a new stage to transition this deal</span>
          </div>

          <div className="flex items-center gap-2">
            {COLUMNS.map((col) => (
              <Button
                key={col.status}
                size="xs"
                variant={quote.status === col.status ? "default" : "outline"}
                onClick={() => handleStageSelect(col.status)}
                className="text-[10px] font-mono h-7"
              >
                {col.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-muted/40 p-3 rounded border border-border">
            <span className="text-[11px] text-muted-foreground block">Blended Margin</span>
            <span className="text-lg font-bold font-mono text-purple-500">
              {quote.totalMarginPercent.toFixed(1)}%
            </span>
          </div>

          <div className="bg-muted/40 p-3 rounded border border-border">
            <span className="text-[11px] text-muted-foreground block">Risk Score</span>
            <span className="text-lg font-bold font-mono text-foreground">
              {quote.blendedRiskScore} pts
            </span>
          </div>

          <div className="bg-muted/40 p-3 rounded border border-border">
            <span className="text-[11px] text-muted-foreground block">Approval Level</span>
            <span className="text-xs font-semibold font-mono text-amber-500">
              {quote.requiredApprovalLevel}
            </span>
          </div>
        </div>

        {/* Line Items Schedule */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-foreground">Line Items Schedule</h3>
          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="text-xs font-bold">Item Description</TableHead>
                  <TableHead className="text-xs font-bold text-center">Qty</TableHead>
                  <TableHead className="text-xs font-bold text-right">Unit Price</TableHead>
                  <TableHead className="text-xs font-bold text-right">Discount</TableHead>
                  <TableHead className="text-xs font-bold text-right">Subtotal</TableHead>
                  <TableHead className="text-xs font-bold text-right">Margin</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quote.lines.map((line) => (
                  <TableRow key={line.id}>
                    <TableCell className="text-xs font-medium text-foreground">{line.productName}</TableCell>
                    <TableCell className="text-center font-mono text-xs">{line.quantity}</TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      ${line.unitPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {line.discountPercent}%
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold text-xs">
                      ${line.lineSubtotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-purple-500 font-semibold">
                      {(((line.lineSubtotal - line.costPrice * line.quantity) / (line.lineSubtotal || 1)) * 100).toFixed(1)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Action Footer */}
        <DialogFooter className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border">
          <div className="flex items-center gap-2">
            <Link to="/workspace/fulfillment/$id" params={{ id: quote.id }}>
              <Button variant="outline" size="sm" className="text-xs">
                Fulfillment
              </Button>
            </Link>
            <Link to="/workspace/billing/$id" params={{ id: quote.id }}>
              <Button variant="outline" size="sm" className="text-xs">
                Billing
              </Button>
            </Link>
          </div>

          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PageState({ label, action }: { label: string; action?: React.ReactNode }) {
  return (
    <main className="flex min-h-full items-center justify-center bg-background p-6">
      <div className="space-y-4 text-center">
        <RefreshCw className="mx-auto h-6 w-6 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {action}
      </div>
    </main>
  );
}
