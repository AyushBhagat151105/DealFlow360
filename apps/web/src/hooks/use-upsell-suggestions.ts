import { useQuery } from "@tanstack/react-query";
import { httpClient } from "@/lib/http-client";
import { MOCK_UPSELL_SUGGESTIONS, type UpsellSuggestion } from "@/lib/mock-data";

export function useUpsellSuggestions(quoteId?: string) {
  return useQuery<UpsellSuggestion[]>({
    queryKey: ["quotes", quoteId, "upsell-suggestions"],
    queryFn: async () => {
      if (!quoteId) return MOCK_UPSELL_SUGGESTIONS;
      try {
        const response = await httpClient.get(`/api/quotes/${quoteId}/upsell-suggestions`);
        if (response.data?.success && Array.isArray(response.data.data)) {
          return response.data.data;
        }
        return MOCK_UPSELL_SUGGESTIONS;
      } catch {
        return MOCK_UPSELL_SUGGESTIONS;
      }
    },
    initialData: MOCK_UPSELL_SUGGESTIONS,
  });
}
