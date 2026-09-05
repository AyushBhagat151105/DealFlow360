import React, { useState } from "react";
import { MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";
import type { SanitizedQuoteLine } from "@/hooks/use-portal";
import { useSubmitPortalComment } from "@/hooks/use-portal";
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

type PortalCommentDialogProps = {
  token: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedLine: SanitizedQuoteLine | null;
};

export function PortalCommentDialog({
  token,
  open,
  onOpenChange,
  selectedLine,
}: PortalCommentDialogProps) {
  const submitCommentMutation = useSubmitPortalComment(token);
  const [authorName, setAuthorName] = useState("");
  const [commentText, setCommentText] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim() || !commentText.trim()) {
      toast.error("Please enter your name and comment.");
      return;
    }

    submitCommentMutation.mutate(
      {
        quotationLineId: selectedLine?.id || null,
        authorName,
        comment: commentText,
      },
      {
        onSuccess: () => {
          toast.success("Comment submitted to sales team!");
          setCommentText("");
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
            <MessageSquare className="h-4 w-4 text-primary" />
            <span>
              {selectedLine
                ? `Comment on "${selectedLine.productName}"`
                : "General Quotation Query"}
            </span>
          </DialogTitle>
          <DialogDescription className="text-xs">
            Send a question or specification request directly to your assigned account executive.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Your Name</Label>
            <Input
              placeholder="e.g. Alice Johnson"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="h-9 text-xs"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Message / Comment</Label>
            <Input
              placeholder="Type your question or clarification request..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="h-16 text-xs"
              required
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={submitCommentMutation.isPending} className="gap-1.5">
              <Send className="h-3.5 w-3.5" />
              <span>Send Comment</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
