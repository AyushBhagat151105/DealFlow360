import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { DealHealthOverview } from "@/lib/api-types";
import { httpClient } from "@/lib/http-client";

export function useDealHealthOverview() {
  return useQuery<DealHealthOverview>({
    queryKey: ["deal-health", "overview"],
    queryFn: async () => {
      const response = await httpClient.get<{ data: DealHealthOverview }>(
        "/api/deal-health/overview",
      );
      return response.data.data;
    },
  });
}

export function useNudgeDealRep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alertId: string) => {
      const response = await httpClient.post(`/api/deal-health/alerts/${alertId}/nudge`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deal-health", "overview"] });
    },
  });
}

export function useEscalateDealAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alertId: string) => {
      const response = await httpClient.post(`/api/deal-health/alerts/${alertId}/escalate`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deal-health", "overview"] });
    },
  });
}