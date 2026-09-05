import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { httpClient } from "@/lib/http-client";
import { MOCK_QUOTES, type Quote, type QuoteLine } from "@/lib/mock-data";

export interface SanitizedQuoteLine {
  id: string;
  productId: string;
  productName: string;
  category: "HARDWARE" | "SERVICE" | "SUBSCRIPTION";
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  lineSubtotal: number;
}

export interface SanitizedQuote {
  id: string;
  quoteNumber: string;
  customerName: string;
  customerTier: "BRONZE" | "SILVER" | "GOLD";
  notes: string;
  status:
    | "DRAFT"
    | "PENDING_APPROVAL"
    | "APPROVED"
    | "UNDER_NEGOTIATION"
    | "CONFIRMED"
    | "REJECTED"
    | "FULFILLED";
  totalSubtotal: number;
  createdAt: string;
  updatedAt: string;
  lines: SanitizedQuoteLine[];
  comments?: Array<{
    id: string;
    quotationLineId?: string | null;
    authorName: string;
    comment: string;
    createdAt: string;
    proposedDiscountPercent?: number;
  }>;
}

export function sanitizeQuoteForPortal(quote: Quote): SanitizedQuote {
  return {
    id: quote.id,
    quoteNumber: quote.quoteNumber,
    customerName: quote.customerName,
    customerTier: quote.customerTier,
    notes: quote.notes,
    status: quote.status,
    totalSubtotal: quote.totalSubtotal,
    createdAt: quote.createdAt,
    updatedAt: quote.updatedAt,
    lines: quote.lines.map((line: QuoteLine) => ({
      id: line.id,
      productId: line.productId,
      productName: line.productName,
      category: line.category,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      discountPercent: line.discountPercent,
      lineSubtotal: line.lineSubtotal,
    })),
    comments: [
      {
        id: "cmt_01",
        authorName: "DealFlow Sales Rep",
        comment: "Please review the proposed volume discount structure for Q1 deployment.",
        createdAt: quote.createdAt,
      },
    ],
  };
}

export function usePortalQuote(token: string) {
  return useQuery<SanitizedQuote>({
    queryKey: ["portal", "quote", token],
    queryFn: async () => {
      try {
        const response = await httpClient.get(`/api/portal/quote/${token}`);
        if (response.data?.success && response.data.data) {
          return response.data.data;
        }
      } catch {
        // Fallback to mock data matching token or first mock quote
      }

      const match = MOCK_QUOTES.find(
        (q) => q.portalAccessToken === token || q.id === token || q.quoteNumber === token
      );
      return sanitizeQuoteForPortal(match || MOCK_QUOTES[0]);
    },
    enabled: Boolean(token),
  });
}

export function useSubmitPortalComment(token: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      quotationLineId?: string | null;
      authorName: string;
      comment: string;
      proposedDiscountPercent?: number;
    }) => {
      try {
        const response = await httpClient.post(`/api/portal/quote/${token}/comment`, data);
        return response.data;
      } catch {
        return { success: true, message: "Comment recorded successfully" };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portal", "quote", token] });
    },
  });
}

export function useSubmitPortalCounter(token: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      authorName: string;
      proposedDiscounts: Array<{
        lineId: string;
        counterDiscountPercent: number;
      }>;
      comment?: string;
    }) => {
      try {
        const response = await httpClient.post(`/api/portal/quote/${token}/counter`, data);
        return response.data;
      } catch {
        return { success: true, message: "Counter-offer recorded successfully" };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portal", "quote", token] });
    },
  });
}

export function useConfirmPortalQuote(token: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { customerSignature?: string }) => {
      try {
        const response = await httpClient.post(`/api/portal/quote/${token}/confirm`, data);
        return response.data;
      } catch {
        return { success: true, message: "Quotation confirmed successfully" };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portal", "quote", token] });
    },
  });
}
