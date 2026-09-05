import { useQuery } from "@tanstack/react-query";
import { httpClient } from "@/lib/http-client";
import type { Customer, Product, Warehouse } from "@/lib/api-types";

export function useProducts() {
  return useQuery<Product[]>({
    queryKey: ["catalog", "products"],
    queryFn: async () => {
      const response = await httpClient.get<{ data: Product[] }>("/api/catalog/products");
      return response.data.data;
    },
  });
}

export function useCustomers() {
  return useQuery<Customer[]>({
    queryKey: ["catalog", "customers"],
    queryFn: async () => {
      const response = await httpClient.get<{ data: Customer[] }>("/api/catalog/customers");
      return response.data.data;
    },
  });
}

export function useWarehouses() {
  return useQuery<Warehouse[]>({
    queryKey: ["catalog", "warehouses"],
    queryFn: async () => {
      const response = await httpClient.get<{ data: Warehouse[] }>("/api/catalog/warehouses");
      return response.data.data;
    },
  });
}
