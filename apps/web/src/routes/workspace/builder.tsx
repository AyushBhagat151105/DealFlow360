import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/workspace/builder")({
  component: BuilderComponent,
});

function BuilderComponent() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold tracking-tight">Quotation Builder</h1>
      <p className="text-muted-foreground text-sm mt-1">
        Configure deal items, calculate live margin & risk score, and apply upsell suggestions.
      </p>
    </div>
  );
}
