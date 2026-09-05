import { ShieldAlert, Percent } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useCeilingMatrix,
  useUpdateCategoryCeiling,
  useUpdateCustomerTierCeiling,
} from "@/hooks/use-admin-config";

export function CeilingsTab() {
  const ceilingsQuery = useCeilingMatrix();
  const updateTierCeilingMutation = useUpdateCustomerTierCeiling();
  const updateCategoryCeilingMutation = useUpdateCategoryCeiling();

  const ceilings = ceilingsQuery.data;

  const handleUpdateTierCeiling = async (tier: string, currentCeiling: number) => {
    const next = prompt(`Enter new discount ceiling % for ${tier} tier:`, String(currentCeiling));
    if (next === null) return;
    const val = parseFloat(next);
    if (isNaN(val) || val < 0 || val > 100) {
      toast.error("Invalid percentage (0-100)");
      return;
    }
    try {
      await updateTierCeilingMutation.mutateAsync({ tier, ceilingPercent: val });
      toast.success(`Updated ${tier} discount ceiling to ${val}%`);
    } catch {
      toast.error("Failed to update tier ceiling");
    }
  };

  const handleUpdateCategoryCeiling = async (category: string, currentCeiling: number) => {
    const next = prompt(`Enter max discount ceiling % for ${category} category:`, String(currentCeiling));
    if (next === null) return;
    const val = parseFloat(next);
    if (isNaN(val) || val < 0 || val > 100) {
      toast.error("Invalid percentage (0-100)");
      return;
    }
    try {
      await updateCategoryCeilingMutation.mutateAsync({ category, ceilingPercent: val });
      toast.success(`Updated ${category} category ceiling to ${val}%`);
    } catch {
      toast.error("Failed to update category ceiling");
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="rounded-lg border-border bg-card shadow-none">
        <CardHeader className="border-b border-border">
          <CardTitle className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-amber-500" />
              Customer Tier Discount Ceilings
            </span>
            <Badge variant="outline" className="text-[10px]">
              Auto-Calculated
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 divide-y divide-border">
          {ceilings?.customerTiers.map((t, idx) => (
            <div key={`${t.tier}-${idx}`} className="flex items-center justify-between p-4">
              <div className="space-y-0.5">
                <span className="text-sm font-semibold">{t.tier} Tier</span>
                <p className="text-[11px] text-muted-foreground">
                  Default Rep discount ceiling limit
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-bold text-amber-500">
                  {t.defaultDiscountCeiling}%
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleUpdateTierCeiling(t.tier!, t.defaultDiscountCeiling ?? 5)}
                  className="h-7 text-xs font-mono"
                >
                  Edit
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="rounded-lg border-border bg-card shadow-none">
        <CardHeader className="border-b border-border">
          <CardTitle className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <Percent className="h-4 w-4 text-indigo-500" />
              Product Category Ceilings
            </span>
            <Badge variant="outline" className="text-[10px]">
              Governance
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 divide-y divide-border">
          {ceilings?.productCategories.map((c, idx) => (
            <div key={`${c.category}-${idx}`} className="flex items-center justify-between p-4">
              <div className="space-y-0.5">
                <span className="text-sm font-semibold">
                  {c.category?.replaceAll("_", " ")}
                </span>
                <p className="text-[11px] text-muted-foreground">
                  Maximum ceiling allowed for category
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-bold text-indigo-500">
                  {c.maxDiscountCeiling}%
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleUpdateCategoryCeiling(c.category!, c.maxDiscountCeiling ?? 15)}
                  className="h-7 text-xs font-mono"
                >
                  Edit
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

