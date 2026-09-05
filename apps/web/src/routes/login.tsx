import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  Zap,
  ShieldCheck,
  Layers,
  TrendingUp,
  CreditCard,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Building2,
} from "lucide-react";
import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/login")({
  component: RouteComponent,
});

function RouteComponent() {
  const [showSignIn, setShowSignIn] = useState(true);
  const navigate = useNavigate();

  const productFeatures = [
    {
      title: "Blended Margin Governance",
      description: "Automated approval routing and live risk scoring across all quote scenarios.",
      icon: ShieldCheck,
    },
    {
      title: "Multi-Warehouse Auto-Split",
      description: "Distribute demand across depots with faster fulfillment and lower stock risk.",
      icon: Layers,
    },
    {
      title: "Hybrid Billing Control",
      description: "Blend service contracts, subscription renewals, and one-time invoices in one flow.",
      icon: CreditCard,
    },
    {
      title: "Customer Negotiation Portal",
      description: "Keep external deal review transparent, auditable, and margin-safe.",
      icon: TrendingUp,
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-primary selection:text-primary-foreground">
      <header className="border-b border-border bg-card/70 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/30">
              <Zap className="h-5 w-5 fill-primary-foreground" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-foreground">
                DealFlow<span className="text-emerald-500">360</span>
              </span>
              <span className="hidden sm:inline text-[11px] text-muted-foreground font-mono ml-2 border-l border-border pl-2">
                Enterprise Platform
              </span>
            </div>
          </div>
          <Badge variant="outline" className="border-primary/40 text-foreground bg-muted text-[10px] uppercase tracking-[0.18em]">
            B2B Quotation Engine
          </Badge>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        <div className="lg:col-span-7 space-y-8">
          <div className="space-y-5">
            <Badge
              variant="outline"
              className="border-primary/40 bg-primary/5 text-foreground gap-1.5 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em]"
            >
              <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
              Margin protection • multi-warehouse • hybrid billing
            </Badge>
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground leading-tight">
                Turn every quote into a governed, profitable revenue decision.
              </h1>
              <p className="max-w-2xl text-muted-foreground text-base sm:text-lg leading-relaxed">
                DealFlow360 helps B2B teams quote faster, route approvals intelligently, protect blended margin, and match inventory across warehouses before a deal is finalized.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: "Quote-to-close velocity", value: "31%" },
              { label: "Margin leakage prevented", value: "$1.2M" },
              { label: "Approval SLA", value: "< 2h" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-border bg-card/80 p-4">
                <div className="text-lg font-black text-foreground">{stat.value}</div>
                <div className="mt-1 text-[11px] text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {productFeatures.map((feat) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.title}
                  className="rounded-xl border border-border bg-card/80 p-4 space-y-3 transition-colors hover:border-primary/50 hover:bg-card"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-muted text-foreground">
                    <Icon className="h-4 w-4 text-emerald-500" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">{feat.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{feat.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-5 w-full">
          <Card className="border-border bg-card/90 shadow-2xl shadow-primary/5">
            <CardContent className="p-5 sm:p-6">
              <div className="mb-5 flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/60 p-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5 text-primary" />
                  Workspace access
                </div>
                <div className="flex items-center gap-1 rounded-md border border-border bg-background p-1">
                  <button
                    type="button"
                    onClick={() => setShowSignIn(true)}
                    className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                      showSignIn ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                    }`}
                  >
                    Sign in
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSignIn(false)}
                    className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                      !showSignIn ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                    }`}
                  >
                    Create account
                  </button>
                </div>
              </div>

              {showSignIn ? (
                <SignInForm onSwitchToSignUp={() => setShowSignIn(false)} />
              ) : (
                <SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
              )}

              <div className="mt-4 flex items-center justify-center gap-2 border-t border-border pt-3 text-[11px] text-muted-foreground">
                <span>Need an enterprise rollout?</span>
                <Button variant="link" className="h-auto p-0 text-primary text-[11px]">
                  Talk to sales <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="border-t border-border bg-card py-4 text-center text-[11px] text-muted-foreground">
        <p>DealFlow360 Enterprise Platform &copy; 2026. All rights reserved.</p>
      </footer>
    </div>
  );
}
