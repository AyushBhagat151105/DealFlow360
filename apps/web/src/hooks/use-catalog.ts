import { useQuery } from "@tanstack/react-query";
import { httpClient } from "@/lib/http-client";
import {
  MOCK_CUSTOMERS,
  MOCK_PRODUCTS,
  MOCK_WAREHOUSES,
  type Product,
  type Customer,
  type Warehouse,
} from "@/lib/mock-data";

export function useProducts() {
  return useQuery<Product[]>({
    queryKey: ["catalog", "products"],
    queryFn: async () => {
      try {
        const response = await httpClient.get("/api/catalog/products");
        const items = response.data?.data ?? response.data;
        if (Array.isArray(items) && items.length > 0) {
          return items;
        }
      } catch {
        // Fallback to mock data if backend not reachable
      }
      return MOCK_PRODUCTS;
    },
    initialData: MOCK_PRODUCTS,
  });
}

export function useCustomers() {
  return useQuery<Customer[]>({
    queryKey: ["catalog", "customers"],
    queryFn: async () => {
      try {
        const response = await httpClient.get("/api/catalog/customers");
        const items = response.data?.data ?? response.data;
        if (Array.isArray(items) && items.length > 0) {
          return items;
        }
      } catch {
        // Fallback to mock data if backend not reachable
      }
      return MOCK_CUSTOMERS;
    },
    initialData: MOCK_CUSTOMERS,
  });
}

export function useWarehouses() {
  return useQuery<Warehouse[]>({
    queryKey: ["catalog", "warehouses"],
    queryFn: async () => {
      try {
        const response = await httpClient.get("/api/catalog/warehouses");
        const items = response.data?.data ?? response.data;
        if (Array.isArray(items) && items.length > 0) {
          return items;
        }
      } catch {
        // Fallback to mock data if backend not reachable
      }
      return MOCK_WAREHOUSES;
    },
    initialData: MOCK_WAREHOUSES,
  });
}
