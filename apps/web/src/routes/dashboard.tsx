import { createFileRoute } from "@tanstack/react-router";
import { Activity, AlertTriangle, ArrowUpRight, Bell, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDealHealthOverview, useEscalateDealAlert, useNudgeDealRep } from "@/hooks/use-deal-health";

export const Route = createFileRoute("/dashboard")({
  component: DealHealthPage,
});

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function DealHealthPage() {
  const overviewQuery = useDealHealthOverview();
  const nudgeMutation = useNudgeDealRep();
  const escalateMutation = useEscalateDealAlert();

  if (overviewQuery.isLoading) {
    return <PageState label="Loading deal health" />;
  }

  if (overviewQuery.isError || !overviewQuery.data) {
    return (
      <PageState
        label="Deal health is unavailable"
        action={<Button onClick={() => overviewQuery.refetch()}>Try again</Button>}
      />
    );
  }

  const { kpis, alerts } = overviewQuery.data;

  const handleNudge = async (alertId: string) => {
    try {
      await nudgeMutation.mutateAsync(alertId);
      toast.success("Reminder sent to the deal owner");
    } catch {
      toast.error("The reminder could not be sent");
    }
  };

  const handleEscalate = async (alertId: string) => {
    try {
      await escalateMutation.mutateAsync(alertId);
      toast.success("Issue sent to management");
    } catch {
      toast.error("The issue could not be escalated");
    }
  };

  return (
    <main className="min-h-full overflow-y-auto bg-background">
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <PageHeading
          eyebrow="DEAL HEALTH"
          title="Attention needed"
          description="A live view of delayed deals, unusual discounts, and delivery risks."
        />

        <section className="grid gap-px border border-border bg-border sm:grid-cols-2 xl:grid-cols-4">
          <Metric title="Active pipeline" value={currency.format(kpis.activePipelineValue)} />
          <Metric title="Waiting for review" value={String(kpis.pendingApprovalCount)} />
          <Metric title="Delayed deals" value={String(kpis.stalledDealsCount)} />
          <Metric title="Revenue at risk" value={currency.format(kpis.marginAtRisk)} />
        </section>

        <Card className="rounded-lg border-border bg-card shadow-none">
          <CardHeader className="border-b border-border">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4 text-primary" />
              Attention needed
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {alerts.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="divide-y divide-border">
                {alerts.map((alert) => (
                  <div key={alert.id} className="grid gap-4 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
                    <div className="flex gap-3">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
                          <span>{alert.customerName}</span>
                          <span className="font-mono text-xs text-muted-foreground">{alert.quoteNumber}</span>
                          <span className="text-xs text-muted-foreground">{formatAlertType(alert.type)}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{alert.message}</p>
                        <p className="text-xs text-muted-foreground">Owner: {alert.repName}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 lg:justify-end">
                      <Button variant="outline" size="sm" onClick={() => handleNudge(alert.id)} disabled={nudgeMutation.isPending}>
                        <Bell className="h-3.5 w-3.5" />
                        Contact owner
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleEscalate(alert.id)} disabled={escalateMutation.isPending}>
                        <ArrowUpRight className="h-3.5 w-3.5" />
                        Escalate
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function PageHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <header className="space-y-2">
      <p className="font-mono text-xs tracking-[0.08em] text-muted-foreground">{eyebrow}</p>
      <h1 className="text-2xl font-semibold tracking-[-0.02em]">{title}</h1>
      <p className="text-sm text-muted-foreground">{description}</p>
    </header>
  );
}

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-card p-5">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="mt-2 text-2xl font-semibold tracking-[-0.02em]">{value}</p>
    </div>
  );
}

function PageState({ label, action }: { label: string; action?: ReactNode }) {
  return (
    <main className="flex min-h-full items-center justify-center bg-background p-6">
      <div className="space-y-4 text-center">
        <RefreshCw className="mx-auto h-5 w-5 text-primary" />
        <p className="text-sm text-muted-foreground">{label}</p>
        {action}
      </div>
    </main>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-2 p-12 text-center">
      <RefreshCw className="h-5 w-5 text-primary" />
      <p className="text-sm font-medium">Nothing needs attention</p>
      <p className="text-sm text-muted-foreground">The API has not reported any active deal issues.</p>
    </div>
  );
}

function formatAlertType(type: string) {
  return type.toLowerCase().replaceAll("_", " ");
}
