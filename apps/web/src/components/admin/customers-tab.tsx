import { useState, useMemo } from "react";
import { Search, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TablePagination } from "@/components/ui/pagination";
import {
  usePaginatedCustomers,
  useCreateCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
} from "@/hooks/use-catalog";
import type { Customer, CustomerTier } from "@/lib/api-types";
import { TIER_STYLES } from "./admin-utils";

export function CustomersTab() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");

  const customersQuery = usePaginatedCustomers({
    page,
    limit: pageSize,
    search: search || undefined,
  });
  const createCustomerMutation = useCreateCustomer();
  const updateCustomerMutation = useUpdateCustomer();
  const deleteCustomerMutation = useDeleteCustomer();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerContact, setCustomerContact] = useState("");
  const [customerCompany, setCustomerCompany] = useState("");
  const [customerTier, setCustomerTier] = useState<CustomerTier>("BRONZE");

  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editContact, setEditContact] = useState("");
  const [editTier, setEditTier] = useState<CustomerTier>("BRONZE");

  const [deletingCustomerId, setDeletingCustomerId] = useState<string | null>(null);

  const paginatedData = customersQuery.data;
  const customers = paginatedData?.customers ?? [];

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerEmail) {
      toast.error("Name and Email are required");
      return;
    }

    try {
      await createCustomerMutation.mutateAsync({
        name: customerName,
        email: customerEmail,
        contactName: customerContact || customerName,
        company: customerCompany || customerName,
        tier: customerTier,
      });
      toast.success(`Customer "${customerName}" added to ${customerTier} tier`);
      setDialogOpen(false);
      setCustomerName("");
      setCustomerEmail("");
      setCustomerContact("");
      setCustomerCompany("");
    } catch {
      toast.error("Failed to create customer");
    }
  };

  const openEditDialog = (c: Customer) => {
    setEditingCustomer(c);
    setEditName(c.name);
    setEditEmail(c.email);
    setEditContact(c.contactName || "");
    setEditTier(c.tier);
  };

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;

    try {
      await updateCustomerMutation.mutateAsync({
        id: editingCustomer.id,
        data: {
          name: editName,
          email: editEmail,
          contactName: editContact,
          tier: editTier,
        },
      });
      toast.success(`Customer "${editName}" updated successfully`);
      setEditingCustomer(null);
    } catch {
      toast.error("Failed to update customer");
    }
  };

  const handleDeleteCustomer = async (id: string, name: string) => {
    try {
      await deleteCustomerMutation.mutateAsync(id);
      toast.success(`Customer "${name}" deleted`);
      setDeletingCustomerId(null);
    } catch {
      toast.error("Cannot delete customer with associated quotations");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search customer account or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-8 h-9 text-xs"
          />
        </div>

        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Customer Account
        </Button>
      </div>

      <Card className="rounded-lg border-border bg-card shadow-none overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="text-xs">Account / Company</TableHead>
              <TableHead className="text-xs">Contact Person</TableHead>
              <TableHead className="text-xs">Email</TableHead>
              <TableHead className="text-xs">Customer Tier</TableHead>
              <TableHead className="text-xs text-right">Discount Ceiling</TableHead>
              <TableHead className="text-xs text-right">Historical Avg Discount</TableHead>
              <TableHead className="text-xs text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customersQuery.isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-sm text-muted-foreground">
                  Loading customer accounts...
                </TableCell>
              </TableRow>
            ) : customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-sm text-muted-foreground">
                  No customers found.
                </TableCell>
              </TableRow>
            ) : (
              customers.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium text-xs">
                    <div>
                      <p className="font-semibold">{c.name}</p>
                      {c.company && c.company !== c.name && (
                        <p className="text-[11px] text-muted-foreground">{c.company}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{c.contactName || c.name}</TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground">{c.email}</TableCell>
                  <TableCell>
                    <Badge className={`text-[10px] px-1.5 py-0 border ${TIER_STYLES[c.tier]}`}>
                      {c.tier}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs font-semibold">
                    {c.allowedDiscountCeiling ?? 5}%
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs text-muted-foreground">
                    {c.historicalAvgDiscount ? `${c.historicalAvgDiscount.toFixed(1)}%` : "N/A"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={() => openEditDialog(c)}
                        title="Edit Customer"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:bg-destructive/10"
                        onClick={() => setDeletingCustomerId(c.id)}
                        title="Delete Customer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          page={page}
          pageSize={pageSize}
          total={paginatedData?.total ?? 0}
          totalPages={paginatedData?.totalPages ?? 1}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleCreateCustomer}>
            <DialogHeader>
              <DialogTitle className="text-base">Add Customer Account</DialogTitle>
              <DialogDescription className="text-xs">
                Create a customer profile and assign a discount tier ceiling.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 py-4 text-xs">
              <div className="space-y-1">
                <Label htmlFor="c-name">Account / Company Name *</Label>
                <Input
                  id="c-name"
                  placeholder="Acme Corporation"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="text-xs h-8"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="c-email">Contact Email *</Label>
                <Input
                  id="c-email"
                  type="email"
                  placeholder="procurement@acme.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="font-mono text-xs h-8"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="c-contact">Contact Person Name</Label>
                  <Input
                    id="c-contact"
                    placeholder="Jane Doe"
                    value={customerContact}
                    onChange={(e) => setCustomerContact(e.target.value)}
                    className="text-xs h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="c-tier">Customer Tier *</Label>
                  <select
                    id="c-tier"
                    value={customerTier}
                    onChange={(e) => setCustomerTier(e.target.value as CustomerTier)}
                    className="w-full h-8 px-2 text-xs bg-card border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="GOLD">GOLD (Highest Ceiling)</option>
                    <option value="SILVER">SILVER</option>
                    <option value="BRONZE">BRONZE</option>
                    <option value="STANDARD">STANDARD</option>
                  </select>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={createCustomerMutation.isPending}>
                {createCustomerMutation.isPending ? "Adding..." : "Save Customer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editingCustomer)} onOpenChange={(open) => !open && setEditingCustomer(null)}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleUpdateCustomer}>
            <DialogHeader>
              <DialogTitle className="text-base">Edit Customer Account</DialogTitle>
              <DialogDescription className="text-xs">
                Update account details and discount eligibility tier.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 py-4 text-xs">
              <div className="space-y-1">
                <Label htmlFor="edit-name">Account / Company Name *</Label>
                <Input
                  id="edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="text-xs h-8"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="edit-email">Contact Email *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="font-mono text-xs h-8"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="edit-contact">Contact Person</Label>
                  <Input
                    id="edit-contact"
                    value={editContact}
                    onChange={(e) => setEditContact(e.target.value)}
                    className="text-xs h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-tier">Customer Tier *</Label>
                  <select
                    id="edit-tier"
                    value={editTier}
                    onChange={(e) => setEditTier(e.target.value as CustomerTier)}
                    className="w-full h-8 px-2 text-xs bg-card border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="GOLD">GOLD (Highest Ceiling)</option>
                    <option value="SILVER">SILVER</option>
                    <option value="BRONZE">BRONZE</option>
                    <option value="STANDARD">STANDARD</option>
                  </select>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setEditingCustomer(null)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={updateCustomerMutation.isPending}>
                {updateCustomerMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deletingCustomerId)} onOpenChange={(open) => !open && setDeletingCustomerId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base text-destructive">Confirm Customer Deletion</DialogTitle>
            <DialogDescription className="text-xs">
              Are you sure you want to delete this customer? This action cannot be undone. Customers with active quotations cannot be deleted.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" size="sm" onClick={() => setDeletingCustomerId(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={deleteCustomerMutation.isPending}
              onClick={() => {
                const target = customers.find((c) => c.id === deletingCustomerId);
                if (deletingCustomerId) {
                  handleDeleteCustomer(deletingCustomerId, target?.name || "Customer");
                }
              }}
            >
              {deleteCustomerMutation.isPending ? "Deleting..." : "Delete Customer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
