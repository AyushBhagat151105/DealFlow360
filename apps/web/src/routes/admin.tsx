import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Package,
  Users,
  Warehouse as WarehouseIcon,
  SlidersHorizontal,
  ShieldAlert,
  UserCog,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthStore } from "@/stores/auth-store";
import { useProducts, useCustomers, useWarehouses, useUsers } from "@/hooks/use-catalog";
import { ProductsTab } from "@/components/admin/products-tab";
import { CustomersTab } from "@/components/admin/customers-tab";
import { WarehousesTab } from "@/components/admin/warehouses-tab";
import { CeilingsTab } from "@/components/admin/ceilings-tab";
import { UsersTab } from "@/components/admin/users-tab";

export const Route = createFileRoute("/admin")({
  component: AdminComponent,
});

function AdminComponent() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState("products");

  const productsQuery = useProducts();
  const customersQuery = useCustomers();
  const warehousesQuery = useWarehouses();

  if (user.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-3.5rem)] gap-4 p-8 text-center">
        <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-400">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Access Restricted</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">
            The Administration panel is restricted to System Administrators. Please switch to the Admin role using the Demo Role switcher in the top bar.
          </p>
        </div>
        <Button onClick={() => window.history.back()} variant="outline">
          Go Back
        </Button>
      </div>
    );
  }

  const productsCount = productsQuery.data?.length ?? 0;
  const customersCount = customersQuery.data?.length ?? 0;
  const warehousesCount = warehousesQuery.data?.length ?? 0;
  const usersQuery = useUsers();
  const usersCount = usersQuery.data?.length ?? 0;

  return (
    <main className="min-h-full overflow-y-auto bg-background">
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs tracking-[0.08em] text-muted-foreground uppercase">
                ADMIN CONTROL CENTER
              </span>
              <Badge variant="outline" className="text-[10px] font-mono border-primary/40 text-primary">
                FULL ACCESS
              </Badge>
            </div>
            <h1 className="text-2xl font-semibold tracking-[-0.02em]">Catalog & Governance Engine</h1>
            <p className="text-sm text-muted-foreground">
              Manage product catalog items, customer tiers, warehouse facilities, inventory levels, discount ceilings, and team member roles.
            </p>
          </div>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 max-w-3xl bg-muted/60">
            <TabsTrigger value="products" className="flex items-center gap-2 text-xs">
              <Package className="h-3.5 w-3.5" />
              Products ({productsCount})
            </TabsTrigger>
            <TabsTrigger value="customers" className="flex items-center gap-2 text-xs">
              <Users className="h-3.5 w-3.5" />
              Customers ({customersCount})
            </TabsTrigger>
            <TabsTrigger value="warehouses" className="flex items-center gap-2 text-xs">
              <WarehouseIcon className="h-3.5 w-3.5" />
              Warehouses ({warehousesCount})
            </TabsTrigger>
            <TabsTrigger value="ceilings" className="flex items-center gap-2 text-xs">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Discount Rules
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2 text-xs">
              <UserCog className="h-3.5 w-3.5" />
              Users ({usersCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <ProductsTab />
          </TabsContent>
          <TabsContent value="customers">
            <CustomersTab />
          </TabsContent>
          <TabsContent value="warehouses">
            <WarehousesTab />
          </TabsContent>
          <TabsContent value="ceilings">
            <CeilingsTab />
          </TabsContent>
          <TabsContent value="users">
            <UsersTab />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
