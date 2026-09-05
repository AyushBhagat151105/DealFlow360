import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Zap,
  ShieldCheck,
  Layers,
  TrendingUp,
  CreditCard,
  Sparkles,
} from "lucide-react";
import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/login")({
  component: RouteComponent,
});

function RouteComponent() {
  const [showSignIn, setShowSignIn] = useState(true);

  const productFeatures = [
    {
      title: "Blended Margin Governance",
      description: "Automated risk score calculations with multi-tier Sales Manager & Finance approval routing.",
      icon: ShieldCheck,
    },
    {
      title: "Multi-Warehouse Auto-Split",
      description: "Smart stock allocation across Chicago & NYC depots with backorder detection & shipping optimizations.",
      icon: Layers,
    },
    {
      title: "Hybrid SaaS & Invoice Billing",
      description: "Side-by-side one-time invoices and recurring contracts with real-time daily seat proration.",
      icon: CreditCard,
    },
    {
      title: "Client Negotiation Portal",
      description: "External customer quote review view with zero cost/margin leakage and counter proposal submission.",
      icon: TrendingUp,
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-primary selection:text-primary-foreground">
      {/* Top Brand Header */}
      <header className="border-b border-border bg-card/60 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-primary text-primary-foreground shadow-sm">
              <Zap className="h-5 w-5 fill-primary-foreground" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-foreground">
                DealFlow<span className="text-emerald-500">360</span>
              </span>
              <span className="hidden sm:inline text-xs text-muted-foreground font-mono ml-2 border-l border-border pl-2">
                Enterprise Platform
              </span>
            </div>
          </div>
          <Badge variant="outline" className="border-primary/40 text-foreground bg-muted text-xs">
            B2B Quotation Engine
          </Badge>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Column: Product Showcase */}
        <div className="lg:col-span-7 space-y-8">
          <div className="space-y-4">
            <Badge
              variant="outline"
              className="border-primary/40 text-foreground bg-muted gap-1.5 px-3 py-1 text-xs"
            >
              <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
              Automated Margin Protection & Multi-Warehouse Engine
            </Badge>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground leading-tight">
              Enterprise B2B Quotation & Governance Platform
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
              DealFlow360 streamlines your sales pipeline from initial quote build to customer negotiation, discount approval routing, multi-warehouse stock split, and hybrid billing.
            </p>
          </div>

          {/* Product Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {productFeatures.map((feat) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.title}
                  className="rounded-lg border border-border bg-card p-4 space-y-2 hover:border-primary/50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-sm flex items-center justify-center border border-border bg-muted text-foreground">
                    <Icon className="h-4 w-4 text-emerald-500" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">{feat.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{feat.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Authentication Form */}
        <div className="lg:col-span-5 w-full">
          <Card className="border-border bg-card shadow-xl">
            <CardContent className="p-6">
              {showSignIn ? (
                <SignInForm onSwitchToSignUp={() => setShowSignIn(false)} />
              ) : (
                <SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-4 text-center text-xs text-muted-foreground">
        <p>DealFlow360 Enterprise Platform &copy; 2026. All rights reserved.</p>
      </footer>
    </div>
  );
}
