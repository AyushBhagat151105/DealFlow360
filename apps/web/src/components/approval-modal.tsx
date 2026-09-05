import { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  AlertTriangle,
  FileText,
  Loader2,
  History,
} from "lucide-react";
import { toast } from "sonner";
import { useApproveQuote, useRejectQuote, useReturnQuoteForRevision } from "@/hooks/use-quotes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Quote } from "@/lib/api-types";
import { useAuthStore } from "@/stores/auth-store";

const RISK_BADGE: Record<string, string> = {
  NONE: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  SALES_MANAGER: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  FINANCE: "bg-destructive/15 text-destructive border-destructive/30",
};

type ApprovalModalProps = {
  quote: Quote;
  onClose: () => void;
  onApprove: (id: string, notes: string) => void;
  onReject: (id: string, reason: string) => void;
  onReturn: (id: string, reason: string) => void;
};

export function ApprovalModal({
  quote,
  onClose,
  onApprove,
  onReject,
  onReturn,
}: ApprovalModalProps) {
  const [actionNotes, setActionNotes] = useState("");
  const { user } = useAuthStore();
  const approveMutation = useApproveQuote();
  const rejectMutation = useRejectQuote();
  const returnMutation = useReturnQuoteForRevision();

  const handleApprove = () => {
    approveMutation.mutate(
      {
        quoteId: quote.id,
        notes: actionNotes,
        actorName: user.name,
        actorRole: user.role === "finance" || user.role === "admin" ? user.role : "manager",
      },
      {
        onSuccess: () => {
          toast.success(`Quotation ${quote.quoteNumber} approved!`);
          onApprove(quote.id, actionNotes);
          onClose();
        },
      }
    );
  };

  const handleReject = () => {
    if (!actionNotes.trim()) {
      toast.error("Please provide a rejection reason.");
      return;
    }
    rejectMutation.mutate(
      { quoteId: quote.id, reason: actionNotes },
      {
        onSuccess: () => {
          toast.error(`Quotation ${quote.quoteNumber} rejected.`);
          onReject(quote.id, actionNotes);
          onClose();
        },
      }
    );
  };

  const handleReturn = () => {
    if (!actionNotes.trim()) {
      toast.error("Please provide return notes for the Sales Rep.");
      return;
    }
    returnMutation.mutate(
      { quoteId: quote.id, reason: actionNotes },
      {
        onSuccess: () => {
          toast.info(`Quotation ${quote.quoteNumber} returned for revision.`);
          onReturn(quote.id, actionNotes);
          onClose();
        },
      }
    );
  };

  const isAnyPending =
    approveMutation.isPending || rejectMutation.isPending || returnMutation.isPending;

  const lineViolations = quote.lines.filter((l) => {
    const lineSubtotal = l.lineSubtotal;
    const lineCost = l.costPrice * l.quantity;
    const margin = lineSubtotal > 0 ? ((lineSubtotal - lineCost) / lineSubtotal) * 100 : 0;
    return margin < l.minMarginThreshold;
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-card text-card-foreground border-border">
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Review: {quote.quoteNumber}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {quote.customerName} • {quote.customerTier} Tier • Created {new Date(quote.createdAt).toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="lines" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-muted p-1">
            <TabsTrigger value="lines" className="text-xs">Line Items</TabsTrigger>
            <TabsTrigger value="violations" className="text-xs">
              Violations
              {lineViolations.length > 0 && (
                <span className="ml-1.5 bg-destructive text-white text-[10px] rounded-full h-4 w-4 inline-flex items-center justify-center font-bold">
                  {lineViolations.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="audit" className="text-xs">Audit Trail</TabsTrigger>
          </TabsList>

          <TabsContent value="lines" className="pt-3 space-y-3">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="text-xs font-bold">Product</TableHead>
                  <TableHead className="text-xs font-bold text-center">Qty</TableHead>
                  <TableHead className="text-xs font-bold text-right">Discount</TableHead>
                  <TableHead className="text-xs font-bold text-right">Net Subtotal</TableHead>
                  <TableHead className="text-xs font-bold text-right">Margin</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quote.lines.map((line) => {
                  const lineCost = line.costPrice * line.quantity;
                  const margin =
                    line.lineSubtotal > 0
                      ? ((line.lineSubtotal - lineCost) / line.lineSubtotal) * 100
                      : 0;
                  const isBad = margin < line.minMarginThreshold;
                  return (
                    <TableRow key={line.id} className={isBad ? "bg-destructive/5" : ""}>
                      <TableCell className="text-xs font-medium">{line.productName}</TableCell>
                      <TableCell className="text-center font-mono text-xs">{line.quantity}</TableCell>
                      <TableCell className="text-right font-mono text-xs">{line.discountPercent}%</TableCell>
                      <TableCell className="text-right font-mono font-bold text-xs">
                        ${line.lineSubtotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`text-xs font-mono font-bold ${isBad ? "text-destructive" : "text-emerald-500"}`}>
                          {margin.toFixed(1)}%
                          {isBad && <span className="ml-1 text-[10px]">(min {line.minMarginThreshold}%)</span>}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <div className="flex justify-end text-xs pt-1 border-t border-border">
              <span className="text-muted-foreground mr-2">Total Blended Margin:</span>
              <span className={`font-mono font-bold ${
                quote.totalMarginPercent >= 30
                  ? "text-emerald-500"
                  : quote.totalMarginPercent >= 15
                  ? "text-amber-500"
                  : "text-destructive"
              }`}>
                {quote.totalMarginPercent.toFixed(1)}%
              </span>
            </div>
          </TabsContent>

          <TabsContent value="violations" className="pt-3 space-y-3">
            {lineViolations.length === 0 ? (
              <div className="py-6 text-center text-xs text-emerald-500 flex items-center justify-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                No margin threshold violations on this quote.
              </div>
            ) : (
              lineViolations.map((line) => {
                const lineCost = line.costPrice * line.quantity;
                const margin =
                  line.lineSubtotal > 0
                    ? ((line.lineSubtotal - lineCost) / line.lineSubtotal) * 100
                    : 0;
                return (
                  <div
                    key={line.id}
                    className="bg-destructive/5 border border-destructive/30 p-3 rounded-none text-xs space-y-1"
                  >
                    <div className="flex items-center gap-2 text-destructive font-semibold">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {line.productName}
                    </div>
                    <div className="text-muted-foreground space-y-0.5 pl-5">
                      <p>Applied discount: <span className="font-mono font-bold">{line.discountPercent}%</span></p>
                      <p>Resulting margin: <span className="font-mono font-bold text-destructive">{margin.toFixed(1)}%</span></p>
                      <p>Minimum required: <span className="font-mono font-bold">{line.minMarginThreshold}%</span></p>
                      <p>Violation severity: <span className="font-mono font-bold text-destructive">-{(line.minMarginThreshold - margin).toFixed(1)}% below floor</span></p>
                    </div>
                  </div>
                );
              })
            )}

            <div className="text-xs pt-2 border-t border-border">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Blended Risk Score</span>
                <span className="font-mono font-bold">{quote.blendedRiskScore} / 20</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground mt-1">
                <span>Required Approval Level</span>
                <Badge className={`text-[10px] border ${RISK_BADGE[quote.requiredApprovalLevel]}`}>
                  {quote.requiredApprovalLevel === "NONE"
                    ? "Auto-Approved"
                    : quote.requiredApprovalLevel === "SALES_MANAGER"
                    ? "Sales Manager"
                    : "Finance Sign-Off"}
                </Badge>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="audit" className="pt-3 space-y-2">
            <div className="space-y-2">
              {quote.auditLogs.map((event, idx) => (
                <div key={event.id} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className="h-6 w-6 rounded-full bg-muted border border-border flex items-center justify-center">
                      <History className="h-3 w-3 text-muted-foreground" />
                    </div>
                    {idx < quote.auditLogs.length - 1 && (
                      <div className="flex-1 w-px bg-border mt-1 h-6" />
                    )}
                  </div>
                  <div className="pb-4 text-xs">
                    <p className="font-semibold text-foreground">{event.action.replaceAll("_", " ")}</p>
                    <p className="text-muted-foreground">
                      {event.actorName} • {new Date(event.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <Separator />
        <div className="space-y-3 pt-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">
              Approval Notes / Rejection Reason
            </Label>
            <Input
              placeholder="Add context, conditions, or revision instructions..."
              value={actionNotes}
              onChange={(e) => setActionNotes(e.target.value)}
              className="h-9 text-xs"
            />
          </div>

          <DialogFooter className="flex flex-wrap sm:flex-row gap-2 pt-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReturn}
              disabled={isAnyPending}
              className="gap-1.5 text-xs"
            >
              {returnMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RotateCcw className="h-3.5 w-3.5 text-amber-500" />
              )}
              Return for Revision
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleReject}
              disabled={isAnyPending}
              className="gap-1.5 text-xs bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/30"
            >
              {rejectMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <XCircle className="h-3.5 w-3.5" />
              )}
              Reject
            </Button>
            <Button
              size="sm"
              onClick={handleApprove}
              disabled={isAnyPending}
              className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {approveMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
              Approve Quotation
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
