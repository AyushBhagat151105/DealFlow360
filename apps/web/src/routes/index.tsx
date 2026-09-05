import { createFileRoute, Link } from "@tanstack/react-router";
import {
  FileText,
  Kanban,
  CheckCircle2,
  Activity,
  ArrowRight,
  TrendingUp,
  ShieldAlert,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/")(({
  component: HomeComponent,
}));

const FEATURES = [
  {
    to: "/workspace/builder",
    title: "Reactive Quotation Builder",
    description: "Build quotes, configure discounts, and view live margin & blended risk score meters.",
    icon: FileText,
    surface: "surface-mint",
    badge: "Sales Rep",
  },
  {
    to: "/workspace/pipeline",
    title: "Deal Pipeline Kanban",
    description: "Track quotes across Draft, Pending Approval, Negotiation, and Fulfilled stages.",
    icon: Kanban,
    surface: "surface-teal",
    badge: "Manager",
  },
  {
    to: "/workspace/approvals",
    title: "Discount Approvals Queue",
    description: "Review risk scores, rule violations, and approve or reject with full audit timelines.",
    icon: CheckCircle2,
    surface: "surface-yellow",
    badge: "Governance",
  },
  {
    to: "/dashboard",
    title: "Deal Health Dashboard",
    description: "Monitor pipeline value, discount anomalies, and 1-click rep nudges.",
    icon: Activity,
    surface: "surface-blush",
    badge: "Executive",
  },
] as const;

const CAPABILITIES = [
  {
    icon: TrendingUp,
    label: "Live Margin Bar",
    description: "Dynamic visual margin thresholds (≥30% healthy, 15–29% caution, <15% at risk)",
  },
  {
    icon: ShieldAlert,
    label: "Blended Risk Score",
    description: "Auto-routes approval to Manager (score 1–10) or Finance (>10)",
  },
  {
    icon: Layers,
    label: "Warehouse Auto-Split",
    description: "Smart allocation across Chicago & NYC depots with backorder detection",
  },
] as const;

function HomeComponent() {
  return (
    <div className="min-h-screen bg-cream-paper">
      {/* Nav bar */}
      <nav className="border-b border-pencil-gray/40 bg-cream-paper">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-highlighter-yellow text-forest-ink font-black text-sm select-none">
              DF
            </div>
            <span className="font-bold text-forest-ink text-sm tracking-tight">
              DealFlow<span className="font-black">360</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/login">
              <Button variant="outline" size="sm" className="h-8 text-xs border-pencil-gray text-forest-ink hover:bg-whisper-gray">
                Sign In
              </Button>
            </Link>
            <Link to="/workspace/builder">
              <Button size="sm" className="h-8 text-xs bg-forest-ink text-cream-paper hover:bg-forest-ink/90">
                Open Workspace
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-6 py-16 space-y-20">
        {/* Hero */}
        <div className="max-w-2xl space-y-6">
          <Badge className="bg-highlighter-yellow text-forest-ink border-0 font-medium text-xs px-3 py-1 rounded-full">
            Enterprise Quotation Engine
          </Badge>
          <h1 className="font-display text-[56px] leading-[1.0] tracking-[0.04em] text-forest-ink">
            Turn every quote into a{" "}
            <span className="highlight-word">profitable</span>{" "}
            decision.
          </h1>
          <p className="text-lg text-forest-ink/70 leading-relaxed max-w-xl">
            DealFlow360 helps B2B teams quote faster, route approvals intelligently, protect blended margin, and match inventory before a deal closes.
          </p>
          <div className="flex items-center gap-3">
            <Link to="/workspace/builder">
              <Button className="bg-forest-ink text-cream-paper hover:bg-forest-ink/90 text-sm px-6 py-5 rounded-md font-medium">
                → Launch Builder
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" className="border-pencil-gray text-forest-ink hover:bg-whisper-gray text-sm px-6 py-5 rounded-md">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        {/* Feature cards — sticky note grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {FEATURES.map((feat) => {
            const Icon = feat.icon;
            return (
              <Link key={feat.to} to={feat.to}>
                <div className={`group rounded-xl border border-forest-ink/10 p-6 space-y-4 cursor-pointer transition-all hover:border-forest-ink/30 hover:shadow-sm ${feat.surface}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cream-paper/70 text-forest-ink border border-forest-ink/10">
                      <Icon className="h-4 w-4" />
                    </div>
                    <Badge className="bg-cream-paper/70 text-forest-ink border-0 text-[10px] font-mono">
                      {feat.badge}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="font-semibold text-forest-ink text-base flex items-center gap-1.5">
                      {feat.title}
                      <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </h3>
                    <p className="text-sm text-forest-ink/60 leading-relaxed mt-1">{feat.description}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Capability strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-px border border-pencil-gray/40 rounded-xl overflow-hidden bg-pencil-gray/30">
          {CAPABILITIES.map((cap, i) => {
            const Icon = cap.icon;
            return (
              <div key={cap.label} className={`bg-cream-paper p-6 ${i > 0 ? "" : ""}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="h-4 w-4 text-forest-ink/60" />
                  <span className="font-semibold text-forest-ink text-sm">{cap.label}</span>
                </div>
                <p className="text-xs text-forest-ink/50 leading-relaxed">{cap.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
