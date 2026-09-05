import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { httpClient } from "@/lib/http-client";
import type {
  CreateCustomerInput,
  CreateProductInput,
  CreateWarehouseInput,
  Customer,
  Product,
  ReplenishStockInput,
  SubscriptionPlan,
  Warehouse,
  UpdateCustomerInput,
  UserItem,
  PaginatedProductsResponse,
  PaginatedCustomersResponse,
  PaginatedUsersResponse,
} from "@/lib/api-types";

export function useProducts() {
  return useQuery<Product[]>({
    queryKey: ["catalog", "products", "all"],
    queryFn: async () => {
      const response = await httpClient.get<{ data: Product[] | PaginatedProductsResponse }>(
        "/api/catalog/products?all=true",
      );
      const data = response.data.data;
      return Array.isArray(data) ? data : data.products;
    },
  });
}

export type ProductFilters = {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  all?: boolean;
};

export function usePaginatedProducts(filters: ProductFilters = {}) {
  return useQuery<PaginatedProductsResponse>({
    queryKey: ["catalog", "products", "paginated", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.page) params.append("page", String(filters.page));
      if (filters.limit) params.append("limit", String(filters.limit));
      if (filters.search) params.append("search", filters.search);
      if (filters.category && filters.category !== "ALL") params.append("category", filters.category);
      if (filters.all) params.append("all", "true");

      const queryStr = params.toString() ? `?${params.toString()}` : "";
      const response = await httpClient.get<{ data: Product[] | PaginatedProductsResponse }>(
        `/api/catalog/products${queryStr}`,
      );
      const data = response.data.data;
      if (Array.isArray(data)) {
        return {
          products: data,
          total: data.length,
          page: 1,
          limit: data.length,
          totalPages: 1,
          hasMore: false,
        };
      }
      return data;
    },
  });
}

export function useCustomers() {
  return useQuery<Customer[]>({
    queryKey: ["catalog", "customers", "all"],
    queryFn: async () => {
      const response = await httpClient.get<{ data: Customer[] | PaginatedCustomersResponse }>(
        "/api/catalog/customers?all=true",
      );
      const data = response.data.data;
      return Array.isArray(data) ? data : data.customers;
    },
  });
}

export type CustomerFilters = {
  page?: number;
  limit?: number;
  search?: string;
  tier?: string;
  all?: boolean;
};

export function usePaginatedCustomers(filters: CustomerFilters = {}) {
  return useQuery<PaginatedCustomersResponse>({
    queryKey: ["catalog", "customers", "paginated", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.page) params.append("page", String(filters.page));
      if (filters.limit) params.append("limit", String(filters.limit));
      if (filters.search) params.append("search", filters.search);
      if (filters.tier && filters.tier !== "ALL") params.append("tier", filters.tier);
      if (filters.all) params.append("all", "true");

      const queryStr = params.toString() ? `?${params.toString()}` : "";
      const response = await httpClient.get<{ data: Customer[] | PaginatedCustomersResponse }>(
        `/api/catalog/customers${queryStr}`,
      );
      const data = response.data.data;
      if (Array.isArray(data)) {
        return {
          customers: data,
          total: data.length,
          page: 1,
          limit: data.length,
          totalPages: 1,
          hasMore: false,
        };
      }
      return data;
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

export function useSubscriptionPlans() {
  return useQuery<SubscriptionPlan[]>({
    queryKey: ["catalog", "plans"],
    queryFn: async () => {
      const response = await httpClient.get<{ data: SubscriptionPlan[] }>("/api/catalog/plans");
      return response.data.data;
    },
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateProductInput) => {
      const response = await httpClient.post<{ data: Product }>("/api/catalog/products", input);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catalog", "products"] });
    },
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateCustomerInput) => {
      const response = await httpClient.post<{ data: Customer }>("/api/catalog/customers", input);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catalog", "customers"] });
    },
  });
}

export function useCreateWarehouse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateWarehouseInput) => {
      const response = await httpClient.post<{ data: Warehouse }>("/api/catalog/warehouses", input);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catalog", "warehouses"] });
    },
  });
}

export function useReplenishStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ warehouseId, ...input }: ReplenishStockInput & { warehouseId: string }) => {
      const response = await httpClient.post(`/api/fulfillment/warehouses/${warehouseId}/replenish`, input);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catalog", "warehouses"] });
      queryClient.invalidateQueries({ queryKey: ["catalog", "products"] });
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateCustomerInput }) => {
      const response = await httpClient.patch<{ data: Customer }>(`/api/catalog/customers/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catalog", "customers"] });
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await httpClient.delete<{ data: { id: string } }>(`/api/catalog/customers/${id}`);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catalog", "customers"] });
    },
  });
}

export function useUsers() {
  return useQuery<UserItem[]>({
    queryKey: ["catalog", "users", "all"],
    queryFn: async () => {
      const response = await httpClient.get<{ data: UserItem[] | PaginatedUsersResponse }>(
        "/api/catalog/users?all=true",
      );
      const data = response.data.data;
      return Array.isArray(data) ? data : data.users;
    },
  });
}

export type UserFilters = {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  all?: boolean;
};

export function usePaginatedUsers(filters: UserFilters = {}) {
  return useQuery<PaginatedUsersResponse>({
    queryKey: ["catalog", "users", "paginated", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.page) params.append("page", String(filters.page));
      if (filters.limit) params.append("limit", String(filters.limit));
      if (filters.search) params.append("search", filters.search);
      if (filters.role && filters.role !== "ALL") params.append("role", filters.role);
      if (filters.all) params.append("all", "true");

      const queryStr = params.toString() ? `?${params.toString()}` : "";
      const response = await httpClient.get<{ data: UserItem[] | PaginatedUsersResponse }>(
        `/api/catalog/users${queryStr}`,
      );
      const data = response.data.data;
      if (Array.isArray(data)) {
        return {
          users: data,
          total: data.length,
          page: 1,
          limit: data.length,
          totalPages: 1,
          hasMore: false,
        };
      }
      return data;
    },
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      const response = await httpClient.patch<{ data: UserItem }>(`/api/catalog/users/${id}/role`, { role });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catalog", "users"] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await httpClient.delete<{ data: { id: string } }>(`/api/catalog/users/${id}`);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catalog", "users"] });
    },
  });
}
