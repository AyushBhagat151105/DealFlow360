import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/workspace/fulfillment/$id")({
  component: FulfillmentComponent,
});

function FulfillmentComponent() {
  const { id } = Route.useParams();

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold tracking-tight">
        Warehouse Fulfillment Split — Quote {id}
      </h1>
      <p className="text-muted-foreground text-sm mt-1">
        Multi-warehouse inventory allocation, backorder handling, and shipment consolidation.
      </p>
    </div>
  );
}
