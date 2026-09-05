import React, { useState } from "react";
import { Sparkles, Send } from "lucide-react";
import { toast } from "sonner";
import type { SanitizedQuoteLine } from "@/hooks/use-portal";
import { useSubmitPortalCounter } from "@/hooks/use-portal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

type PortalCounterOfferProps = {
  token: string;
  lines: SanitizedQuoteLine[];
};

export function PortalCounterOffer({ token, lines }: PortalCounterOfferProps) {
  const submitCounterMutation = useSubmitPortalCounter(token);

  const [counterDiscounts, setCounterDiscounts] = useState<Record<string, number>>({});
  const [authorName, setAuthorName] = useState("");
  const [counterComment, setCounterComment] = useState("");

  const calculateCounterTotal = () => {
    return lines.reduce((sum, line) => {
      const discount = counterDiscounts[line.id] ?? line.discountPercent;
      const discountedPrice = line.unitPrice * (1 - discount / 100);
      return sum + discountedPrice * line.quantity;
    }, 0);
  };

  const counterTotalSubtotal = calculateCounterTotal();
  const savingsVsList =
    lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0) - counterTotalSubtotal;

  const handleCounterDiscountChange = (lineId: string, val: string) => {
    const num = Math.min(100, Math.max(0, parseFloat(val) || 0));
    setCounterDiscounts((prev) => ({ ...prev, [lineId]: num }));
  };

  const handleSubmitCounterOffer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim()) {
      toast.error("Please enter your full name as the authorization author.");
      return;
    }

    const proposedDiscounts = lines.map((line) => ({
      lineId: line.id,
      counterDiscountPercent: counterDiscounts[line.id] ?? line.discountPercent,
    }));

    submitCounterMutation.mutate(
      {
        authorName,
        proposedDiscounts,
        comment: counterComment,
      },
      {
        onSuccess: () => {
          toast.success("Counter offer submitted!", {
            description: "Your revised proposal has been sent to management for expedited review.",
          });
          setCounterComment("");
        },
      }
    );
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader className="p-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-500" />
          <CardTitle className="text-base font-semibold">Propose Counter Discount Offer</CardTitle>
        </div>
        <CardDescription className="text-xs">
          Request custom discount adjustments. Submitting a counter offer sends your proposal directly to executive management for expedited re-approval.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 space-y-6">
        <form onSubmit={handleSubmitCounterOffer} className="space-y-6">
          <div className="space-y-3">
            <Label className="text-xs font-semibold">Counter Discount Per Line Item</Label>
            <div className="border border-border rounded-md overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="text-xs font-bold">Item</TableHead>
                    <TableHead className="text-xs font-bold text-right">Current Discount</TableHead>
                    <TableHead className="text-xs font-bold text-right w-44">
                      Proposed Counter Discount (%)
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lines.map((line) => {
                    const currentVal = counterDiscounts[line.id] ?? line.discountPercent;
                    return (
                      <TableRow key={line.id}>
                        <TableCell className="text-xs font-medium">{line.productName}</TableCell>
                        <TableCell className="text-right font-mono text-xs text-muted-foreground">
                          {line.discountPercent}%
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              step="0.5"
                              value={currentVal === 0 ? "" : currentVal}
                              placeholder="0"
                              onFocus={(e) => e.target.select()}
                              onChange={(e) => handleCounterDiscountChange(line.id, e.target.value)}
                              className="h-8 w-24 text-right font-mono text-xs"
                            />

                            <span className="text-xs font-mono text-muted-foreground">%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="bg-muted/40 p-4 rounded-md border border-border flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs text-muted-foreground block">Recalculated Counter Subtotal</span>
              <span className="text-2xl font-black font-mono text-foreground">
                ${counterTotalSubtotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="text-right">
              <span className="text-xs text-muted-foreground block">Total Client Savings</span>
              <span className="text-lg font-bold font-mono text-emerald-500">
                ${savingsVsList.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="author" className="text-xs font-semibold">
                  Your Full Name / Authorization
                </Label>
                <Input
                  id="author"
                  placeholder="e.g. Alice Johnson, VP Procurement"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="c-notes" className="text-xs font-semibold">
                  Justification / Remarks (Optional)
                </Label>
                <Input
                  id="c-notes"
                  placeholder="e.g. Requesting additional 5% discount for 3-year commitment"
                  value={counterComment}
                  onChange={(e) => setCounterComment(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitCounterMutation.isPending}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-10 text-xs font-semibold gap-2"
            >
              <Send className="h-4 w-4" />
              <span>Submit Counter Offer for Management Review</span>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
