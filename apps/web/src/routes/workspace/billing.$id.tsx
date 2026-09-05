import { createFileRoute } from "@tanstack/react-router";
import { CalendarClock, CreditCard, FileText, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGenerateBilling, useQuoteBilling, useRecordPayment } from "@/hooks/use-billing";

export const Route = createFileRoute("/workspace/billing/$id")({
  component: BillingComponent,
});

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

function BillingComponent() {
  const { id } = Route.useParams();
  const billingQuery = useQuoteBilling(id);
  const generateMutation = useGenerateBilling(id);
  const paymentMutation = useRecordPayment(id);

  if (billingQuery.isLoading) return <PageState label="Loading billing records" />;
  if (billingQuery.isError || !billingQuery.data) {
    return <PageState label="Billing records are unavailable" action={<Button onClick={() => billingQuery.refetch()}>Try again</Button>} />;
  }

  const billing = billingQuery.data;
  const generateBilling = async () => {
    try {
      await generateMutation.mutateAsync();
      toast.success("Billing records generated");
    } catch {
      toast.error("Billing records could not be generated");
    }
  };

  const recordPayment = async (invoiceId: string, amount: number) => {
    try {
      await paymentMutation.mutateAsync({ invoiceId, amount, paymentMethod: "CREDIT_CARD" });
      toast.success("Payment recorded");
    } catch {
      toast.error("The payment could not be recorded");
    }
  };

  return (
    <main className="min-h-full overflow-y-auto bg-background">
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <p className="font-mono text-xs tracking-[0.08em] text-muted-foreground">BILLING</p>
            <h1 className="text-2xl font-semibold tracking-[-0.02em]">Billing records</h1>
            <p className="text-sm text-muted-foreground">Quote {id} · Invoices and subscriptions from the billing service.</p>
          </div>
          <Button variant="outline" onClick={generateBilling} disabled={generateMutation.isPending}>Generate billing</Button>
        </header>

        <Card className="rounded-lg border-border bg-card shadow-none">
          <CardHeader className="border-b border-border"><CardTitle className="flex items-center gap-2 text-base"><FileText className="h-4 w-4 text-primary" />Invoices</CardTitle></CardHeader>
          <CardContent className="p-0">
            {billing.invoices.length === 0 ? <p className="p-8 text-sm text-muted-foreground">No invoices have been generated.</p> : <div className="divide-y divide-border">{billing.invoices.map((invoice) => <div key={invoice.id} className="grid gap-4 p-5 md:grid-cols-[1fr_auto_auto] md:items-center"><div><p className="text-sm font-medium">{invoice.invoiceNumber}</p><p className="text-sm text-muted-foreground">{invoice.type.toLowerCase().replaceAll("_", " ")}</p></div><div className="text-right"><p className="font-mono text-sm">{currency.format(invoice.amount)}</p><p className="text-xs text-muted-foreground">{invoice.status}</p></div>{invoice.status === "ISSUED" && <Button size="sm" onClick={() => recordPayment(invoice.id, invoice.amount)} disabled={paymentMutation.isPending}><CreditCard className="h-3.5 w-3.5" />Record payment</Button>}</div>)}</div>}
          </CardContent>
        </Card>

        <Card className="rounded-lg border-border bg-card shadow-none">
          <CardHeader className="border-b border-border"><CardTitle className="flex items-center gap-2 text-base"><CalendarClock className="h-4 w-4 text-primary" />Subscriptions</CardTitle></CardHeader>
          <CardContent className="p-0">
            {billing.subscriptions.length === 0 ? <p className="p-8 text-sm text-muted-foreground">No subscription contracts have been created.</p> : <div className="divide-y divide-border">{billing.subscriptions.map((subscription) => <div key={subscription.id} className="space-y-4 p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm font-medium">{subscription.planName}</p><p className="text-sm text-muted-foreground">{subscription.seats} seats · {currency.format(subscription.recurringMonthlyAmount)} monthly</p></div><span className="text-xs text-muted-foreground">{subscription.status}</span></div><div className="grid gap-3 sm:grid-cols-2">{subscription.schedules.map((schedule) => <div key={schedule.billingDate} className="border border-border bg-muted p-3"><p className="text-xs text-muted-foreground">Next payment</p><p className="mt-1 font-mono text-sm">{new Date(schedule.billingDate).toLocaleDateString()}</p><p className="mt-1 text-sm">{currency.format(schedule.amount)}</p></div>)}</div></div>)}</div>}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function PageState({ label, action }: { label: string; action?: React.ReactNode }) { return <main className="flex min-h-full items-center justify-center bg-background p-6"><div className="space-y-4 text-center"><RefreshCw className="mx-auto h-5 w-5 text-primary" /><p className="text-sm text-muted-foreground">{label}</p>{action}</div></main>; }
