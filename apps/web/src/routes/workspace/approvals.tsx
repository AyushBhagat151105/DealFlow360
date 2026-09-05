import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/workspace/approvals")({
  component: ApprovalsComponent,
});

function ApprovalsComponent() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold tracking-tight">Discount Approvals Queue</h1>
      <p className="text-muted-foreground text-sm mt-1">
        Review pending quotations requiring Sales Manager or Finance sign-off.
      </p>
    </div>
  );
}
