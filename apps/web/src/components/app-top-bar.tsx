import { useRouterState } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

const ROUTE_LABELS: Record<string, string> = {
  "/workspace/builder": "Quotations",
  "/workspace/pipeline": "Pipeline",
  "/workspace/approvals": "Approvals",
  "/workspace/invoices": "Invoices",
  "/dashboard": "Deal Health",
  "/admin": "Admin Config",
};

function getPageLabel(pathname: string): string {
  // Exact match first
  if (ROUTE_LABELS[pathname]) return ROUTE_LABELS[pathname];
  // Prefix match for dynamic routes
  const prefix = Object.keys(ROUTE_LABELS).find((key) => pathname.startsWith(key));
  return prefix ? ROUTE_LABELS[prefix] : "DealFlow360";
}

export function AppTopBar() {
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;
  const pageLabel = getPageLabel(pathname);

  return (
    <header className="flex h-12 min-w-0 shrink-0 items-center gap-2 border-b border-pencil-gray/40 bg-cream-paper px-2 sm:gap-3 sm:px-4">
      <SidebarTrigger className="h-7 w-7 text-forest-ink/60 hover:text-forest-ink hover:bg-whisper-gray" />

      <Separator orientation="vertical" className="h-4 bg-pencil-gray/40" />

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
        <span className="font-mono text-[11px] text-forest-ink/40 tracking-wide shrink-0">DealFlow360</span>
        <span className="text-pencil-gray/60 text-[11px] shrink-0">/</span>
        <span className="text-[13px] font-semibold text-forest-ink truncate">{pageLabel}</span>
      </nav>

      {/* Right actions */}
      <div className="ml-auto flex shrink-0 items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-[11px] gap-1.5 border-pencil-gray/60 text-forest-ink/60 hover:border-forest-ink hover:text-forest-ink bg-transparent font-medium"
          onClick={() => window.open("/portal/quote/acme_negotiation_token_2026", "_blank")}
        >
          <ExternalLink className="h-3 w-3" />
          <span className="hidden md:inline">Portal Preview</span>
        </Button>
      </div>
    </header>
  );
}
