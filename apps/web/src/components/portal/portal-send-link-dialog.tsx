import React, { useState } from "react";
import { Mail, Send } from "lucide-react";
import { toast } from "sonner";
import { useSendPortalLink } from "@/hooks/use-portal";
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

type PortalSendLinkDialogProps = {
  token: string;
  defaultEmail?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PortalSendLinkDialog({
  token,
  defaultEmail = "",
  open,
  onOpenChange,
}: PortalSendLinkDialogProps) {
  const sendPortalLinkMutation = useSendPortalLink(token);
  const [recipientEmail, setRecipientEmail] = useState(defaultEmail);
  const [customMessage, setCustomMessage] = useState("");

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientEmail.trim()) {
      toast.error("Please enter a valid recipient email address.");
      return;
    }

    sendPortalLinkMutation.mutate(
      {
        recipientEmail: recipientEmail.trim(),
        customMessage: customMessage.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Portal Access Link Email Dispatched!", {
            description: `Sent encrypted access link to ${recipientEmail}.`,
          });
          onOpenChange(false);
        },
        onError: (err: unknown) => {
          const errorMsg =
            err && typeof err === "object" && "response" in err
              ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
              : null;
          toast.error(errorMsg || "Failed to send email link.");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card text-card-foreground border-border">
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            <span>Send Portal Link via Email</span>
          </DialogTitle>
          <DialogDescription className="text-xs">
            Dispatch an encrypted magic access link directly to the client or procurement contact.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSend} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Recipient Email Address</Label>
            <Input
              type="email"
              placeholder="e.g. client@acme-corp.com"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              className="h-9 text-xs"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Custom Note / Cover Message (Optional)</Label>
            <Input
              placeholder="e.g. Hi Alice, here is your revised commercial proposal."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="h-16 text-xs"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={sendPortalLinkMutation.isPending}
              className="gap-1.5 font-semibold"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{sendPortalLinkMutation.isPending ? "Sending Email..." : "Send Link Email"}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
