import React from "react";
import { MessageSquare } from "lucide-react";
import type { SanitizedQuoteLine } from "@/hooks/use-portal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type PortalLineItemsProps = {
  lines: SanitizedQuoteLine[];
  onOpenCommentModal: (line?: SanitizedQuoteLine) => void;
};

export function PortalLineItems({ lines, onOpenCommentModal }: PortalLineItemsProps) {
  return (
    <Card className="border-border bg-card">
      <CardHeader className="p-4 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-semibold">Scope of Supply & Pricing Breakdown</CardTitle>
          <CardDescription className="text-xs">
            Sanitized schedule of hardware, subscriptions, and services.
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onOpenCommentModal()}
          className="h-8 text-xs gap-1.5"
        >
          <MessageSquare className="h-3.5 w-3.5 text-primary" />
          <span>General Question</span>
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="text-xs font-bold">Category</TableHead>
              <TableHead className="text-xs font-bold">Item Description</TableHead>
              <TableHead className="text-xs font-bold text-center">Qty</TableHead>
              <TableHead className="text-xs font-bold text-right">Unit List Price</TableHead>
              <TableHead className="text-xs font-bold text-right">Applied Discount</TableHead>
              <TableHead className="text-xs font-bold text-right">Net Subtotal</TableHead>
              <TableHead className="text-xs font-bold text-center">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lines.map((line) => (
              <TableRow key={line.id} className="hover:bg-muted/30">
                <TableCell>
                  <Badge variant="outline" className="text-[10px] font-mono uppercase">
                    {line.category}
                  </Badge>
                </TableCell>
                <TableCell className="font-semibold text-xs text-foreground">
                  {line.productName}
                </TableCell>
                <TableCell className="text-center font-mono text-xs">{line.quantity}</TableCell>
                <TableCell className="text-right font-mono text-xs text-muted-foreground">
                  ${line.unitPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell className="text-right font-mono text-xs">
                  {line.discountPercent > 0 ? (
                    <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[11px] font-mono">
                      -{line.discountPercent}% OFF
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">0%</span>
                  )}
                </TableCell>
                <TableCell className="text-right font-mono font-bold text-xs text-foreground">
                  ${line.lineSubtotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </TableCell>
                <TableCell className="text-center">
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => onOpenCommentModal(line)}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                    title="Ask question about this line item"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
