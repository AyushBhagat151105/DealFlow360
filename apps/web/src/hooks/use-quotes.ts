import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { httpClient } from "@/lib/http-client";
import { MOCK_QUOTES, type Quote } from "@/lib/mock-data";

export function useQuotes() {
  return useQuery<Quote[]>({
    queryKey: ["quotes"],
    queryFn: async () => {
      try {
        const response = await httpClient.get("/api/quotes");
        const items = response.data?.data ?? response.data;
        if (Array.isArray(items) && items.length > 0) {
          return items;
        }
      } catch {
        // Fallback to mock data
      }
      return MOCK_QUOTES;
    },
    initialData: MOCK_QUOTES,
  });
}

export function useQuote(id?: string) {
  return useQuery<Quote>({
    queryKey: ["quotes", id],
    queryFn: async () => {
      try {
        const response = await httpClient.get(`/api/quotes/${id}`);
        const item = response.data?.data ?? response.data;
        if (item && typeof item === "object") {
          return item as Quote;
        }
      } catch {
        // Fallback to mock data
      }
      const match = MOCK_QUOTES.find((q) => q.id === id || q.quoteNumber === id);
      return match || MOCK_QUOTES[0];
    },
    enabled: Boolean(id),
    initialData: () => MOCK_QUOTES.find((q) => q.id === id || q.quoteNumber === id) ?? MOCK_QUOTES[0],
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
