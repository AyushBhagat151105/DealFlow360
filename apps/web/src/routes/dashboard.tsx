import { createFileRoute } from "@tanstack/react-router";
import { Activity, AlertTriangle, ArrowUpRight, BarChart3, Bell, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SalesReportsView } from "@/components/sales-reports-view";
import { useDealHealthOverview, useEscalateDealAlert, useNudgeDealRep } from "@/hooks/use-deal-health";

export const Route = createFileRoute("/dashboard")({
  component: DealHealthPage,
});

import { currencyFormatterNoDecimals as currency } from "@/lib/currency";

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
    <main className="min-h-full overflow-y-auto bg-background pb-12">
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <PageHeading
          title="Deal Health & Executive Reports"
          description="Real-time deal health alerts, discount governance, category revenue, and sales representative velocity."
        />

        <Tabs defaultValue="attention" className="space-y-6">
          <TabsList className="inline-flex h-auto rounded-lg border border-pencil-gray/40 bg-transparent p-1">
            <TabsTrigger
              value="attention"
              className="gap-2 rounded-md border border-transparent bg-transparent px-3 py-2 text-xs text-forest-ink/70 hover:bg-sticky-note-mint/40 aria-selected:border-sticky-note-mint aria-selected:bg-sticky-note-mint aria-selected:text-forest-ink aria-selected:ring-1 aria-selected:ring-sticky-note-mint/70"
            >
              <Activity className="h-3.5 w-3.5" />
              Attention Needed
              {alerts.length > 0 && (
                <span className="ml-1 rounded-full bg-highlighter-yellow px-1.5 py-0.5 text-[10px] font-semibold text-forest-ink">
                  {alerts.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="reports"
              className="gap-2 rounded-md border border-transparent bg-transparent px-3 py-2 text-xs text-forest-ink/70 hover:bg-sticky-note-mint/40 aria-selected:border-sticky-note-mint aria-selected:bg-sticky-note-mint aria-selected:text-forest-ink aria-selected:ring-1 aria-selected:ring-sticky-note-mint/70"
            >
              <BarChart3 className="h-3.5 w-3.5" />
              Sales & Financial Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="attention" className="space-y-6 m-0">
            {/* KPI metric grid */}
            <div className="grid gap-px border border-pencil-gray/40 bg-pencil-gray/20 rounded-xl overflow-hidden sm:grid-cols-2 xl:grid-cols-4">
              <Metric title="Active pipeline" value={currency.format(kpis.activePipelineValue)} />
              <Metric title="Waiting for review" value={String(kpis.pendingApprovalCount)} accent="yellow" />
              <Metric title="Delayed deals" value={String(kpis.stalledDealsCount)} accent="terracotta" />
              <Metric title="Revenue at risk" value={currency.format(kpis.marginAtRisk)} accent="terracotta" />
            </div>

            <Card className="border-pencil-gray/40 bg-card shadow-none rounded-xl">
              <CardHeader className="border-b border-pencil-gray/40 py-4">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Activity className="h-4 w-4 text-forest-ink/60" />
                  Attention needed
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {alerts.length === 0 ? (
                  <EmptyState />
                ) : (
                  <div className="divide-y divide-pencil-gray/30">
                    {alerts.map((alert) => (
                      <div key={alert.id} className="grid gap-4 p-5 lg:grid-cols-[1fr_auto] lg:items-center hover:bg-whisper-gray/50 transition-colors">
                        <div className="flex gap-3">
                          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-highlighter-yellow">
                            <AlertTriangle className="h-3.5 w-3.5 text-forest-ink" />
                          </div>
                          <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-foreground">
                              <span>{alert.customerName}</span>
                              <span className="font-mono text-xs text-muted-foreground">{alert.quoteNumber}</span>
                              <span className="text-xs text-muted-foreground">{formatAlertType(alert.type)}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{alert.message}</p>
                            <p className="text-xs text-muted-foreground">Owner: {alert.repName}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 lg:justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs border-pencil-gray text-forest-ink hover:bg-whisper-gray"
                            onClick={() => handleNudge(alert.id)}
                            disabled={nudgeMutation.isPending}
                          >
                            <Bell className="h-3.5 w-3.5" />
                            Contact owner
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs border-pencil-gray text-forest-ink hover:bg-whisper-gray"
                            onClick={() => handleEscalate(alert.id)}
                            disabled={escalateMutation.isPending}
                          >
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
          </TabsContent>

          <TabsContent value="reports" className="space-y-6 m-0">
            <SalesReportsView />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

function PageHeading({ title, description }: { title: string; description: string }) {
  return (
    <header className="space-y-1">
      <h1 className="text-xl font-semibold text-foreground">{title}</h1>
      <p className="text-sm text-muted-foreground">{description}</p>
    </header>
  );
}

function Metric({ title, value, accent }: { title: string; value: string; accent?: "yellow" | "terracotta" }) {
  const valueColor =
    accent === "yellow"
      ? "text-forest-ink"
      : accent === "terracotta"
        ? "text-terracotta"
        : "text-foreground";

  return (
    <div className="bg-card p-5">
      <p className="text-xs text-muted-foreground">{title}</p>
      <p className={`mt-2 text-2xl font-bold ${valueColor}`}>{value}</p>
    </div>
  );
}

function PageState({ label, action }: { label: string; action?: ReactNode }) {
  return (
    <main className="flex min-h-full items-center justify-center bg-background p-6">
      <div className="space-y-4 text-center">
        <RefreshCw className="mx-auto h-5 w-5 text-forest-ink/40" />
        <p className="text-sm text-muted-foreground">{label}</p>
        {action}
      </div>
    </main>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-2 p-12 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sticky-note-mint">
        <Activity className="h-5 w-5 text-forest-ink" />
      </div>
      <p className="text-sm font-medium text-foreground">Everything looks healthy</p>
      <p className="text-sm text-muted-foreground">No active deal issues reported.</p>
    </div>
  );
}

function formatAlertType(type: string) {
  return type.toLowerCase().replaceAll("_", " ");
}
