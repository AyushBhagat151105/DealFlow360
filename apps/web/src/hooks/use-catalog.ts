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
} from "@/lib/api-types";

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
    queryKey: ["catalog", "users"],
    queryFn: async () => {
      const response = await httpClient.get<{ data: UserItem[] }>("/api/catalog/users");
      return response.data.data;
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
