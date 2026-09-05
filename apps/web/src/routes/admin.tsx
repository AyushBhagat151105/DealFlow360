import { createFileRoute } from "@tanstack/react-router";
import { RefreshCw, Settings2 } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCeilingMatrix } from "@/hooks/use-admin-config";
import type { CeilingConfig } from "@/hooks/use-admin-config";

export const Route = createFileRoute("/admin")({
  component: AdminComponent,
});

function AdminComponent() {
  const matrixQuery = useCeilingMatrix();

  if (matrixQuery.isLoading) return <PageState label="Loading configuration" />;
  if (matrixQuery.isError || !matrixQuery.data) return <PageState label="Configuration is unavailable" action={<Button onClick={() => matrixQuery.refetch()}>Try again</Button>} />;

  return (
    <main className="min-h-full overflow-y-auto bg-background">
      <div className="mx-auto max-w-5xl space-y-6 p-6">
        <header className="space-y-2">
          <p className="font-mono text-xs tracking-[0.08em] text-muted-foreground">SETTINGS</p>
          <h1 className="text-2xl font-semibold tracking-[-0.02em]">Discount rules</h1>
          <p className="text-sm text-muted-foreground">Review the limits used when quotes are checked for approval.</p>
        </header>

        <RuleTable title="Customer limits" rows={matrixQuery.data.customerTiers} nameKey="tier" valueKey="defaultDiscountCeiling" />
        <RuleTable title="Product limits" rows={matrixQuery.data.productCategories} nameKey="category" valueKey="maxDiscountCeiling" />
      </div>
    </main>
  );
}

function RuleTable({ title, rows, nameKey, valueKey }: { title: string; rows: CeilingConfig[]; nameKey: "tier" | "category"; valueKey: "defaultDiscountCeiling" | "maxDiscountCeiling" }) {
  return (
    <Card className="rounded-lg border-border bg-card shadow-none">
      <CardHeader className="border-b border-border"><CardTitle className="flex items-center gap-2 text-base"><Settings2 className="h-4 w-4 text-primary" />{title}</CardTitle></CardHeader>
      <CardContent className="p-0">
        {rows.length === 0 ? <p className="p-8 text-sm text-muted-foreground">No rules returned by the API.</p> : <div className="divide-y divide-border">{rows.map((row, index) => <div key={`${String(row[nameKey])}-${index}`} className="flex items-center justify-between p-4"><span className="text-sm font-medium">{String(row[nameKey] ?? "Unknown")}</span><span className="font-mono text-sm">{String(row[valueKey] ?? 0)}%</span></div>)}</div>}
      </CardContent>
    </Card>
  );
}

function PageState({ label, action }: { label: string; action?: ReactNode }) { return <main className="flex min-h-full items-center justify-center bg-background p-6"><div className="space-y-4 text-center"><RefreshCw className="mx-auto h-5 w-5 text-primary" /><p className="text-sm text-muted-foreground">{label}</p>{action}</div></main>; }
