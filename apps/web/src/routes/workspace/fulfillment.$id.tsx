import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Package, RefreshCw, Truck, AlertTriangle, RotateCcw, Sliders } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useConfirmFulfillment, useFulfillmentPlan } from "@/hooks/use-fulfillment";
import { useAuthStore } from "@/stores/auth-store";

export const Route = createFileRoute("/workspace/fulfillment/$id")({
  component: FulfillmentComponent,
});

type AllocationDraft = {
  quotationLineId: string;
  productId: string;
  productName: string;
  warehouseId: string | null;
  warehouseName: string | null;
  quantityRequested: number;
  quantityAllocated: number;
  quantityBackordered: number;
};

function FulfillmentComponent() {
  const { id } = Route.useParams();
  const { user } = useAuthStore();
  const planQuery = useFulfillmentPlan(id);
  const confirmMutation = useConfirmFulfillment(id);

  const [allocations, setAllocations] = useState<AllocationDraft[]>([]);
  const [hasManualEdits, setHasManualEdits] = useState(false);

  const canConfirm = user.role === "manager" || user.role === "admin";

  useEffect(() => {
    if (planQuery.data?.allocations) {
      setAllocations(
        planQuery.data.allocations.map((a) => ({
          quotationLineId: a.quotationLineId || "",
          productId: a.productId,
          productName: a.productName,
          warehouseId: a.warehouseId,
          warehouseName: a.warehouseName,
          quantityRequested: a.quantityRequested ?? (a.quantityAllocated + a.quantityBackordered),
          quantityAllocated: a.quantityAllocated,
          quantityBackordered: a.quantityBackordered,
        }))
      );
      setHasManualEdits(false);
    }
  }, [planQuery.data]);

  if (planQuery.isLoading) return <PageState label="Loading warehouse allocation plan..." />;
  if (planQuery.isError || !planQuery.data) {
    return (
      <PageState
        label="Warehouse allocation is unavailable for this quotation"
        action={<Button onClick={() => planQuery.refetch()}>Try again</Button>}
      />
    );
  }

  const plan = planQuery.data;

  const handleQuantityChange = (index: number, newAllocated: number) => {
    const updated = [...allocations];
    const item = updated[index];
    if (!item) return;

    const safeAllocated = Math.max(0, Math.min(newAllocated, item.quantityRequested));
    const backordered = Math.max(0, item.quantityRequested - safeAllocated);

    updated[index] = {
      ...item,
      quantityAllocated: safeAllocated,
      quantityBackordered: backordered,
    };

    setAllocations(updated);
    setHasManualEdits(true);
  };

  const handleResetToAuto = () => {
    if (plan.allocations) {
      setAllocations(
        plan.allocations.map((a) => ({
          quotationLineId: a.quotationLineId || "",
          productId: a.productId,
          productName: a.productName,
          warehouseId: a.warehouseId,
          warehouseName: a.warehouseName,
          quantityRequested: a.quantityRequested ?? (a.quantityAllocated + a.quantityBackordered),
          quantityAllocated: a.quantityAllocated,
          quantityBackordered: a.quantityBackordered,
        }))
      );
      setHasManualEdits(false);
      toast.info("Reset to auto-calculated greedy split heuristic");
    }
  };

  const confirmPlan = async () => {
    if (!canConfirm) {
      toast.error("You must have Manager or Admin role to confirm allocations");
      return;
    }

    try {
      const payload = hasManualEdits
        ? allocations.map((a) => ({
          quotationLineId: a.quotationLineId,
          warehouseId: a.warehouseId,
          quantityAllocated: a.quantityAllocated,
          quantityBackordered: a.quantityBackordered,
        }))
        : [];

      await confirmMutation.mutateAsync(payload);
      toast.success("Warehouse allocation successfully confirmed");
    } catch {
      toast.error("The allocation could not be confirmed. Check quotation status.");
    }
  };

  const totalRequested = allocations.reduce((sum, a) => sum + a.quantityRequested, 0);
  const totalAllocated = allocations.reduce((sum, a) => sum + a.quantityAllocated, 0);
  const totalBackorders = allocations.reduce((sum, a) => sum + a.quantityBackordered, 0);
  const hasBackorders = totalBackorders > 0;

  return (
    <main className="min-h-full overflow-y-auto bg-background">
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs tracking-[0.08em] text-muted-foreground uppercase">
                LOGISTICS & FULFILLMENT
              </span>
              <Badge variant="outline" className="text-[10px] font-mono border-primary/40 text-primary">
                GREEDY HEURISTIC ENGINE
              </Badge>
              {hasManualEdits && (
                <Badge className="bg-amber-500/15 text-amber-500 border-amber-500/30 text-[10px]">
                  Manual Override Active
                </Badge>
              )}
            </div>
            <h1 className="text-2xl font-semibold tracking-[-0.02em]">Warehouse Allocation Split</h1>
            <p className="text-sm text-muted-foreground">
              Quote <span className="font-mono font-medium text-foreground">{id}</span> · Multi-warehouse stock deduction and backorder governance.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {hasManualEdits && (
              <Button variant="outline" size="sm" onClick={handleResetToAuto} className="gap-1.5 text-xs">
                <RotateCcw className="h-3.5 w-3.5" />
                Reset Split
              </Button>
            )}
          </div>
        </header>

        <section className="grid gap-px border border-border bg-border sm:grid-cols-4">
          <Metric
            icon={<Truck className="h-4 w-4 text-primary" />}
            label="Shipments"
            value={String(plan.totalRequiredShipments || 1)}
          />
          <Metric
            icon={<Package className="h-4 w-4 text-primary" />}
            label="Est. Freight Cost"
            value={`$${plan.totalEstimatedShippingCost.toFixed(2)}`}
          />
          <Metric
            icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
            label="Allocated Units"
            value={`${totalAllocated} / ${totalRequested}`}
          />
          <Metric
            icon={<AlertTriangle className={`h-4 w-4 ${hasBackorders ? "text-amber-500" : "text-muted-foreground"}`} />}
            label="Backorders"
            value={hasBackorders ? `${totalBackorders} units` : "None"}
          />
        </section>

        {hasBackorders && (
          <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-500">Backorder Detected ({totalBackorders} Units)</p>
                <p className="text-xs text-muted-foreground">
                  Available depot stock is insufficient for full immediate fulfillment. Remaining units are queued for automatic backorder consolidation when stock is replenished.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-amber-500/30 text-amber-400 hover:bg-amber-950/40 shrink-0 text-xs"
              onClick={() => window.open("/admin", "_blank")}
            >
              Replenish Inventory
            </Button>
          </div>
        )}

        <Card className="rounded-lg border-border bg-card shadow-none">
          <CardHeader className="border-b border-border flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Fulfillment Allocation Matrix</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Use the inputs below to manually adjust unit allocations between warehouses.
              </p>
            </div>
            <Badge variant="outline" className="font-mono text-xs gap-1.5">
              <Sliders className="h-3 w-3 text-sky-400" />
              Manual Override Enabled
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            {allocations.length === 0 ? (
              <p className="p-8 text-sm text-muted-foreground text-center">
                No hardware items require warehouse allocation for this quote.
              </p>
            ) : (
              <div className="divide-y divide-border">
                {allocations.map((allocation, index) => (
                  <div
                    key={`${allocation.productId}-${allocation.warehouseId}-${index}`}
                    className="grid gap-4 p-5 md:grid-cols-[2fr_1.5fr_1.5fr_1fr] md:items-center"
                  >
                    <div>
                      <p className="text-sm font-semibold">{allocation.productName}</p>
                      <p className="text-xs text-muted-foreground">
                        Depot: <span className="text-foreground font-medium">{allocation.warehouseName || "Unassigned"}</span>
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] text-muted-foreground">Quantity Requested:</span>
                      <p className="font-mono text-sm font-medium">{allocation.quantityRequested} units</p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] text-muted-foreground flex items-center justify-between">
                        <span>Dispatch Quantity:</span>
                        <span className="font-mono text-primary">{allocation.quantityAllocated} units</span>
                      </label>
                      <Input
                        type="number"
                        min="0"
                        max={allocation.quantityRequested}
                        value={allocation.quantityAllocated}
                        onChange={(e) => handleQuantityChange(index, parseInt(e.target.value, 10) || 0)}
                        className="h-8 font-mono text-xs"
                      />
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] text-muted-foreground block">Status:</span>
                      {allocation.quantityBackordered > 0 ? (
                        <Badge className="bg-amber-500/15 text-amber-500 border-amber-500/30 text-[10px]">
                          {allocation.quantityBackordered} Backordered
                        </Badge>
                      ) : (
                        <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30 text-[10px]">
                          Fully Allocated
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-between pt-2">
          {!canConfirm ? (
            <span className="text-xs text-muted-foreground">
              Note: Switch to <span className="font-semibold text-amber-400">Sales Manager</span> or <span className="font-semibold text-purple-400">Admin</span> role to confirm allocations.
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">
              Confirming will deduct inventory and create shipping splits.
            </span>
          )}

          <Button
            onClick={confirmPlan}
            disabled={!canConfirm || confirmMutation.isPending || allocations.length === 0}
            className="gap-2"
          >
            {confirmMutation.isPending ? "Confirming..." : "Confirm Warehouse Allocation"}
          </Button>
        </div>
      </div>
    </main>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="space-y-2 bg-card p-5">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="text-xl font-semibold">{value}</p>
    </div>
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
