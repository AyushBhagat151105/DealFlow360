import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { httpClient } from "@/lib/http-client";
import type { Quote, QuotePreview, PaginatedQuotesResponse } from "@/lib/api-types";
import { normalizeQuote, normalizeQuotes, normalizePaginatedQuotes } from "@/lib/api-mappers";

export type QuoteFilters = {
  status?: string;
  customerId?: string;
  repUserId?: string;
  search?: string;
  page?: number;
  limit?: number;
  offset?: number;
  all?: boolean;
};

export function useQuotes(filters: QuoteFilters = {}) {
  return useQuery<Quote[]>({
    queryKey: ["quotes", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.status && filters.status !== "ALL") params.append("status", filters.status);
      if (filters.customerId) params.append("customerId", filters.customerId);
      if (filters.repUserId) params.append("repUserId", filters.repUserId);
      if (filters.search) params.append("search", filters.search);
      if (filters.page) params.append("page", String(filters.page));
      if (filters.limit) params.append("limit", String(filters.limit));
      if (filters.all) params.append("all", "true");

      const queryStr = params.toString() ? `?${params.toString()}` : "";
      const response = await httpClient.get<{ data: unknown }>(`/api/quotes${queryStr}`);
      return normalizeQuotes(response.data.data);
    },
  });
}

export function usePaginatedQuotes(filters: QuoteFilters = {}) {
  return useQuery<PaginatedQuotesResponse>({
    queryKey: ["quotes", "paginated", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.status && filters.status !== "ALL") params.append("status", filters.status);
      if (filters.customerId) params.append("customerId", filters.customerId);
      if (filters.repUserId) params.append("repUserId", filters.repUserId);
      if (filters.search) params.append("search", filters.search);
      if (filters.page) params.append("page", String(filters.page));
      if (filters.limit) params.append("limit", String(filters.limit));
      if (filters.all) params.append("all", "true");

      const queryStr = params.toString() ? `?${params.toString()}` : "";
      const response = await httpClient.get<{ data: unknown }>(`/api/quotes${queryStr}`);
      return normalizePaginatedQuotes(response.data.data);
    },
  });
}

export function useQuote(id?: string) {
  return useQuery<Quote>({
    queryKey: ["quotes", id],
    queryFn: async () => {
      const response = await httpClient.get<{ data: unknown }>(`/api/quotes/${id}`);
      return normalizeQuote(response.data.data);
    },
    enabled: Boolean(id),
  });
}

export function useQuotePreview() {
  return useMutation({
    mutationFn: async (payload: {
      customerId: string;
      lines: Array<{
        productId: string;
        variantId?: string | null;
        subscriptionPlanId?: string | null;
        quantity: number;
        unitPrice: number;
        discountPercent: number;
      }>;
    }) => {
      const response = await httpClient.post<{ data: QuotePreview }>(
        "/api/quotes/calculate-preview",
        payload,
      );
      return response.data.data;
    },
  });
}

export function useCreateQuote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      customerId: string;
      notes?: string;
      deliveryPromiseDate?: string | null;
      lines: Array<{
        productId: string;
        variantId?: string | null;
        subscriptionPlanId?: string | null;
        quantity: number;
        unitPrice: number;
        discountPercent: number;
      }>;
    }) => {
      const response = await httpClient.post<{ data: Quote }>("/api/quotes", payload);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
    },
  });
}

export function useSubmitQuoteForApproval() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      quoteId,
      actorName,
      actorRole,
    }: {
      quoteId: string;
      actorName?: string;
      actorRole?: string;
    }) => {
      const response = await httpClient.post(`/api/quotes/${quoteId}/submit-approval`, {
        actorName,
        actorRole,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
    },
  });
}

export function useApproveQuote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ quoteId, notes, actorName, actorRole }: { quoteId: string; notes?: string; actorName?: string; actorRole?: "manager" | "finance" | "admin" }) => {
      const response = await httpClient.post(`/api/quotes/${quoteId}/review`, {
        action: actorRole === "finance" ? "APPROVE_FINANCE" : "APPROVE_MANAGER",
        reason: notes,
        actorName,
        actorRole,
      });
      return response.data;
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
      const response = await httpClient.post(`/api/quotes/${quoteId}/review`, {
        action: "REJECT",
        reason,
      });
      return response.data;
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
      const response = await httpClient.post(`/api/quotes/${quoteId}/review`, {
        action: "RETURN_FOR_REVISION",
        reason,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
    },
  });
}
