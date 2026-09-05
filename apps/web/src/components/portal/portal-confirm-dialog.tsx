import React, { useState } from "react";
import { ShieldCheck, PenTool, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useConfirmPortalQuote } from "@/hooks/use-portal";
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

type PortalConfirmDialogProps = {
  token: string;
  quoteNumber: string;
  customerName: string;
  totalSubtotal: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PortalConfirmDialog({
  token,
  quoteNumber,
  customerName,
  totalSubtotal,
  open,
  onOpenChange,
}: PortalConfirmDialogProps) {
  const confirmQuoteMutation = useConfirmPortalQuote(token);
  const [signatureText, setSignatureText] = useState("");

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signatureText.trim()) {
      toast.error("Please type your signature to confirm approval.");
      return;
    }

    confirmQuoteMutation.mutate(
      { customerSignature: signatureText },
      {
        onSuccess: () => {
          toast.success("Quotation Confirmed & Signed!", {
            description: "Thank you for confirming your agreement. A confirmation copy has been sent.",
          });
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card text-card-foreground border-border">
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-500" />
            <span>Confirm & Formal Acceptance</span>
          </DialogTitle>
          <DialogDescription className="text-xs">
            By confirming, you agree to the scope of supply, terms, and total amount of ${totalSubtotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleConfirm} className="space-y-4 py-2">
          <div className="bg-emerald-500/10 p-3 rounded border border-emerald-500/30 text-xs text-emerald-600 dark:text-emerald-400 space-y-1">
            <span className="font-bold block">Digital Sign-Off Summary</span>
            <p>
              Quotation #{quoteNumber} • Customer: {customerName}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold flex items-center gap-1">
              <PenTool className="h-3.5 w-3.5 text-primary" />
              <span>Type Full Authorized Signature</span>
            </Label>
            <Input
              placeholder="e.g. Alice Johnson"
              value={signatureText}
              onChange={(e) => setSignatureText(e.target.value)}
              className="h-10 text-sm font-serif italic border-primary/50"
              required
            />
            <span className="text-[10px] text-muted-foreground block">
              Typing your full legal name constitutes a binding digital acceptance.
            </span>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={confirmQuoteMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Confirm & Sign</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
