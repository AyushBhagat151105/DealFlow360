import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { FulfillmentPlan } from "@/lib/api-types";
import { httpClient } from "@/lib/http-client";

export function useFulfillmentPlan(quoteId: string) {
  return useQuery<FulfillmentPlan>({
    queryKey: ["fulfillment", "quote", quoteId],
    queryFn: async () => {
      const response = await httpClient.get<{ data: FulfillmentPlan }>(
        `/api/fulfillment/quotes/${quoteId}/fulfillment-split`,
      );
      return response.data.data;
    },
    enabled: Boolean(quoteId),
  });
}

export function useConfirmFulfillment(quoteId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (overrides: Array<{
      quotationLineId: string;
      warehouseId: string | null;
      quantityAllocated: number;
      quantityBackordered: number;
    }>) => {
      const response = await httpClient.post(
        `/api/fulfillment/quotes/${quoteId}/fulfillment-split/confirm`,
        { overrides },
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fulfillment", "quote", quoteId] });
    },
  });
}
