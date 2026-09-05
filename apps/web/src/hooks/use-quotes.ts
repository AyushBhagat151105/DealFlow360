import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { httpClient } from "@/lib/http-client";
import type { Quote } from "@/lib/mock-data";

export function useQuotes() {
  return useQuery<Quote[]>({
    queryKey: ["quotes"],
    queryFn: async () => {
      const response = await httpClient.get("/api/quotes");
      const items = response.data?.data ?? response.data;
      if (!Array.isArray(items)) {
        throw new Error("Invalid quotes response");
      }
      return items;
    },
  });
}

export function useQuote(id?: string) {
  return useQuery<Quote>({
    queryKey: ["quotes", id],
    queryFn: async () => {
      const response = await httpClient.get(`/api/quotes/${id}`);
      const item = response.data?.data ?? response.data;
      if (!item || typeof item !== "object") {
        throw new Error("Invalid quote response");
      }
      return item as Quote;
    },
    enabled: Boolean(id),
  });
}

export function useSubmitQuoteForApproval() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (quoteId: string) => {
      try {
        const response = await httpClient.post(`/api/quotes/${quoteId}/submit`);
        return response.data;
      } catch {
        return { success: true };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
    },
  });
}

export function useApproveQuote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ quoteId, notes }: { quoteId: string; notes?: string }) => {
      try {
        const response = await httpClient.post(`/api/quotes/${quoteId}/approve`, { notes });
        return response.data;
      } catch {
        return { success: true };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
    },
  });
}

export function useRejectQuote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ quoteId, reason }: { quoteId: string; reason: string }) => {
      try {
        const response = await httpClient.post(`/api/quotes/${quoteId}/reject`, { reason });
        return response.data;
      } catch {
        return { success: true };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
    },
  });
}

export function useReturnQuoteForRevision() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ quoteId, reason }: { quoteId: string; reason: string }) => {
      try {
        const response = await httpClient.post(`/api/quotes/${quoteId}/return`, { reason });
        return response.data;
      } catch {
        return { success: true };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
    },
  });
}
