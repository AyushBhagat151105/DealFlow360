import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { httpClient } from "@/lib/http-client";
import type { CustomerTier, ProductCategory } from "@/lib/api-types";

export interface SanitizedQuoteLine {
  id: string;
  productId: string;
  productName: string;
  category: ProductCategory;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  lineSubtotal: number;
}

export interface SanitizedQuote {
  id: string;
  quoteNumber: string;
  customerName: string;
  customerTier: CustomerTier;
  notes: string;
  status: string;
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

function normalizePortalQuote(value: unknown): SanitizedQuote {
  const raw = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const customerObj = raw.customer && typeof raw.customer === "object" ? (raw.customer as Record<string, unknown>) : {};

  const customerName =
    typeof customerObj.name === "string"
      ? customerObj.name
      : typeof raw.customerName === "string"
      ? raw.customerName
      : "Valued Customer";

  const rawTier = customerObj.tier || raw.customerTier;
  const customerTier = rawTier === "GOLD" || rawTier === "SILVER" ? rawTier : "BRONZE";

  const rawLines = Array.isArray(raw.lines) ? raw.lines : [];
  const rawComments = Array.isArray(raw.comments)
    ? raw.comments
    : Array.isArray(raw.negotiationComments)
    ? raw.negotiationComments
    : [];

  const totalSubtotal =
    typeof raw.totalSubtotal === "number"
      ? raw.totalSubtotal
      : typeof raw.totalAmount === "number"
      ? raw.totalAmount
      : 0;

  return {
    id: typeof raw.id === "string" ? raw.id : "",
    quoteNumber: typeof raw.quoteNumber === "string" ? raw.quoteNumber : "",
    customerName,
    customerTier,
    notes: typeof raw.notes === "string" ? raw.notes : "",
    status: typeof raw.status === "string" ? raw.status : "",
    totalSubtotal,
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : "",
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : "",
    lines: rawLines.map((line) => {
      const item = line && typeof line === "object" ? (line as Record<string, unknown>) : {};
      const productObj = item.product && typeof item.product === "object" ? (item.product as Record<string, unknown>) : {};

      const productName =
        typeof productObj.name === "string"
          ? productObj.name
          : typeof item.productName === "string"
          ? item.productName
          : "Product / Service";

      const rawCategory = productObj.category || item.category;
      const category = rawCategory === "SERVICE" || rawCategory === "SUBSCRIPTION" ? rawCategory : "HARDWARE";

      const quantity = typeof item.quantity === "number" ? item.quantity : 0;
      const unitPrice =
        typeof item.unitPrice === "number"
          ? item.unitPrice
          : typeof item.effectivePrice === "number"
          ? item.effectivePrice
          : 0;

      const discountPercent = typeof item.discountPercent === "number" ? item.discountPercent : 0;

      const lineSubtotal =
        typeof item.lineSubtotal === "number"
          ? item.lineSubtotal
          : typeof item.subtotal === "number"
          ? item.subtotal
          : typeof item.lineTotal === "number"
          ? item.lineTotal
          : unitPrice * quantity;

      return {
        id: typeof item.id === "string" ? item.id : "",
        productId: typeof item.productId === "string" ? item.productId : "",
        productName,
        category,
        quantity,
        unitPrice,
        discountPercent,
        lineSubtotal,
      };
    }),
    comments: rawComments.map((comment) => {
      const item = comment && typeof comment === "object" ? (comment as Record<string, unknown>) : {};
      return {
        id: typeof item.id === "string" ? item.id : "",
        quotationLineId:
          typeof item.quotationLineId === "string"
            ? item.quotationLineId
            : typeof item.lineId === "string"
            ? item.lineId
            : null,
        authorName:
          typeof item.authorName === "string"
            ? item.authorName
            : typeof item.author === "string"
            ? item.author
            : "Customer",
        comment: typeof item.comment === "string" ? item.comment : "",
        createdAt: typeof item.createdAt === "string" ? item.createdAt : "",
        proposedDiscountPercent:
          typeof item.proposedDiscountPercent === "number" ? item.proposedDiscountPercent : undefined,
      };
    }),
  };
}

export function usePortalQuote(token: string) {
  return useQuery<SanitizedQuote>({
    queryKey: ["portal", "quote", token],
    queryFn: async () => {
      const response = await httpClient.get<{ data: unknown }>(
        `/api/portal/quote/${token}`,
      );
      return normalizePortalQuote(response.data.data);
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
      const response = await httpClient.post(`/api/portal/quote/${token}/comment`, data);
      return response.data;
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
      const response = await httpClient.post(`/api/portal/quote/${token}/counter`, data);
      return response.data;
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
      const response = await httpClient.post(`/api/portal/quote/${token}/confirm`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portal", "quote", token] });
    },
  });
}

export function useVerifyPortalToken(token: string) {
  return useQuery({
    queryKey: ["portal", "verify", token],
    queryFn: async () => {
      const response = await httpClient.get<{
        success?: boolean;
        data?: { valid: boolean; status?: string; quoteNumber?: string; customerName?: string };
        valid?: boolean;
        status?: string;
      }>(`/api/portal/quote/${token}/verify`);
      const payload = response.data;
      if (payload && typeof payload === "object") {
        if ("data" in payload && payload.data && typeof payload.data === "object") {
          return payload.data as { valid: boolean; status?: string; quoteNumber?: string; customerName?: string };
        }
        if ("valid" in payload) {
          return payload as { valid: boolean; status?: string; quoteNumber?: string; customerName?: string };
        }
      }
      return { valid: true };
    },
    enabled: Boolean(token),
    retry: false,
  });
}


export function useRequestMagicLink() {
  return useMutation({
    mutationFn: async (data: { email: string; quoteNumber?: string }) => {
      const response = await httpClient.post("/api/portal/magic-link", data);
      return response.data;
    },
  });
}

export function useSendPortalLink(token: string) {
  return useMutation({
    mutationFn: async (data: { recipientEmail: string; customMessage?: string }) => {
      const response = await httpClient.post(`/api/portal/quote/${token}/send`, data);
      return response.data;
    },
  });
}

