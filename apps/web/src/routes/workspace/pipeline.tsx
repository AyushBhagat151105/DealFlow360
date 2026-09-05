import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/workspace/pipeline")({
  component: PipelineComponent,
});

function PipelineComponent() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold tracking-tight">Deal Pipeline (Kanban)</h1>
      <p className="text-muted-foreground text-sm mt-1">
        Track deal stages from draft to fulfillment and customer sign-off.
      </p>
    </div>
  );
}
