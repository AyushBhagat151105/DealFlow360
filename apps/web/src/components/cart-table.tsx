import { ShoppingCart, Plus, Minus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UpsellDrawer } from "@/components/upsell-drawer";
import type { Customer, ProductCategory, UpsellSuggestion } from "@/lib/api-types";

export type CartLine = {
  productId: string;
  productName: string;
  sku: string;
  category: ProductCategory;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  minMarginThreshold: number;
  discountPercent: number;
};

export function calcLineSubtotal(line: CartLine): number {
  return line.unitPrice * line.quantity * (1 - line.discountPercent / 100);
}

export function calcLineMarginPercent(line: CartLine): number {
  const subtotal = calcLineSubtotal(line);
  const cost = line.costPrice * line.quantity;
  if (subtotal <= 0) return 0;
  return ((subtotal - cost) / subtotal) * 100;
}

type CartTableProps = {
  cart: CartLine[];
  selectedCustomer: Customer | null;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onUpdateDiscount: (productId: string, value: string) => void;
  onRemoveLine: (productId: string) => void;
  onAddUpsell: (upsell: UpsellSuggestion) => void;
  cartProductIds: string[];
};

export function CartTable({
  cart,
  selectedCustomer,
  onUpdateQuantity,
  onUpdateDiscount,
  onRemoveLine,
  onAddUpsell,
  cartProductIds,
}: CartTableProps) {
  return (
    <Card className="border-pencil-gray/40 bg-card shadow-none">
      <CardHeader className="p-4 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
            <ShoppingCart className="h-4 w-4 text-forest-ink/60" />
            Line Items
            {cart.length > 0 && (
              <Badge variant="secondary" className="text-[10px] font-mono ml-1">
                {cart.length} items
              </Badge>
            )}
          </CardTitle>
          <UpsellDrawer
            onAddUpsell={onAddUpsell}
            addedProductIds={cartProductIds}
          />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {cart.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            No products added yet. Select from the catalog above.
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="text-xs font-bold pl-4">Product</TableHead>
                <TableHead className="text-xs font-bold text-center">Qty</TableHead>
                <TableHead className="text-xs font-bold text-right">Unit Price</TableHead>
                <TableHead className="text-xs font-bold text-right w-28">Discount %</TableHead>
                <TableHead className="text-xs font-bold text-right">Net Total</TableHead>
                <TableHead className="text-xs font-bold text-right">Line Margin</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {cart.map((line) => {
                const lineMargin = calcLineMarginPercent(line);
                const lineTotal = calcLineSubtotal(line);
                const isBelowThreshold = lineMargin < line.minMarginThreshold;
                const isDiscountAboveCeiling =
                  selectedCustomer &&
                  selectedCustomer.allowedDiscountCeiling !== undefined &&
                  line.discountPercent > selectedCustomer.allowedDiscountCeiling;

                return (
                  <TableRow
                    key={line.productId}
                    className={isBelowThreshold ? "bg-destructive/5" : ""}
                  >
                    <TableCell className="pl-4">
                      <div>
                        <p className="text-xs font-semibold text-foreground">{line.productName}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{line.sku}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="outline"
                          size="icon-xs"
                          onClick={() => onUpdateQuantity(line.productId, -1)}
                          disabled={line.quantity <= 1}
                          className="h-6 w-6"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="font-mono text-xs w-6 text-center">{line.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon-xs"
                          onClick={() => onUpdateQuantity(line.productId, 1)}
                          className="h-6 w-6"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-muted-foreground">
                      ${line.unitPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.5"
                          value={line.discountPercent}
                          onChange={(e) => onUpdateDiscount(line.productId, e.target.value)}
                          className={`h-7 w-20 text-right font-mono text-xs ${
                            isDiscountAboveCeiling ? "border-terracotta/60 text-terracotta" : ""
                          }`}
                        />
                        <span className="text-xs text-muted-foreground">%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-xs">
                      ${lineTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={`text-xs font-mono font-bold ${
                          isBelowThreshold
                            ? "text-terracotta"
                            : lineMargin < 30
                            ? "text-forest-ink/60"
                            : "text-forest-ink"
                        }`}
                      >
                        {lineMargin.toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => onRemoveLine(line.productId)}
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
