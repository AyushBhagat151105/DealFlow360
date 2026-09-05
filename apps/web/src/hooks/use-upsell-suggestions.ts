import { useQuery } from "@tanstack/react-query";
import { httpClient } from "@/lib/http-client";
import type { UpsellSuggestion } from "@/lib/api-types";

export function useUpsellSuggestions(quoteId?: string) {
  return useQuery<UpsellSuggestion[]>({
    queryKey: ["quotes", quoteId, "upsell-suggestions"],
    queryFn: async () => {
      if (!quoteId) return [];
      const response = await httpClient.get<{ data: UpsellSuggestion[] }>(
        `/api/quotes/${quoteId}/upsell-suggestions`,
      );
      return response.data.data;
    },
    enabled: Boolean(quoteId),
  });
}
