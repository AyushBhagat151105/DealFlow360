import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { httpClient } from "@/lib/http-client";
import type { DealHealthOverview, SalesReportItem, QuoteStatus, ProductCategory } from "@/lib/api-types";

export function useDealHealthOverview() {
  return useQuery<DealHealthOverview>({
    queryKey: ["deal-health", "overview"],
    queryFn: async () => {
      const response = await httpClient.get<{ data: DealHealthOverview }>(
        "/api/deal-health/overview"
      );
      return response.data.data;
    },
  });
}

export function useNudgeDealRep() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (alertId: string) => {
      const response = await httpClient.post<{ message?: string }>(
        `/api/deal-health/alerts/${alertId}/nudge`
      );
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
    mutationFn: async (
      payload: string | { alertId: string; targetRole?: string }
    ) => {
      const alertId = typeof payload === "string" ? payload : payload.alertId;
      const targetRole = typeof payload === "string" ? "VP_SALES" : payload.targetRole ?? "VP_SALES";
      const response = await httpClient.post<{ message?: string }>(
        `/api/deal-health/alerts/${alertId}/escalate`,
        { targetRole }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deal-health", "overview"] });
    },
  });
}


export type SalesReportFilters = {
  startDate?: string;
  endDate?: string;
  repUserId?: string;
  status?: QuoteStatus;
  category?: ProductCategory;
};

export function useSalesReport(filters: SalesReportFilters = {}) {
  return useQuery<SalesReportItem[]>({
    queryKey: ["deal-health", "reports", "sales", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);
      if (filters.repUserId) params.append("repUserId", filters.repUserId);
      if (filters.status) params.append("status", filters.status);
      if (filters.category) params.append("category", filters.category);

      const queryString = params.toString() ? `?${params.toString()}` : "";
      const response = await httpClient.get<{ data: SalesReportItem[] }>(
        `/api/deal-health/reports/sales${queryString}`
      );
      return response.data.data;
    },
  });
}
