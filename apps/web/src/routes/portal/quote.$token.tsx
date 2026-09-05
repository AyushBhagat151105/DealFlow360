import React, { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ShieldCheck,
  Zap,
  CheckCircle2,
  MessageSquare,
  Send,
  Lock,
  Building2,
  FileText,
  Clock,
  Sparkles,
  ArrowRight,
  RefreshCw,
  PenTool,
} from "lucide-react";
import { toast } from "sonner";
import {
  usePortalQuote,
  useSubmitPortalComment,
  useSubmitPortalCounter,
  useConfirmPortalQuote,
  type SanitizedQuoteLine,
} from "@/hooks/use-portal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

export const Route = createFileRoute("/portal/quote/$token")({
  component: CustomerPortalComponent,
});

function CustomerPortalComponent() {
  const { token } = Route.useParams();
  const { data: quote, isLoading } = usePortalQuote(token);

  const submitCommentMutation = useSubmitPortalComment(token);
  const submitCounterMutation = useSubmitPortalCounter(token);
  const confirmQuoteMutation = useConfirmPortalQuote(token);

  // Local State for interactive dialogs
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [selectedLineForComment, setSelectedLineForComment] = useState<SanitizedQuoteLine | null>(
    null
  );
  const [authorName, setAuthorName] = useState("");
  const [commentText, setCommentText] = useState("");

  // Counter proposal state
  const [counterDiscounts, setCounterDiscounts] = useState<Record<string, number>>({});
  const [counterComment, setCounterComment] = useState("");

  // Confirmation signature modal
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [signatureText, setSignatureText] = useState("");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
        <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
          <RefreshCw className="h-5 w-5 animate-spin text-primary" />
          <span>Verifying encrypted portal session...</span>
        </div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
        <Card className="max-w-md w-full text-center border-destructive/40">
          <CardHeader>
            <CardTitle className="text-destructive">Invalid or Expired Link</CardTitle>
            <CardDescription>
              The customer portal token is invalid or has expired. Please request a new access link from your sales representative.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const isConfirmed = quote.status === "CONFIRMED" || quote.status === "FULFILLED";
  const isUnderNegotiation = quote.status === "UNDER_NEGOTIATION";

  // Calculate counter subtotal dynamically
  const calculateCounterTotal = () => {
    return quote.lines.reduce((sum, line) => {
      const discount = counterDiscounts[line.id] ?? line.discountPercent;
      const discountedPrice = line.unitPrice * (1 - discount / 100);
      return sum + discountedPrice * line.quantity;
    }, 0);
  };

  const counterTotalSubtotal = calculateCounterTotal();
  const savingsVsList = quote.lines.reduce((sum, line) => {
    return sum + line.unitPrice * line.quantity;
  }, 0) - counterTotalSubtotal;

  const handleOpenComment = (line?: SanitizedQuoteLine) => {
    setSelectedLineForComment(line || null);
    setCommentModalOpen(true);
  };

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim() || !commentText.trim()) {
      toast.error("Please enter your name and comment.");
      return;
    }

    submitCommentMutation.mutate(
      {
        quotationLineId: selectedLineForComment?.id || null,
        authorName,
        comment: commentText,
      },
      {
        onSuccess: () => {
          toast.success("Comment submitted to sales team!");
          setCommentText("");
          setCommentModalOpen(false);
        },
      }
    );
  };

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

    const proposedDiscounts = quote.lines.map((line) => ({
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

  const handleConfirmQuotation = (e: React.FormEvent) => {
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
          setConfirmModalOpen(false);
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-16">
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur-md px-4 sm:px-8 py-3.5 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-primary text-primary-foreground shadow-sm">
              <Zap className="h-5 w-5 fill-primary-foreground" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-foreground">
                  DealFlow<span className="text-emerald-500">360</span>
                </span>
                <Badge variant="outline" className="text-[10px] uppercase font-mono px-1.5 py-0 border-emerald-500/40 text-emerald-500">
                  Client Portal
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1 font-mono">
                <Lock className="h-3 w-3 text-emerald-500" /> 256-bit Encrypted Session
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge
              variant={isConfirmed ? "default" : isUnderNegotiation ? "secondary" : "outline"}
              className={`text-xs px-2.5 py-1 gap-1.5 font-medium ${
                isConfirmed
                  ? "bg-emerald-600 text-white"
                  : isUnderNegotiation
                  ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                  : ""
              }`}
            >
              {isConfirmed ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Quotation Confirmed</span>
                </>
              ) : isUnderNegotiation ? (
                <>
                  <Clock className="h-3.5 w-3.5" />
                  <span>Negotiation In Progress</span>
                </>
              ) : (
                <>
                  <FileText className="h-3.5 w-3.5 text-primary" />
                  <span>Ready for Review</span>
                </>
              )}
            </Badge>

            {!isConfirmed && (
              <Button
                onClick={() => setConfirmModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-9 px-4 gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Confirm & Sign Quotation</span>
              </Button>
            )}
          </div>
        </div>
      </header>
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
                  onClick={() => handleOpenComment()}
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
                    {quote.lines.map((line) => (
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
                            onClick={() => handleOpenComment(line)}
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
          </TabsContent>
          <TabsContent value="counter" className="space-y-4 pt-4">
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
                            <TableHead className="text-xs font-bold text-right w-44">Proposed Counter Discount (%)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {quote.lines.map((line) => {
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
                                      value={currentVal}
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
                        <Label htmlFor="author" className="text-xs font-semibold">Your Full Name / Authorization</Label>
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
                        <Label htmlFor="c-notes" className="text-xs font-semibold">Justification / Remarks (Optional)</Label>
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
          </TabsContent>
          <TabsContent value="activity" className="space-y-4 pt-4">
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
                  onClick={() => handleOpenComment()}
                  className="h-8 text-xs gap-1.5"
                >
                  <MessageSquare className="h-3.5 w-3.5 text-primary" />
                  <span>Add Comment</span>
                </Button>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {(!quote.comments || quote.comments.length === 0) ? (
                  <p className="text-xs text-muted-foreground text-center py-6">
                    No comments recorded yet.
                  </p>
                ) : (
                  quote.comments.map((cmt) => (
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
          </TabsContent>
        </Tabs>
      </main>
      <Dialog open={commentModalOpen} onOpenChange={setCommentModalOpen}>
        <DialogContent className="sm:max-w-md bg-card text-card-foreground border-border">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              <span>
                {selectedLineForComment
                  ? `Comment on "${selectedLineForComment.productName}"`
                  : "General Quotation Query"}
              </span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Send a question or specification request directly to your assigned account executive.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitComment} className="space-y-4 py-2">
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
              <Button type="button" variant="outline" size="sm" onClick={() => setCommentModalOpen(false)}>
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
      <Dialog open={confirmModalOpen} onOpenChange={setConfirmModalOpen}>
        <DialogContent className="sm:max-w-md bg-card text-card-foreground border-border">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
              <span>Confirm & Formal Acceptance</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              By confirming, you agree to the scope of supply, terms, and total amount of ${quote.totalSubtotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleConfirmQuotation} className="space-y-4 py-2">
            <div className="bg-emerald-500/10 p-3 rounded border border-emerald-500/30 text-xs text-emerald-600 dark:text-emerald-400 space-y-1">
              <span className="font-bold block">Digital Sign-Off Summary</span>
              <p>Quotation #{quote.quoteNumber} • Customer: {quote.customerName}</p>
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
              <Button type="button" variant="outline" size="sm" onClick={() => setConfirmModalOpen(false)}>
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
    </div>
  );
}
