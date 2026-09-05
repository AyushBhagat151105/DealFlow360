import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { httpClient } from "@/lib/http-client";

export interface CeilingConfig {
  tier?: string;
  category?: string;
  defaultDiscountCeiling?: number;
  maxDiscountCeiling?: number;
}

interface CeilingMatrix {
  customerTiers: CeilingConfig[];
  productCategories: CeilingConfig[];
}

export function useCeilingMatrix() {
  return useQuery<CeilingMatrix>({
    queryKey: ["admin", "ceilings"],
    queryFn: async () => {
      const response = await httpClient.get<{ data: CeilingMatrix }>("/api/catalog/ceilings");
      return response.data.data;
    },
  });
}

export function useUpdateCustomerTierCeiling() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tier, ceilingPercent }: { tier: string; ceilingPercent: number }) => {
      const response = await httpClient.patch(`/api/catalog/ceilings/customer-tier/${tier}`, {
        ceilingPercent,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "ceilings"] });
    },
  });
}

export function useUpdateCategoryCeiling() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ category, ceilingPercent }: { category: string; ceilingPercent: number }) => {
      const response = await httpClient.patch(`/api/catalog/ceilings/category/${category}`, {
        ceilingPercent,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "ceilings"] });
    },
  });
}
