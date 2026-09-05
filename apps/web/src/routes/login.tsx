import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldCheck, Layers, CreditCard, TrendingUp } from "lucide-react";
import { SignInForm } from "@/components/sign-in-form";
import { SignUpForm } from "@/components/sign-up-form";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/login")({
  component: RouteComponent,
});

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Blended Margin Governance",
    description: "Automated approval routing and live risk scoring across all quote scenarios.",
  },
  {
    icon: Layers,
    title: "Multi-Warehouse Auto-Split",
    description: "Distribute demand across depots with faster fulfillment and lower stock risk.",
  },
  {
    icon: CreditCard,
    title: "Hybrid Billing Control",
    description: "Blend service contracts, subscription renewals, and one-time invoices in one flow.",
  },
  {
    icon: TrendingUp,
    title: "Customer Negotiation Portal",
    description: "Keep external deal review transparent, auditable, and margin-safe.",
  },
] as const;

function RouteComponent() {
  const [showSignIn, setShowSignIn] = useState(true);

  return (
    <div className="min-h-screen bg-cream-paper text-forest-ink">
      {/* Top bar */}
      <header className="border-b border-pencil-gray/40 bg-cream-paper px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-highlighter-yellow text-forest-ink font-black text-sm select-none">
            DF
          </div>
          <span className="font-bold text-forest-ink text-sm tracking-tight">
            DealFlow<span className="font-black">360</span>
          </span>
          <span className="font-mono text-[11px] text-forest-ink/40 ml-1 border-l border-pencil-gray/40 pl-3">
            Enterprise Platform
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-7xl w-full px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left — pitch */}
        <div className="lg:col-span-7 space-y-10 pt-4">
          <div className="space-y-5">
            <h1 className="font-display text-[52px] leading-[1.0] tracking-[0.04em] text-forest-ink max-w-lg">
              Turn every quote into a{" "}
              <span className="highlight-word">governed</span>,{" "}
              profitable decision.
            </h1>
            <p className="text-lg text-forest-ink/60 leading-relaxed max-w-md">
              DealFlow360 helps B2B teams quote faster, route approvals intelligently, protect margin, and match inventory before a deal is finalized.
            </p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Quote-to-close velocity", value: "31%" },
              { label: "Margin leakage prevented", value: "$1.2M" },
              { label: "Approval SLA", value: "< 2h" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-pencil-gray/40 bg-whisper-gray p-4">
                <div className="text-2xl font-black text-forest-ink">{stat.value}</div>
                <div className="mt-1 text-[11px] text-forest-ink/50">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Feature cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {FEATURES.map((feat) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.title}
                  className="rounded-xl border border-pencil-gray/40 bg-cream-paper p-4 space-y-2 hover:border-forest-ink/30 transition-colors"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-whisper-gray border border-pencil-gray/40">
                    <Icon className="h-4 w-4 text-forest-ink/60" />
                  </div>
                  <h3 className="text-sm font-semibold text-forest-ink">{feat.title}</h3>
                  <p className="text-xs text-forest-ink/50 leading-relaxed">{feat.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right — auth card */}
        <div className="lg:col-span-5 lg:sticky lg:top-8">
          <Card className="border-pencil-gray/60 bg-cream-paper shadow-sm">
            <CardContent className="p-6">
              {/* Tab switcher */}
              <div className="mb-6 flex items-center rounded-lg border border-pencil-gray/40 bg-whisper-gray p-1">
                {[
                  { label: "Sign in", active: showSignIn, action: () => setShowSignIn(true) },
                  { label: "Create account", active: !showSignIn, action: () => setShowSignIn(false) },
                ].map((tab) => (
                  <button
                    key={tab.label}
                    type="button"
                    onClick={tab.action}
                    className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                      tab.active
                        ? "bg-forest-ink text-cream-paper"
                        : "text-forest-ink/50 hover:text-forest-ink"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {showSignIn ? (
                <SignInForm onSwitchToSignUp={() => setShowSignIn(false)} />
              ) : (
                <SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
              )}
            </CardContent>
          </Card>

          <p className="mt-3 text-center text-[11px] text-forest-ink/40">
            No credit card required. Enterprise plans available.
          </p>
        </div>
      </main>
    </div>
  );
}
