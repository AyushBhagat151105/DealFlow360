import React, { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Building2,
  FileText,
  MessageSquare,
  PenTool,
  RefreshCw,
} from "lucide-react";
import {
  usePortalQuote,
  useVerifyPortalToken,
  type SanitizedQuoteLine,
} from "@/hooks/use-portal";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PortalHeader } from "@/components/portal/portal-header";
import { PortalLineItems } from "@/components/portal/portal-line-items";
import { PortalCounterOffer } from "@/components/portal/portal-counter-offer";
import { PortalComments } from "@/components/portal/portal-comments";
import { PortalCommentDialog } from "@/components/portal/portal-comment-dialog";
import { PortalConfirmDialog } from "@/components/portal/portal-confirm-dialog";
import { PortalSendLinkDialog } from "@/components/portal/portal-send-link-dialog";
import { PortalInvalidToken } from "@/components/portal/portal-invalid-token";

export const Route = createFileRoute("/portal/quote/$token")({
  component: CustomerPortalComponent,
});

function CustomerPortalComponent() {
  const { token } = Route.useParams();

  // Integrated APIs: Token Verification + Sanitized Quote Query
  const { data: verifyResult, isLoading: isVerifying, isError: isVerifyError } = useVerifyPortalToken(token);
  const { data: quote, isLoading: isQuoteLoading } = usePortalQuote(token);

  // Dialog State
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [selectedLineForComment, setSelectedLineForComment] = useState<SanitizedQuoteLine | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [sendLinkModalOpen, setSendLinkModalOpen] = useState(false);

  if (isVerifying || isQuoteLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
        <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
          <RefreshCw className="h-5 w-5 animate-spin text-primary" />
          <span>Verifying encrypted portal session...</span>
        </div>
      </div>
    );
  }

  if (isVerifyError || (verifyResult && verifyResult.valid === false) || !quote) {
    return <PortalInvalidToken reason={verifyResult?.status ? `Token verification status: ${verifyResult.status}` : undefined} />;
  }

  const isConfirmed = quote.status === "CONFIRMED" || quote.status === "FULFILLED";
  const isUnderNegotiation = quote.status === "UNDER_NEGOTIATION";

  const handleOpenComment = (line?: SanitizedQuoteLine) => {
    setSelectedLineForComment(line || null);
    setCommentModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-16">
      <PortalHeader
        isConfirmed={isConfirmed}
        isUnderNegotiation={isUnderNegotiation}
        onOpenConfirmModal={() => setConfirmModalOpen(true)}
        onOpenSendLinkModal={() => setSendLinkModalOpen(true)}
      />

      <main className="max-w-6xl mx-auto px-4 sm:px-8 pt-6 space-y-6">
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="p-5 pb-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  <span className="text-sm font-bold text-foreground">{quote.customerName}</span>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    Tier: {quote.customerTier}
                  </Badge>
                </div>
                <CardTitle className="text-2xl font-black tracking-tight text-foreground">
                  Quotation #{quote.quoteNumber}
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Issued on {new Date(quote.createdAt).toLocaleDateString("en-US", { dateStyle: "medium" })} • Valid for 30 Days
                </CardDescription>
              </div>

              <div className="text-right space-y-1">
                <span className="text-xs text-muted-foreground block font-medium">Total Quotation Value</span>
                <span className="text-3xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                  ${quote.totalSubtotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <p className="text-[11px] text-muted-foreground">Includes all applied volume discounts</p>
              </div>
            </div>
          </CardHeader>
          {quote.notes && (
            <CardContent className="p-5 pt-0">
              <div className="text-xs text-muted-foreground bg-muted/40 p-3 rounded-md border border-border/60">
                <span className="font-semibold text-foreground">Account Manager Notes: </span>
                {quote.notes}
              </div>
            </CardContent>
          )}
        </Card>

        <Tabs defaultValue="lines" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md bg-muted p-1">
            <TabsTrigger value="lines" className="text-xs font-medium gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              <span>Line Items</span>
            </TabsTrigger>
            <TabsTrigger value="counter" className="text-xs font-medium gap-1.5" disabled={isConfirmed}>
              <PenTool className="h-3.5 w-3.5" />
              <span>Counter Offer</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="text-xs font-medium gap-1.5">
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Comments & Q&A</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="lines" className="space-y-4 pt-4">
            <PortalLineItems lines={quote.lines} onOpenCommentModal={handleOpenComment} />
          </TabsContent>

          <TabsContent value="counter" className="space-y-4 pt-4">
            <PortalCounterOffer token={token} lines={quote.lines} />
          </TabsContent>

          <TabsContent value="activity" className="space-y-4 pt-4">
            <PortalComments comments={quote.comments} onOpenCommentModal={() => handleOpenComment()} />
          </TabsContent>
        </Tabs>
      </main>

      <PortalCommentDialog
        token={token}
        open={commentModalOpen}
        onOpenChange={setCommentModalOpen}
        selectedLine={selectedLineForComment}
      />

      <PortalConfirmDialog
        token={token}
        quoteNumber={quote.quoteNumber}
        customerName={quote.customerName}
        totalSubtotal={quote.totalSubtotal}
        open={confirmModalOpen}
        onOpenChange={setConfirmModalOpen}
      />

      <PortalSendLinkDialog
        token={token}
        open={sendLinkModalOpen}
        onOpenChange={setSendLinkModalOpen}
      />
    </div>
  );
}
