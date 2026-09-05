import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { BillingSummary } from "@/lib/api-types";
import { httpClient } from "@/lib/http-client";

export function useQuoteBilling(quoteId: string) {
  return useQuery<BillingSummary>({
    queryKey: ["billing", "quote", quoteId],
    queryFn: async () => {
      const response = await httpClient.get<{ data: BillingSummary }>(
        `/api/billing/quotes/${quoteId}`,
      );
      return response.data.data;
    },
    enabled: Boolean(quoteId),
  });
}

export function useGenerateBilling(quoteId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await httpClient.post(`/api/billing/quotes/${quoteId}/generate`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing", "quote", quoteId] });
    },
  });
}

export function useRecordPayment(quoteId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      invoiceId,
      amount,
      paymentMethod,
      reference,
    }: {
      invoiceId: string;
      amount: number;
      paymentMethod: "CREDIT_CARD" | "WIRE_TRANSFER" | "CASH";
      reference?: string;
    }) => {
      const response = await httpClient.post(`/api/billing/invoices/${invoiceId}/payment`, {
        amount,
        paymentMethod,
        reference,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing", "quote", quoteId] });
    },
  });
}

export function useModifySubscriptionSeats(quoteId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ contractId, newSeatCount }: { contractId: string; newSeatCount: number }) => {
      const response = await httpClient.post(
        `/api/billing/subscriptions/${contractId}/modify-seats`,
        { newSeatCount },
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing", "quote", quoteId] });
    },
  });
}
