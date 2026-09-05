import { useQuery } from "@tanstack/react-query";
import { httpClient } from "@/lib/http-client";
import {
  MOCK_PRODUCTS,
  MOCK_CUSTOMERS,
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
        if (response.data?.success && Array.isArray(response.data.data)) {
          return response.data.data;
        }
        return MOCK_PRODUCTS;
      } catch {
        return MOCK_PRODUCTS;
      }
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
        if (response.data?.success && Array.isArray(response.data.data)) {
          return response.data.data;
        }
        return MOCK_CUSTOMERS;
      } catch {
        return MOCK_CUSTOMERS;
      }
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
        if (response.data?.success && Array.isArray(response.data.data)) {
          return response.data.data;
        }
        return MOCK_WAREHOUSES;
      } catch {
        return MOCK_WAREHOUSES;
      }
    },
    initialData: MOCK_WAREHOUSES,
  });
}
