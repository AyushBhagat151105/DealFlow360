import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { httpClient } from "@/lib/http-client";
import type { Quote, QuotePreview } from "@/lib/api-types";
import { normalizeQuote, normalizeQuotes } from "@/lib/api-mappers";

export function useQuotes() {
  return useQuery<Quote[]>({
    queryKey: ["quotes"],
    queryFn: async () => {
      const response = await httpClient.get<{ data: unknown }>("/api/quotes");
      return normalizeQuotes(response.data.data);
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
