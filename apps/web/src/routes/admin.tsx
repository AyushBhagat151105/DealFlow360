import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin")({
  component: AdminComponent,
});

function AdminComponent() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold tracking-tight">Admin Configuration</h1>
      <p className="text-muted-foreground text-sm mt-1">
        Configure customer discount ceilings, product categories, and system thresholds.
      </p>
    </div>
  );
}
