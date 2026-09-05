import { useQuery } from "@tanstack/react-query";
import { httpClient } from "@/lib/http-client";
import type { Product, Customer, Warehouse } from "@/lib/mock-data";

export function useProducts() {
  return useQuery<Product[]>({
    queryKey: ["catalog", "products"],
    queryFn: async () => {
      const response = await httpClient.get("/api/catalog/products");
      const items = response.data?.data ?? response.data;
      if (!Array.isArray(items)) {
        throw new Error("Invalid products response");
      }
      return items;
    },
  });
}

export function useCustomers() {
  return useQuery<Customer[]>({
    queryKey: ["catalog", "customers"],
    queryFn: async () => {
      const response = await httpClient.get("/api/catalog/customers");
      const items = response.data?.data ?? response.data;
      if (!Array.isArray(items)) {
        throw new Error("Invalid customers response");
      }
      return items;
    },
  });
}

export function useWarehouses() {
  return useQuery<Warehouse[]>({
    queryKey: ["catalog", "warehouses"],
    queryFn: async () => {
      const response = await httpClient.get("/api/catalog/warehouses");
      const items = response.data?.data ?? response.data;
      if (!Array.isArray(items)) {
        throw new Error("Invalid warehouses response");
      }
      return items;
    },
  });
}
