import { useState } from "react";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { Customer } from "@/lib/api-types";

export const TIER_BADGE_STYLES: Record<string, string> = {
  GOLD: "bg-highlighter-yellow text-forest-ink border-highlighter-yellow/60",
  SILVER: "bg-whisper-gray text-forest-ink/70 border-pencil-gray/40",
  BRONZE: "bg-terracotta/10 text-terracotta border-terracotta/30",
};

type CustomerSelectorProps = {
  customers: Customer[];
  selected: Customer | null;
  onSelect: (c: Customer) => void;
};

export function CustomerSelector({
  customers,
  selected,
  onSelect,
}: CustomerSelectorProps) {
  const [search, setSearch] = useState("");
  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search customers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8 h-8 text-xs"
        />
      </div>
      <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
        {filtered.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onSelect(c)}
            className={`w-full text-left p-2.5 rounded-none border text-xs transition-colors cursor-pointer ${
              selected?.id === c.id
                ? "border-primary/60 bg-primary/5"
                : "border-border hover:border-border/80 hover:bg-muted/40 bg-card"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground">{c.name}</span>
              <Badge className={`text-[10px] px-1.5 py-0 border ${TIER_BADGE_STYLES[c.tier]}`}>
                {c.tier}
              </Badge>
            </div>
            <div className="flex items-center gap-3 mt-1 text-muted-foreground">
              <span>{c.contactName}</span>
              <span className="font-mono">Discount ceiling: {c.allowedDiscountCeiling}%</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
