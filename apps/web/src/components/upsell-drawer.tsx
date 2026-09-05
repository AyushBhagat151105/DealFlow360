import { Sparkles, Plus, TrendingUp, Tag, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useUpsellSuggestions } from "@/hooks/use-upsell-suggestions";
import type { UpsellSuggestion } from "@/lib/api-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";

interface UpsellDrawerProps {
  quoteId?: string;
  onAddUpsell: (suggestion: UpsellSuggestion) => void;
  addedProductIds?: string[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function UpsellDrawerContent({
  quoteId,
  onAddUpsell,
  addedProductIds = [],
}: Omit<UpsellDrawerProps, "open" | "onOpenChange">) {
  const { data: suggestions = [], isLoading } = useUpsellSuggestions(quoteId);

  const handleAdd = (suggestion: UpsellSuggestion) => {
    onAddUpsell(suggestion);
    toast.success(`Added "${suggestion.name}" to quotation!`, {
      description: `Margin delta: +${suggestion.marginDeltaPercent.toFixed(1)}%`,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4 py-4">
        <div className="h-24 w-full bg-muted animate-pulse rounded-md" />
        <div className="h-24 w-full bg-muted animate-pulse rounded-md" />
      </div>
    );
  }

  return (
    <div className="space-y-4 py-2">
      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 p-2.5 rounded border border-border">
        <Sparkles className="h-4 w-4 text-forest-ink/60 shrink-0" />
        <span>
          Intelligent AI recommendations powered by historical margin optimization and product affinity rules.
        </span>
      </div>

      {suggestions.length === 0 ? (
        <p className="text-xs text-muted-foreground py-8 text-center">
          No additional upsell suggestions at this time.
        </p>
      ) : (
        suggestions.map((suggestion) => {
          const isAlreadyAdded = addedProductIds.includes(suggestion.productId);

          return (
            <Card
              key={suggestion.productId}
              className={`transition-all border ${
                suggestion.isPromoted
                  ? "border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/10"
                  : "border-border bg-card"
              }`}
            >
              <CardHeader className="p-3.5 pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-mono">
                        {suggestion.category}
                      </Badge>
                      {suggestion.isPromoted && (
                        <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] gap-1 px-1.5 py-0">
                          <Tag className="h-3 w-3" />
                          {suggestion.promotionTag || "Promoted"}
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-sm font-semibold leading-snug">
                      {suggestion.name}
                    </CardTitle>
                  </div>
                  <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs font-mono font-bold shrink-0 gap-1">
                    <TrendingUp className="h-3 w-3" />
                    +{suggestion.marginDeltaPercent.toFixed(1)}% Margin
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-3.5 pt-0 space-y-3">
                <CardDescription className="text-xs text-muted-foreground leading-normal">
                  {suggestion.reason}
                </CardDescription>

                <div className="flex items-center justify-between pt-1 border-t border-border/50">
                  <div className="text-xs">
                    <span className="text-muted-foreground">List Price: </span>
                    <span className="font-mono font-bold text-foreground">
                      ${suggestion.basePrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <Button
                    size="sm"
                    variant={isAlreadyAdded ? "secondary" : "default"}
                    disabled={isAlreadyAdded}
                    onClick={() => handleAdd(suggestion)}
                    className={`h-7 text-xs gap-1.5 ${
                      !isAlreadyAdded ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""
                    }`}
                  >
                    {isAlreadyAdded ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        <span>Added</span>
                      </>
                    ) : (
                      <>
                        <Plus className="h-3.5 w-3.5" />
                        <span>Add to Quote</span>
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}

export function UpsellDrawer({
  quoteId,
  onAddUpsell,
  addedProductIds = [],
  open,
  onOpenChange,
}: UpsellDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger className="h-8 text-xs inline-flex items-center justify-center rounded-none font-medium gap-2 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 px-3 cursor-pointer">
        <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
        <span>Upsell Suggestions</span>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-emerald-500" />
            <SheetTitle>Intelligent Upsell Recommendations</SheetTitle>
          </div>
          <SheetDescription>
            High-margin product additions tailored to this deal profile to boost overall profitability.
          </SheetDescription>
        </SheetHeader>
        <UpsellDrawerContent
          quoteId={quoteId}
          onAddUpsell={onAddUpsell}
          addedProductIds={addedProductIds}
        />
      </SheetContent>
    </Sheet>
  );
}
