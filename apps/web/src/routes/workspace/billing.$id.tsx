import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/workspace/billing/$id")({
  component: BillingComponent,
});

function BillingComponent() {
  const { id } = Route.useParams();

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold tracking-tight">
        Hybrid Billing & Subscriptions — Quote {id}
      </h1>
      <p className="text-muted-foreground text-sm mt-1">
        Manage one-time invoices, recurring contracts, seat adjustments, and daily proration.
      </p>
    </div>
  );
}
