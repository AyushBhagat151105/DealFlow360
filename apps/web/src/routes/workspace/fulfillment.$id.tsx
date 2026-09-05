import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Package, RefreshCw, Truck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useConfirmFulfillment, useFulfillmentPlan } from "@/hooks/use-fulfillment";

export const Route = createFileRoute("/workspace/fulfillment/$id")({
  component: FulfillmentComponent,
});

function FulfillmentComponent() {
  const { id } = Route.useParams();
  const planQuery = useFulfillmentPlan(id);
  const confirmMutation = useConfirmFulfillment(id);

  if (planQuery.isLoading) return <PageState label="Loading warehouse allocation" />;
  if (planQuery.isError || !planQuery.data) {
    return <PageState label="Warehouse allocation is unavailable" action={<Button onClick={() => planQuery.refetch()}>Try again</Button>} />;
  }

  const plan = planQuery.data;
  const confirmPlan = async () => {
    try {
      await confirmMutation.mutateAsync([]);
      toast.success("Warehouse allocation confirmed");
    } catch {
      toast.error("The allocation could not be confirmed");
    }
  };

  return (
    <main className="min-h-full overflow-y-auto bg-background">
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <header className="space-y-2">
          <p className="font-mono text-xs tracking-[0.08em] text-muted-foreground">FULFILLMENT</p>
          <h1 className="text-2xl font-semibold tracking-[-0.02em]">Warehouse allocation</h1>
          <p className="text-sm text-muted-foreground">Quote {id} · Review inventory before dispatch.</p>
        </header>

        <section className="grid gap-px border border-border bg-border sm:grid-cols-3">
          <Metric icon={<Truck className="h-4 w-4 text-primary" />} label="Shipments" value={String(plan.totalRequiredShipments)} />
          <Metric icon={<Package className="h-4 w-4 text-primary" />} label="Estimated shipping" value={`$${plan.totalEstimatedShippingCost.toFixed(2)}`} />
          <Metric icon={<CheckCircle2 className="h-4 w-4 text-primary" />} label="Backorders" value={plan.hasBackorders ? "Needs attention" : "None"} />
        </section>

        <Card className="rounded-lg border-border bg-card shadow-none">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-base">Allocation details</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {plan.allocations.length === 0 ? (
              <p className="p-8 text-sm text-muted-foreground">No warehouse allocation is available for this quote.</p>
            ) : (
              <div className="divide-y divide-border">
                {plan.allocations.map((allocation, index) => (
                  <div key={`${allocation.productId}-${allocation.warehouseId}-${index}`} className="grid gap-3 p-5 md:grid-cols-[1fr_auto_auto] md:items-center">
                    <div>
                      <p className="text-sm font-medium">{allocation.productName}</p>
                      <p className="text-sm text-muted-foreground">{allocation.warehouseName}</p>
                    </div>
                    <p className="font-mono text-sm">{allocation.quantityAllocated} allocated</p>
                    <p className="text-sm text-muted-foreground">{allocation.quantityBackordered} backordered</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={confirmPlan} disabled={confirmMutation.isPending || plan.allocations.length === 0}>
            Confirm allocation
          </Button>
        </div>
      </div>
    </main>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="space-y-2 bg-card p-5">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">{icon}{label}</div>
      <p className="text-xl font-semibold">{value}</p>
    </div>
  );
}

function PageState({ label, action }: { label: string; action?: React.ReactNode }) {
  return <main className="flex min-h-full items-center justify-center bg-background p-6"><div className="space-y-4 text-center"><RefreshCw className="mx-auto h-5 w-5 text-primary" /><p className="text-sm text-muted-foreground">{label}</p>{action}</div></main>;
}
