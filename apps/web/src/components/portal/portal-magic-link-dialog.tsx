import React, { useState } from "react";
import { KeyRound, Send } from "lucide-react";
import { toast } from "sonner";
import { useRequestMagicLink } from "@/hooks/use-portal";
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

type PortalMagicLinkDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PortalMagicLinkDialog({ open, onOpenChange }: PortalMagicLinkDialogProps) {
  const requestMagicLinkMutation = useRequestMagicLink();
  const [email, setEmail] = useState("");
  const [quoteNumber, setQuoteNumber] = useState("");

  const handleRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your account email address.");
      return;
    }

    requestMagicLinkMutation.mutate(
      {
        email: email.trim(),
        quoteNumber: quoteNumber.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Magic Access Link Requested!", {
            description: `If an active quotation exists for ${email}, a fresh secure link has been sent to your inbox.`,
          });
          onOpenChange(false);
          setEmail("");
          setQuoteNumber("");
        },
        onError: () => {
          toast.error("Could not request magic link. Please check your details.");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card text-card-foreground border-border">
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            <span>Request Customer Portal Magic Link</span>
          </DialogTitle>
          <DialogDescription className="text-xs">
            Enter your email address to receive a instant access magic link to view your quotations.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleRequest} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Your Email Address</Label>
            <Input
              type="email"
              placeholder="e.g. customer@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-9 text-xs"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Quotation Number (Optional)</Label>
            <Input
              placeholder="e.g. Q-2026-001"
              value={quoteNumber}
              onChange={(e) => setQuoteNumber(e.target.value)}
              className="h-9 text-xs"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={requestMagicLinkMutation.isPending}
              className="gap-1.5 font-semibold"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{requestMagicLinkMutation.isPending ? "Requesting..." : "Send Magic Link"}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
