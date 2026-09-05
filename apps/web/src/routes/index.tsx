import { createFileRoute, Link } from "@tanstack/react-router";
import {
  FileText,
  Kanban,
  CheckCircle2,
  Activity,
  ArrowRight,
  Zap,
  TrendingUp,
  ShieldAlert,
  Layers,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDemoStore } from "@/stores/demo-store";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  const { activeQuoteToken } = useDemoStore();

  const features = [
    {
      to: "/workspace/builder",
      title: "Reactive Quotation Builder",
      description: "Build quotes, configure discounts, and view live margin & blended risk score meters.",
      icon: FileText,
      color: "from-blue-500/20 to-cyan-500/20 text-blue-400 border-blue-500/30",
      badge: "Rep Core",
    },
    {
      to: "/workspace/pipeline",
      title: "Deal Pipeline Kanban",
      description: "Track quotes across Draft, Pending Approval, Under Negotiation, and Fulfilled stages.",
      icon: Kanban,
      color: "from-purple-500/20 to-indigo-500/20 text-purple-400 border-purple-500/30",
      badge: "Manager Core",
    },
    {
      to: "/workspace/approvals",
      title: "Discount Approvals Queue",
      description: "Review risk scores, rule violations, and approve/reject with 1-click audit timelines.",
      icon: CheckCircle2,
      color: "from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30",
      badge: "Governance",
    },
    {
      to: "/dashboard",
      title: "Deal Health & Anomaly Dashboard",
      description: "Monitor pipeline value, discount anomalies (>1.5x rep avg), and 1-click rep nudges.",
      icon: Activity,
      color: "from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30",
      badge: "Executive",
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-background via-background to-muted/30">
      <div className="container mx-auto max-w-6xl px-4 py-12 space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <Badge
            variant="outline"
            className="border-emerald-500/40 bg-emerald-500/10 text-emerald-400 gap-1.5 px-3 py-1 text-xs"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Enterprise Quotation & Margin Governance Engine
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent">
            DealFlow<span className="text-emerald-500">360</span> Workspace
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Eliminate margin leakage, automate multi-tier discount approval routing, split multi-warehouse inventory, and empower customer negotiations in real-time.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link to="/workspace/builder">
              <Button size="lg" className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25">
                <Zap className="h-4 w-4 fill-white" />
                Launch Quote Builder
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Button
              variant="outline"
              size="lg"
              onClick={() => window.open(`/portal/quote/${activeQuoteToken}`, "_blank")}
              className="gap-2 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
            >
              <Layers className="h-4 w-4" />
              Live Customer Portal View
            </Button>
          </div>
        </div>

        {/* Core Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feat) => {
            const Icon = feat.icon;
            return (
              <Link key={feat.to} to={feat.to}>
                <Card className="h-full transition-all duration-200 hover:border-emerald-500/50 hover:shadow-md cursor-pointer group">
                  <CardHeader className="flex flex-row items-start justify-between pb-2">
                    <div className={`p-2.5 rounded-sm bg-gradient-to-br border ${feat.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <Badge variant="secondary" className="text-[10px] font-mono">
                      {feat.badge}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <CardTitle className="text-lg group-hover:text-emerald-400 transition-colors flex items-center gap-2">
                      {feat.title}
                      <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-1 group-hover:translate-x-0" />
                    </CardTitle>
                    <CardDescription className="text-xs leading-relaxed">
                      {feat.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* System Capabilities Bar */}
        <div className="rounded-lg border border-border bg-card/60 backdrop-blur-sm p-6 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold text-lg">
              <TrendingUp className="h-5 w-5" />
              Live Margin Bar
            </div>
            <p className="text-xs text-muted-foreground">
              Dynamic visual margin thresholds (Green &ge;30%, Amber 15-29%, Red &lt;15%)
            </p>
          </div>
          <div className="space-y-1 border-y sm:border-y-0 sm:border-x border-border/60 py-4 sm:py-0 px-4">
            <div className="flex items-center justify-center gap-2 text-amber-400 font-bold text-lg">
              <ShieldAlert className="h-5 w-5" />
              Blended Risk Score
            </div>
            <p className="text-xs text-muted-foreground">
              Auto-routes approval to Manager (Score 1-10) or Finance (&gt;10)
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-2 text-blue-400 font-bold text-lg">
              <Layers className="h-5 w-5" />
              Warehouse Auto-Split
            </div>
            <p className="text-xs text-muted-foreground">
              Smart allocation across Chicago & NYC depots with backorder detection
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
