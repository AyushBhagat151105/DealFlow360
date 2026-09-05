import { useState } from "react";
import { Boxes, Plus, Building2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useWarehouses,
  useProducts,
  useCreateWarehouse,
  useReplenishStock,
} from "@/hooks/use-catalog";

export function WarehousesTab() {
  const warehousesQuery = useWarehouses();
  const productsQuery = useProducts();
  const createWarehouseMutation = useCreateWarehouse();
  const replenishStockMutation = useReplenishStock();

  const [warehouseDialogOpen, setWarehouseDialogOpen] = useState(false);
  const [replenishDialogOpen, setReplenishDialogOpen] = useState(false);

  const [warehouseName, setWarehouseName] = useState("");
  const [warehouseCode, setWarehouseCode] = useState("");
  const [warehouseLocation, setWarehouseLocation] = useState("");
  const [warehouseWeight, setWarehouseWeight] = useState("1.0");

  const [replenishWarehouseId, setReplenishWarehouseId] = useState("");
  const [replenishProductId, setReplenishProductId] = useState("");
  const [replenishQuantity, setReplenishQuantity] = useState("10");

  const warehouses = warehousesQuery.data ?? [];
  const products = productsQuery.data ?? [];

  const handleCreateWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!warehouseName || !warehouseCode || !warehouseLocation) {
      toast.error("Name, Code, and Location are required");
      return;
    }

    try {
      await createWarehouseMutation.mutateAsync({
        name: warehouseName,
        code: warehouseCode,
        location: warehouseLocation,
        preferenceWeight: parseFloat(warehouseWeight) || 1.0,
      });
      toast.success(`Warehouse facility "${warehouseName}" created`);
      setWarehouseDialogOpen(false);
      setWarehouseName("");
      setWarehouseCode("");
      setWarehouseLocation("");
    } catch {
      toast.error("Failed to create warehouse");
    }
  };

  const handleReplenishStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replenishWarehouseId || !replenishProductId) {
      toast.error("Select warehouse and product");
      return;
    }
    const qty = parseInt(replenishQuantity, 10);
    if (isNaN(qty) || qty <= 0) {
      toast.error("Quantity must be greater than zero");
      return;
    }

    try {
      await replenishStockMutation.mutateAsync({
        warehouseId: replenishWarehouseId,
        productId: replenishProductId,
        quantityAdded: qty,
      });
      toast.success(`Replenished ${qty} units in warehouse`);
      setReplenishDialogOpen(false);
    } catch {
      toast.error("Failed to replenish stock");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold">Fulfillment Warehouses</h3>
          <p className="text-xs text-muted-foreground">
            Stock repositories used for multi-warehouse allocation splits.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setReplenishDialogOpen(true)}
            className="gap-2"
          >
            <Boxes className="h-4 w-4 text-primary" />
            Replenish Stock
          </Button>
          <Button onClick={() => setWarehouseDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Warehouse
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {warehouses.map((w) => (
          <Card
            key={w.id}
            className="rounded-lg border-border bg-card shadow-none p-5 space-y-3"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
                  CODE: {w.code}
                </span>
                <h4 className="text-base font-semibold">{w.name}</h4>
              </div>
              <Badge variant="outline" className="font-mono text-[10px]">
                Weight: {w.shippingCostWeight ?? 1.0}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5 text-primary" />
                {w.location || "Central Depot"}
              </p>
              <p className="font-mono text-[11px]">
                Tracked SKUs: {w.stocks?.length ?? 0}
              </p>
            </div>
          </Card>
        ))}
      </div>

      <Card className="rounded-lg border-border bg-card shadow-none overflow-hidden">
        <CardHeader className="border-b border-border bg-muted/20">
          <CardTitle className="text-xs font-mono tracking-wider uppercase text-muted-foreground flex items-center justify-between">
            <span>Inventory Stock Table</span>
            <span>
              {warehouses.reduce((acc, w) => acc + (w.stocks?.length ?? 0), 0)} Total Allocations
            </span>
          </CardTitle>
        </CardHeader>
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="text-xs font-mono">Warehouse Code</TableHead>
              <TableHead className="text-xs">Product</TableHead>
              <TableHead className="text-xs text-right">Quantity On Hand</TableHead>
              <TableHead className="text-xs text-right">Reserved Units</TableHead>
              <TableHead className="text-xs text-right">Net Available</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {warehouses.flatMap((w) => w.stocks ?? []).length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-8 text-sm text-muted-foreground"
                >
                  No inventory stock entries found. Click "Replenish Stock" to add inventory.
                </TableCell>
              </TableRow>
            ) : (
              warehouses.flatMap((w) =>
                (w.stocks ?? []).map((s, idx) => {
                  const product = products.find((p) => p.id === s.productId);
                  const available = Math.max(0, s.quantityOnHand - (s.reserved ?? 0));
                  return (
                    <TableRow key={`${w.id}-${s.productId}-${idx}`}>
                      <TableCell className="font-mono text-xs font-semibold">
                        {w.code}
                      </TableCell>
                      <TableCell className="text-xs">
                        <span className="font-medium">{product?.name ?? s.productId}</span>
                        {product && (
                          <span className="font-mono text-[11px] text-muted-foreground ml-2">
                            ({product.sku})
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        {s.quantityOnHand}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-muted-foreground">
                        {s.reserved ?? 0}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs font-semibold">
                        <span className={available > 0 ? "text-emerald-500" : "text-red-500"}>
                          {available}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })
              )
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={warehouseDialogOpen} onOpenChange={setWarehouseDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleCreateWarehouse}>
            <DialogHeader>
              <DialogTitle className="text-base">Add Warehouse Facility</DialogTitle>
              <DialogDescription className="text-xs">
                Register a fulfillment warehouse depot for inventory auto-splits.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 py-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="w-code">Facility Code *</Label>
                  <Input
                    id="w-code"
                    placeholder="CHI-MAIN"
                    value={warehouseCode}
                    onChange={(e) => setWarehouseCode(e.target.value.toUpperCase())}
                    className="font-mono text-xs h-8"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="w-weight">Preference Weight</Label>
                  <Input
                    id="w-weight"
                    type="number"
                    step="0.1"
                    placeholder="1.0"
                    value={warehouseWeight}
                    onChange={(e) => setWarehouseWeight(e.target.value)}
                    className="font-mono text-xs h-8"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="w-name">Facility Name *</Label>
                <Input
                  id="w-name"
                  placeholder="Chicago Primary Logistics Center"
                  value={warehouseName}
                  onChange={(e) => setWarehouseName(e.target.value)}
                  className="text-xs h-8"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="w-loc">Location / Address *</Label>
                <Input
                  id="w-loc"
                  placeholder="Chicago, IL Depot"
                  value={warehouseLocation}
                  onChange={(e) => setWarehouseLocation(e.target.value)}
                  className="text-xs h-8"
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setWarehouseDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={createWarehouseMutation.isPending}>
                {createWarehouseMutation.isPending ? "Creating..." : "Save Warehouse"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={replenishDialogOpen} onOpenChange={setReplenishDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleReplenishStock}>
            <DialogHeader>
              <DialogTitle className="text-base">Replenish Warehouse Inventory</DialogTitle>
              <DialogDescription className="text-xs">
                Add stock units directly to a warehouse repository.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 py-4 text-xs">
              <div className="space-y-1">
                <Label htmlFor="r-warehouse">Select Warehouse *</Label>
                <select
                  id="r-warehouse"
                  value={replenishWarehouseId}
                  onChange={(e) => setReplenishWarehouseId(e.target.value)}
                  className="w-full h-8 px-2 text-xs bg-card border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                >
                  <option value="">-- Choose Warehouse --</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="r-product">Select Product *</Label>
                <select
                  id="r-product"
                  value={replenishProductId}
                  onChange={(e) => setReplenishProductId(e.target.value)}
                  className="w-full h-8 px-2 text-xs bg-card border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                >
                  <option value="">-- Choose Hardware Product --</option>
                  {products
                    .filter((p) => p.category === "HARDWARE")
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku})
                      </option>
                    ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="r-qty">Quantity to Add (+Units) *</Label>
                <Input
                  id="r-qty"
                  type="number"
                  placeholder="10"
                  value={replenishQuantity}
                  onChange={(e) => setReplenishQuantity(e.target.value)}
                  className="font-mono text-xs h-8"
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setReplenishDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={replenishStockMutation.isPending}>
                {replenishStockMutation.isPending ? "Replenishing..." : "Add Stock Units"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

