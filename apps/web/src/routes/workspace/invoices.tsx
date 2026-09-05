import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  FileText,
  DollarSign,
  Download,
  Search,
  Filter,
  CreditCard,
  Printer,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TablePagination } from "@/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useInvoices, useRecordPayment } from "@/hooks/use-billing";
import { exportToCsv } from "@/lib/export-utils";
import type { InvoiceListItem } from "@/lib/api-types";
import { useAuthStore } from "@/stores/auth-store";

export const Route = createFileRoute("/workspace/invoices")({
  component: InvoicesPage,
});

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const TYPE_BADGES: Record<string, string> = {
  ONE_TIME: "bg-whisper-gray text-forest-ink border-pencil-gray/40",
  RECURRING: "bg-highlighter-yellow/40 text-forest-ink border-highlighter-yellow/60",
  PRORATED_SUPPLEMENTAL: "bg-sticky-note-teal text-forest-ink border-sticky-note-teal/60",
  CREDIT_NOTE: "bg-sticky-note-mint text-forest-ink border-sticky-note-mint/60",
};

const STATUS_BADGES: Record<string, string> = {
  PAID: "bg-sticky-note-mint text-forest-ink border-sticky-note-mint/60",
  ISSUED: "bg-highlighter-yellow/50 text-forest-ink border-highlighter-yellow/60",
  DRAFT: "bg-whisper-gray text-forest-ink border-pencil-gray/40",
  CANCELLED: "bg-whisper-gray text-forest-ink/50 border-pencil-gray/40",
};

