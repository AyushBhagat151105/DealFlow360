import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/portal/quote/$token")({
  component: CustomerPortalComponent,
});

function CustomerPortalComponent() {
  const { token } = Route.useParams();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-bold">Customer Quotation Portal</h1>
            <p className="text-sm text-slate-400 font-mono">Token: {token}</p>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6">
          <p className="text-slate-300 text-sm">
            Restricted customer negotiation view. Zero internal margins, cost prices, or risk scores displayed.
          </p>
        </div>
      </div>
    </div>
  );
}
