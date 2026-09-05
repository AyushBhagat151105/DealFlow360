import React, { useState } from "react";
import { KeyRound, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PortalMagicLinkDialog } from "./portal-magic-link-dialog";

type PortalInvalidTokenProps = {
  reason?: string;
};

export function PortalInvalidToken({ reason }: PortalInvalidTokenProps) {
  const [magicModalOpen, setMagicModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <Card className="max-w-md w-full text-center border-destructive/40 bg-card shadow-lg">
        <CardHeader className="pb-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-2">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl font-bold text-destructive">
            Invalid or Expired Access Link
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground pt-1">
            {reason ||
              "The customer portal token is invalid, revoked, or has expired. Access permissions cannot be verified."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          <div className="p-3 bg-muted/40 rounded border border-border text-xs text-muted-foreground text-left">
            <span className="font-semibold text-foreground block mb-1">What can you do?</span>
            <ul className="list-disc pl-4 space-y-1">
              <li>Request a fresh access magic link sent directly to your email inbox</li>
              <li>Contact your assigned DealFlow360 sales representative for assistance</li>
            </ul>
          </div>

          <Button
            onClick={() => setMagicModalOpen(true)}
            className="w-full gap-2 text-xs font-semibold"
          >
            <KeyRound className="h-4 w-4" />
            <span>Request New Magic Access Link</span>
          </Button>

          <PortalMagicLinkDialog open={magicModalOpen} onOpenChange={setMagicModalOpen} />
        </CardContent>
      </Card>
    </div>
  );
}