function InvoicesPage() {
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [paymentInvoice, setPaymentInvoice] = useState<InvoiceListItem | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<"CREDIT_CARD" | "WIRE_TRANSFER" | "CASH">(
    "WIRE_TRANSFER",
  );
  const [paymentReference, setPaymentReference] = useState("");

  const { data, isLoading, refetch } = useInvoices({
    search: searchTerm || undefined,
    status: statusFilter,
    type: typeFilter,
    page,
    limit: pageSize,
  });

  const recordPaymentMutation = useRecordPayment("");

  const invoices = data?.invoices ?? [];
  const summary = data?.summary ?? {
    totalInvoiced: 0,
    totalPaid: 0,
    totalOutstanding: 0,
    overdueCount: 0,
  };

  const handleExportCsv = () => {
    if (invoices.length === 0) {
      toast.error("No invoices available to export");
      return;
    }

    exportToCsv(
      `dealflow360-invoices-${new Date().toISOString().split("T")[0]}`,
      invoices,
      [
        { header: "Invoice Number", accessor: "invoiceNumber" },
        { header: "Customer Name", accessor: (row) => row.customer.name },
        { header: "Customer Tier", accessor: (row) => row.customer.tier },
        { header: "Quotation Number", accessor: (row) => row.quotation?.quoteNumber ?? "N/A" },
        { header: "Invoice Type", accessor: "type" },
        { header: "Status", accessor: "status" },
        { header: "Amount ($)", accessor: (row) => row.amount.toFixed(2) },
        { header: "Due Date", accessor: (row) => row.dueDate.split("T")[0] },
        { header: "Created Date", accessor: (row) => row.createdAt.split("T")[0] },
      ],
    );
    toast.success("Invoices exported to CSV");
  };

  const handleOpenPayment = (inv: InvoiceListItem) => {
    setPaymentInvoice(inv);
    const paidSoFar = inv.payments.reduce((s, p) => s + p.amount, 0);
    const remaining = Math.max(0, inv.amount - paidSoFar);
    setPaymentAmount(remaining);
    setPaymentReference(`WIRE-${Date.now().toString().slice(-6)}`);
  };

  const handleSubmitPayment = async () => {
    if (!paymentInvoice) return;
    if (user.role !== "finance" && user.role !== "admin") {
      toast.error("Finance or Admin role required to record payments");
      return;
    }

    try {
      await recordPaymentMutation.mutateAsync({
        invoiceId: paymentInvoice.id,
        amount: paymentAmount,
        paymentMethod,
        reference: paymentReference || undefined,
      });
      toast.success(`Payment of ${currency.format(paymentAmount)} recorded`);
      setPaymentInvoice(null);
      refetch();
    } catch {
      toast.error("Failed to record invoice payment");
    }
  };

  const handlePrintInvoice = (inv: InvoiceListItem) => {
    const printUrl = `/api/billing/invoices/${inv.id}/html`;
    window.open(printUrl, "_blank");
  };

  return (
    <main className="min-h-full overflow-y-auto bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              FINANCIAL OPERATIONS
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Invoices & Billing Hub
            </h1>
            <p className="text-sm text-muted-foreground">
              Monitor accounts receivable, reconcile hybrid invoices, and record incoming payments.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-pencil-gray text-forest-ink hover:bg-whisper-gray"
              onClick={handleExportCsv}
            >
              <Download className="mr-1.5 h-4 w-4" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-pencil-gray text-forest-ink hover:bg-whisper-gray"
              onClick={() => refetch()}
            >
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="rounded-xl border border-pencil-gray/40 bg-card shadow-none">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Total Invoiced
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {currency.format(summary.totalInvoiced)}
              </div>
              <p className="text-xs text-muted-foreground">Total billing generated</p>
            </CardContent>
          </Card>

          <Card className="rounded-xl border border-pencil-gray/40 bg-card shadow-none">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Total Collected
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {currency.format(summary.totalPaid)}
              </div>
              <p className="text-xs text-muted-foreground">Settled invoices &amp; payments</p>
            </CardContent>
          </Card>

          <Card className="rounded-xl border border-pencil-gray/40 bg-card shadow-none">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Outstanding Balance
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {currency.format(summary.totalOutstanding)}
              </div>
              <p className="text-xs text-muted-foreground">Pending receivables</p>
            </CardContent>
          </Card>

          <Card className="rounded-xl border border-pencil-gray/40 bg-card shadow-none">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Overdue Invoices
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-terracotta" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-terracotta">
                {summary.overdueCount}
              </div>
              <p className="text-xs text-muted-foreground">Past due payment term</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search invoice, customer, or quote..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="pl-9 text-sm"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Filter className="h-3.5 w-3.5" />
              <span>Status:</span>
            </div>
            {["ALL", "ISSUED", "PAID", "DRAFT", "CANCELLED"].map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? "default" : "outline"}
                size="sm"
                className={`h-8 text-xs ${statusFilter === status ? "bg-forest-ink text-cream-paper hover:bg-forest-ink/90" : "border-pencil-gray text-forest-ink hover:bg-whisper-gray"}`}
                onClick={() => {
                  setStatusFilter(status);
                  setPage(1);
                }}
              >
                {status}
              </Button>
            ))}

            <div className="ml-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>Type:</span>
            </div>
            {["ALL", "ONE_TIME", "RECURRING", "PRORATED_SUPPLEMENTAL", "CREDIT_NOTE"].map(
              (type) => (
                <Button
                  key={type}
                  variant={typeFilter === type ? "default" : "outline"}
                  size="sm"
                  className={`h-8 text-xs ${typeFilter === type ? "bg-forest-ink text-cream-paper hover:bg-forest-ink/90" : "border-pencil-gray text-forest-ink hover:bg-whisper-gray"}`}
                  onClick={() => {
                    setTypeFilter(type);
                    setPage(1);
                  }}
                >
                  {type === "PRORATED_SUPPLEMENTAL"
                    ? "PRORATED"
                    : type === "CREDIT_NOTE"
                      ? "CREDIT"
                      : type}
                </Button>
              ),
            )}
          </div>
        </div>

        <Card className="rounded-xl border border-pencil-gray/40 bg-card shadow-none">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-12 text-center text-sm text-muted-foreground">
                Loading invoices and payment ledger...
              </div>
            ) : invoices.length === 0 ? (
              <div className="p-12 text-center text-sm text-muted-foreground">
                No invoices found matching the current filters.
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-pencil-gray/30 bg-whisper-gray text-xs font-semibold text-forest-ink/60">
                      <tr>
                        <th className="px-4 py-3">Invoice #</th>
                        <th className="px-4 py-3">Customer</th>
                        <th className="px-4 py-3">Quotation</th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3 text-right">Amount</th>
                        <th className="px-4 py-3">Due Date</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-pencil-gray/20">
                      {invoices.map((inv) => {
                        const isPaid = inv.status === "PAID";
                        const isOverdue =
                          inv.status === "ISSUED" && new Date(inv.dueDate) < new Date();

                        return (
                          <tr key={inv.id} className="hover:bg-whisper-gray/50 transition-colors">
                            <td className="px-4 py-3 font-mono font-medium text-foreground">
                              {inv.invoiceNumber}
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-medium text-foreground">{inv.customer.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {inv.customer.email}
                              </div>
                            </td>
                            <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                              {inv.quotation ? (
                                <Link
                                  to="/workspace/billing/$id"
                                  params={{ id: inv.quotation.id }}
                                  className="text-primary hover:underline"
                                >
                                  {inv.quotation.quoteNumber}
                                </Link>
                              ) : (
                                "Manual Contract"
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <Badge
                                variant="outline"
                                className={`text-[11px] font-semibold ${TYPE_BADGES[inv.type] || ""}`}
                              >
                                {inv.type}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-bold text-foreground">
                              {currency.format(inv.amount)}
                            </td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">
                              <span className={isOverdue ? "font-semibold text-terracotta" : ""}>
                                {new Date(inv.dueDate).toLocaleDateString()}
                              </span>
                              {isOverdue && (
                                <span className="ml-1 text-[10px] text-terracotta font-bold">
                                  (Overdue)
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <Badge
                                variant="outline"
                                className={`text-[11px] font-semibold ${STATUS_BADGES[inv.status] || ""}`}
                              >
                                {inv.status}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 px-2 text-xs border-pencil-gray text-forest-ink hover:bg-whisper-gray"
                                  onClick={() => handlePrintInvoice(inv)}
                                  title="Print / Save as PDF"
                                >
                                  <Printer className="mr-1 h-3.5 w-3.5" />
                                  Print
                                </Button>

                                {!isPaid && inv.status !== "CANCELLED" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 px-2 text-xs border-pencil-gray text-forest-ink hover:bg-whisper-gray"
                                    onClick={() => handleOpenPayment(inv)}
                                  >
                                    <CreditCard className="mr-1 h-3.5 w-3.5" />
                                    Pay
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <TablePagination
                  page={page}
                  pageSize={pageSize}
                  total={data?.total ?? invoices.length}
                  totalPages={data?.totalPages ?? 1}
                  onPageChange={setPage}
                  onPageSizeChange={setPageSize}
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={Boolean(paymentInvoice)} onOpenChange={(open) => !open && setPaymentInvoice(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record Invoice Payment</DialogTitle>
            <DialogDescription>
              Record an incoming payment against Invoice {paymentInvoice?.invoiceNumber}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Customer</Label>
              <Input disabled value={paymentInvoice?.customer.name ?? ""} className="text-sm" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Payment Amount ($)</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                max={paymentInvoice?.amount ?? 999999}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                className="text-sm font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Payment Method</Label>
              <select
                value={paymentMethod}
                onChange={(e) =>
                  setPaymentMethod(e.target.value as "CREDIT_CARD" | "WIRE_TRANSFER" | "CASH")
                }
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="WIRE_TRANSFER">Wire Transfer (ACH / Bank)</option>
                <option value="CREDIT_CARD">Credit Card</option>
                <option value="CASH">Cash / Direct</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Reference Number</Label>
              <Input
                type="text"
                placeholder="e.g. WIRE-849204"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                className="text-sm font-mono"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="border-pencil-gray text-forest-ink hover:bg-whisper-gray"
              onClick={() => setPaymentInvoice(null)}
            >
              Cancel
            </Button>
            <Button
              className="bg-forest-ink text-cream-paper hover:bg-forest-ink/90"
              onClick={handleSubmitPayment}
              disabled={paymentAmount <= 0 || recordPaymentMutation.isPending}
            >
              {recordPaymentMutation.isPending ? "Recording..." : "Confirm Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

