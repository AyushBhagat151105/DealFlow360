import React from "react";
import { MessageSquare } from "lucide-react";
import type { SanitizedQuote } from "@/hooks/use-portal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type PortalCommentsProps = {
  comments?: SanitizedQuote["comments"];
  onOpenCommentModal: () => void;
};

export function PortalComments({ comments, onOpenCommentModal }: PortalCommentsProps) {
  return (
    <Card className="border-border bg-card">
      <CardHeader className="p-4 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-semibold">Negotiation & Activity Log</CardTitle>
          <CardDescription className="text-xs">
            Questions, comments, and counter-offer audit trail.
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenCommentModal}
          className="h-8 text-xs gap-1.5"
        >
          <MessageSquare className="h-3.5 w-3.5 text-primary" />
          <span>Add Comment</span>
        </Button>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        {!comments || comments.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">
            No comments recorded yet.
          </p>
        ) : (
          comments.map((cmt) => (
            <div key={cmt.id} className="p-3 bg-muted/40 rounded-md border border-border space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground">{cmt.authorName}</span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {new Date(cmt.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-normal">{cmt.comment}</p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
