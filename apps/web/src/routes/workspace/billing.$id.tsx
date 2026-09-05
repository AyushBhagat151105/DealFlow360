import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  CalendarClock,
  CreditCard,
  FileText,
  RefreshCw,
  Sliders,
  TrendingUp,
  CheckCircle,
  Receipt,
  Sparkles,
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
  useGenerateBilling,
  useQuoteBilling,
  useRecordPayment,
  useModifySubscriptionSeats,
} from "@/hooks/use-billing";
import { useAuthStore } from "@/stores/auth-store";
import type { SubscriptionContract } from "@/lib/api-types";

export const Route = createFileRoute("/workspace/billing/$id")({
  component: BillingComponent,
});

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

const INVOICE_TYPE_BADGES: Record<string, string> = {
  ONE_TIME: "bg-whisper-gray text-forest-ink border-pencil-gray/40",
  RECURRING: "bg-highlighter-yellow/40 text-forest-ink border-highlighter-yellow/60",
  PRORATED_SUPPLEMENTAL: "bg-sticky-note-teal text-forest-ink border-sticky-note-teal/60",
  CREDIT_NOTE: "bg-sticky-note-mint text-forest-ink border-sticky-note-mint/60",
};

function BillingComponent() {
  const { id } = Route.useParams();
  const { user } = useAuthStore();
  const billingQuery = useQuoteBilling(id);
  const generateMutation = useGenerateBilling(id);
  const paymentMutation = useRecordPayment(id);
  const modifySeatsMutation = useModifySubscriptionSeats(id);

  const [selectedSub, setSelectedSub] = useState<SubscriptionContract | null>(null);
  const [targetSeats, setTargetSeats] = useState<number>(10);
  const [prorationDialogOpen, setProrationDialogOpen] = useState(false);

  const canAct = user.role === "finance" || user.role === "admin";

  if (billingQuery.isLoading) return <PageState label="Loading hybrid billing records..." />;
  if (billingQuery.isError || !billingQuery.data) {
    return (
      <PageState
        label="Billing records are unavailable for this quotation"
        action={<Button onClick={() => billingQuery.refetch()}>Try again</Button>}
      />
    );
  }

  const billing = billingQuery.data;

  const generateBilling = async () => {
    if (!canAct) {
      toast.error("Finance or Admin role required to generate billing records");
      return;
    }
    try {
      await generateMutation.mutateAsync();
      toast.success("Hybrid billing schedule and invoices generated");
    } catch {
      toast.error("Billing records could not be generated. Ensure quote is confirmed.");
    }
  };

  const recordPayment = async (invoiceId: string, amount: number) => {
    if (!canAct) {
      toast.error("Finance or Admin role required to record payments");
      return;
    }
    try {
      await paymentMutation.mutateAsync({ invoiceId, amount, paymentMethod: "CREDIT_CARD" });
      toast.success(`Payment of ${currency.format(amount)} recorded successfully`);
    } catch {
      toast.error("The payment could not be recorded");
    }
  };

  const openProrationSimulator = (sub: SubscriptionContract) => {
    setSelectedSub(sub);
    setTargetSeats(sub.seats);
    setProrationDialogOpen(true);
  };

  const calculateProrationPreview = () => {
    if (!selectedSub) return { delta: 0, proratedAmount: 0, newMonthlyTotal: 0, daysRemaining: 15 };
    const delta = targetSeats - selectedSub.seats;
    const unitPrice = selectedSub.recurringMonthlyAmount / (selectedSub.seats || 1);
    const daysRemaining = 18;
    const daysInMonth = 30;
    const prorationRatio = daysRemaining / daysInMonth;
    const proratedAmount = delta > 0 ? delta * unitPrice * prorationRatio : 0;
    const newMonthlyTotal = targetSeats * unitPrice;

    return {
      delta,
      proratedAmount,
      newMonthlyTotal,
      daysRemaining,
    };
  };

  const handleApplySeats = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub) return;

    if (!canAct) {
      toast.error("Finance or Admin role required to modify contract seats");
      return;
    }

    try {
      await modifySeatsMutation.mutateAsync({
        contractId: selectedSub.id,
        newSeatCount: targetSeats,
      });
      toast.success(`Subscription seats updated to ${targetSeats}. Prorated supplemental invoice generated.`);
      setProrationDialogOpen(false);
    } catch {
      toast.error("Failed to update subscription seats");
    }
  };

  const prorationPreview = calculateProrationPreview();

  return (
    <main className="min-h-full overflow-y-auto bg-background">
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs tracking-[0.08em] text-muted-foreground uppercase">
                BILLING &amp; REVENUE ENGINE
              </span>
              <Badge variant="outline" className="text-[10px] font-mono border-pencil-gray/40 text-forest-ink/60">
                HYBRID SPLIT (ONE-TIME + RECURRING)
              </Badge>
            </div>
            <h1 className="text-2xl font-semibold tracking-[-0.02em] text-foreground">Invoicing &amp; Subscription Schedules</h1>
            <p className="text-sm text-muted-foreground">
              Quote <span className="font-mono font-medium text-foreground">{id}</span> · Automated one-time hardware lines and recurring SaaS subscription schedules.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={generateBilling}
              disabled={generateMutation.isPending || !canAct}
              className="gap-2 text-xs border-pencil-gray text-forest-ink hover:bg-whisper-gray"
            >
              <Receipt className="h-3.5 w-3.5" />
              {generateMutation.isPending ? "Generating..." : "Generate Billing Schedule"}
            </Button>
          </div>
        </header>

        <Card className="rounded-lg border-border bg-card shadow-none">
          <CardHeader className="border-b border-border flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4 text-primary" />
              Invoices ({billing.invoices.length})
            </CardTitle>
            <span className="text-xs text-muted-foreground font-mono">
              Total Invoiced: {currency.format(billing.invoices.reduce((sum, inv) => sum + inv.amount, 0))}
            </span>
          </CardHeader>
          <CardContent className="p-0">
            {billing.invoices.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <p className="text-sm text-muted-foreground">No invoices have been generated yet for this quote.</p>
                {canAct && (
                  <Button size="sm" variant="outline" onClick={generateBilling} disabled={generateMutation.isPending}>
                    Generate Initial Invoices
                  </Button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-border">
                {billing.invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="grid gap-4 p-5 md:grid-cols-[2fr_1fr_1.5fr_auto] md:items-center"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">{invoice.invoiceNumber}</p>
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 border ${INVOICE_TYPE_BADGES[invoice.type] || ""}`}
                        >
                          {invoice.type.replaceAll("_", " ")}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Due: {new Date(invoice.dueDate).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="font-mono text-sm font-semibold">
                      {currency.format(invoice.amount)}
                    </div>

                    <div>
                      <Badge
                        className={`text-xs ${invoice.status === "PAID"
                          ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/30"
                          : invoice.status === "ISSUED"
                            ? "bg-amber-500/15 text-amber-500 border-amber-500/30"
                            : "bg-muted text-muted-foreground"
                          }`}
                      >
                        {invoice.status}
                      </Badge>
                    </div>

                    <div className="text-right">
                      {invoice.status === "ISSUED" && (
                        <Button
                          size="sm"
                          onClick={() => recordPayment(invoice.id, invoice.amount)}
                          disabled={paymentMutation.isPending || !canAct}
                          className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
                        >
                          <CreditCard className="h-3.5 w-3.5" />
                          Record Payment
                        </Button>
                      )}
                      {invoice.status === "PAID" && (
                        <span className="text-xs text-emerald-500 flex items-center justify-end gap-1">
                          <CheckCircle className="h-3.5 w-3.5" /> Settled
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-lg border-border bg-card shadow-none">
          <CardHeader className="border-b border-border flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarClock className="h-4 w-4 text-primary" />
              Active Subscription Contracts ({billing.subscriptions.length})
            </CardTitle>
            <Badge variant="outline" className="text-[10px] font-mono border-primary/40 text-primary">
              MID-CYCLE PRORATION SUPPORTED
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            {billing.subscriptions.length === 0 ? (
              <p className="p-8 text-sm text-muted-foreground text-center">
                No recurring subscription contracts associated with this quote.
              </p>
            ) : (
              <div className="divide-y divide-border">
                {billing.subscriptions.map((subscription) => (
                  <div key={subscription.id} className="p-5 space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold">{subscription.planName}</h3>
                          <Badge className="bg-purple-500/15 text-purple-400 border-purple-500/30 text-[10px]">
                            {subscription.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          <span className="font-semibold text-foreground">{subscription.seats} active seats</span> ·{" "}
                          <span className="font-mono text-primary font-medium">
                            {currency.format(subscription.recurringMonthlyAmount)}
                          </span>{" "}
                          per billing period
                        </p>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openProrationSimulator(subscription)}
                        className="gap-2 text-xs border-pencil-gray text-forest-ink hover:bg-whisper-gray"
                      >
                        <Sliders className="h-3.5 w-3.5" />
                        Simulate Proration / Adjust Seats
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[11px] font-mono uppercase text-muted-foreground tracking-wider">
                        Future Invoicing Schedule:
                      </span>
                      <div className="grid gap-3 sm:grid-cols-3">
                        {subscription.schedules.map((schedule, idx) => (
                          <div
                            key={`${schedule.billingDate}-${idx}`}
                            className="border border-pencil-gray/40 bg-card p-3 rounded-lg"
                          >
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>Period Cycle #{idx + 1}</span>
                              <CalendarClock className="h-3.5 w-3.5 text-primary" />
                            </div>
                            <p className="mt-1 font-mono text-sm font-semibold">
                              {new Date(schedule.billingDate).toLocaleDateString()}
                            </p>
                            <p className="mt-0.5 text-xs font-mono text-forest-ink font-bold">
                              {currency.format(schedule.amount)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={prorationDialogOpen} onOpenChange={setProrationDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <form onSubmit={handleApplySeats}>
              <DialogHeader>
                <DialogTitle className="text-base flex items-center gap-2 text-foreground">
                  <Sparkles className="h-4 w-4 text-forest-ink/60" />
                  Mid-Cycle Seat Proration Simulator
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Adjust active subscription seats. The billing engine will calculate the exact day-weighted proration and issue a supplemental invoice.
                </DialogDescription>
              </DialogHeader>

              {selectedSub && (
                <div className="space-y-4 py-4 text-xs">
                  <div className="p-3 bg-muted/40 rounded border border-border space-y-1">
                    <p className="font-semibold text-foreground">{selectedSub.planName}</p>
                    <p className="text-muted-foreground">
                      Current: <span className="font-mono text-foreground font-semibold">{selectedSub.seats} seats</span> ({currency.format(selectedSub.recurringMonthlyAmount)}/mo)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="seats-input">Target Seat Count:</Label>
                      <span className="font-mono text-sm font-bold text-forest-ink">{targetSeats} seats</span>
                    </div>
                    <Input
                      id="seats-input"
                      type="number"
                      min="1"
                      max="1000"
                      value={targetSeats}
                      onChange={(e) => setTargetSeats(parseInt(e.target.value, 10) || 1)}
                      className="font-mono text-sm h-9"
                      required
                    />
                  </div>

                  <div className="p-3.5 rounded bg-sticky-note-mint/30 border border-sticky-note-mint/60 space-y-2">
                    <span className="font-mono text-[10px] uppercase text-forest-ink tracking-wider font-bold">
                      Real-Time Proration Breakdown
                    </span>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Seat Delta (New − Current):</span>
                        <span className="font-mono font-medium">{prorationPreview.delta > 0 ? `+${prorationPreview.delta}` : prorationPreview.delta} seats</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Days Remaining in Cycle:</span>
                        <span className="font-mono font-medium">{prorationPreview.daysRemaining} days (18/30 ratio)</span>
                      </div>
                      <div className="flex justify-between font-semibold pt-1 border-t border-sky-500/20">
                        <span className="text-foreground">Supplemental Invoice Charge:</span>
                        <span className="font-mono text-emerald-400 font-bold">
                          {currency.format(prorationPreview.proratedAmount)}
                        </span>
                      </div>
                      <div className="flex justify-between text-muted-foreground pt-0.5">
                        <span>New Ongoing Monthly Recurring:</span>
                        <span className="font-mono font-medium text-foreground">
                          {currency.format(prorationPreview.newMonthlyTotal)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" size="sm" onClick={() => setProrationDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={modifySeatsMutation.isPending || !canAct}
                  className="gap-1.5"
                >
                  <TrendingUp className="h-3.5 w-3.5" />
                  {modifySeatsMutation.isPending ? "Updating..." : "Apply Seat Adjustment"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  );
}

function PageState({ label, action }: { label: string; action?: React.ReactNode }) {
  return (
    <main className="flex min-h-full items-center justify-center bg-background p-6">
      <div className="space-y-4 text-center">
        <RefreshCw className="mx-auto h-5 w-5 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">{label}</p>
        {action}
      </div>
    </main>
  );
}
