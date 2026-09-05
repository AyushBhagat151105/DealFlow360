import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { BillingSummary, InvoicesListResponse, InvoiceListItem } from "@/lib/api-types";
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
      queryClient.invalidateQueries({ queryKey: ["billing", "invoices"] });
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

export type InvoicesFilterParams = {
  status?: string;
  type?: string;
  customerId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
};

export function useInvoices(filters: InvoicesFilterParams = {}) {
  return useQuery<InvoicesListResponse>({
    queryKey: ["billing", "invoices", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.status && filters.status !== "ALL") params.append("status", filters.status);
      if (filters.type && filters.type !== "ALL") params.append("type", filters.type);
      if (filters.customerId) params.append("customerId", filters.customerId);
      if (filters.search) params.append("search", filters.search);
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);
      if (filters.limit) params.append("limit", String(filters.limit));
      if (filters.offset) params.append("offset", String(filters.offset));

      const queryString = params.toString() ? `?${params.toString()}` : "";
      const response = await httpClient.get<{ data: InvoicesListResponse }>(
        `/api/billing/invoices${queryString}`,
      );
      return response.data.data;
    },
  });
}

export function useInvoiceDetails(id: string) {
  return useQuery<InvoiceListItem>({
    queryKey: ["billing", "invoice", id],
    queryFn: async () => {
      const response = await httpClient.get<{ data: InvoiceListItem }>(
        `/api/billing/invoices/${id}`,
      );
      return response.data.data;
    },
    enabled: Boolean(id),
  });
}
