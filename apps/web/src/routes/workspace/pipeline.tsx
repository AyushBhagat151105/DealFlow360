import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQuotes } from "@/hooks/use-quotes";
import type { Quote, QuoteStatus } from "@/lib/api-types";

export const Route = createFileRoute("/workspace/pipeline")({
  component: PipelineComponent,
});

const columns: Array<{ status: QuoteStatus; label: string }> = [
  { status: "DRAFT", label: "Draft" },
  { status: "PENDING_APPROVAL", label: "Waiting for review" },
  { status: "APPROVED", label: "Approved" },
  { status: "UNDER_NEGOTIATION", label: "In negotiation" },
  { status: "CONFIRMED", label: "Confirmed" },
  { status: "FULFILLED", label: "Fulfilled" },
];

function PipelineComponent() {
  const quotesQuery = useQuotes();

  if (quotesQuery.isLoading) return <PageState label="Loading pipeline" />;
  if (quotesQuery.isError) return <PageState label="Pipeline is unavailable" action={<Button onClick={() => quotesQuery.refetch()}>Try again</Button>} />;

  const quotes = quotesQuery.data ?? [];

  return (
    <main className="min-h-full overflow-y-auto bg-background">
      <div className="mx-auto max-w-[1600px] space-y-6 p-6">
        <header className="space-y-2">
          <p className="font-mono text-xs tracking-[0.08em] text-muted-foreground">PIPELINE</p>
          <h1 className="text-2xl font-semibold tracking-[-0.02em]">Deal pipeline</h1>
          <p className="text-sm text-muted-foreground">Track live quotes from preparation through delivery.</p>
        </header>

        <div className="grid gap-3 overflow-x-auto pb-2 xl:grid-cols-6">
          {columns.map((column) => {
            const columnQuotes = quotes.filter((quote) => quote.status === column.status);
            return (
              <section key={column.status} className="min-w-[240px] border border-border bg-section">
                <div className="flex items-center justify-between border-b border-border p-3">
                  <h2 className="text-sm font-medium">{column.label}</h2>
                  <span className="font-mono text-xs text-muted-foreground">{columnQuotes.length}</span>
                </div>
                <div className="min-h-48 space-y-2 p-2">
                  {columnQuotes.length === 0 ? <p className="p-3 text-xs text-muted-foreground">No quotes here.</p> : columnQuotes.map((quote) => <DealCard key={quote.id} quote={quote} />)}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}

function DealCard({ quote }: { quote: Quote }) {
  return (
    <Card className="rounded-lg border-border bg-card shadow-none">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div><p className="text-sm font-medium">{quote.customerName}</p><p className="font-mono text-xs text-muted-foreground">{quote.quoteNumber}</p></div>
          <Badge variant="outline" className="border-border text-xs">{quote.requiredApprovalLevel === "NONE" ? "No review" : "Review"}</Badge>
        </div>
        <div className="flex items-end justify-between gap-2"><span className="font-mono text-sm">${quote.totalSubtotal.toLocaleString("en-US", { maximumFractionDigits: 0 })}</span><span className="text-xs text-muted-foreground">{quote.totalMarginPercent.toFixed(1)}% margin</span></div>
        <div className="flex gap-2"><Link to="/workspace/fulfillment/$id" params={{ id: quote.id }}><Button variant="outline" size="xs">Fulfillment</Button></Link><Link to="/workspace/billing/$id" params={{ id: quote.id }}><Button variant="ghost" size="xs"><ArrowRight className="h-3.5 w-3.5" /></Button></Link></div>
      </CardContent>
    </Card>
  );
}

function PageState({ label, action }: { label: string; action?: ReactNode }) { return <main className="flex min-h-full items-center justify-center bg-background p-6"><div className="space-y-4 text-center"><RefreshCw className="mx-auto h-5 w-5 text-primary" /><p className="text-sm text-muted-foreground">{label}</p>{action}</div></main>; }
