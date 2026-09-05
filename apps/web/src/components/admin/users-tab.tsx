import { useState, useMemo } from "react";
import { Search, ShieldAlert, UserCheck, Trash2 } from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TablePagination } from "@/components/ui/pagination";
import { usePaginatedUsers, useUpdateUserRole, useDeleteUser } from "@/hooks/use-catalog";
import type { UserItem } from "@/lib/api-types";

const ROLE_BADGE_STYLES: Record<string, string> = {
  admin: "bg-sticky-note-blush text-forest-ink border-sticky-note-blush/60",
  finance: "bg-sticky-note-mint text-forest-ink border-sticky-note-mint/60",
  manager: "bg-highlighter-yellow text-forest-ink border-highlighter-yellow/60",
  rep: "bg-sticky-note-teal text-forest-ink border-sticky-note-teal/60",
};

export function UsersTab() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");

  const usersQuery = usePaginatedUsers({
    page,
    limit: pageSize,
    search: search || undefined,
  });
  const updateRoleMutation = useUpdateUserRole();
  const deleteUserMutation = useDeleteUser();

  const [deletingUser, setDeletingUser] = useState<UserItem | null>(null);

  const paginatedData = usersQuery.data;
  const users = paginatedData?.users ?? [];

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await updateRoleMutation.mutateAsync({ id: userId, role: newRole });
      toast.success(`Role updated to ${newRole}`);
    } catch {
      toast.error("Failed to update user role");
    }
  };

  const handleDeleteUser = async (user: UserItem) => {
    try {
      await deleteUserMutation.mutateAsync(user.id);
      toast.success(`User "${user.name}" removed from workspace`);
      setDeletingUser(null);
    } catch {
      toast.error("Failed to delete user");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search team member by name, email, or role..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-8 h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <UserCheck className="h-4 w-4 text-emerald-600" />
          <span>{paginatedData?.total ?? users.length} active team members</span>
        </div>
      </div>

      <Card className="rounded-lg border-border bg-card shadow-none overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="text-xs">User</TableHead>
              <TableHead className="text-xs">Email</TableHead>
              <TableHead className="text-xs">Current Role</TableHead>
              <TableHead className="text-xs">Role Assignment</TableHead>
              <TableHead className="text-xs">Created At</TableHead>
              <TableHead className="text-xs text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usersQuery.isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-sm text-muted-foreground">
                  Loading team members...
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-sm text-muted-foreground">
                  No team members found.
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium text-xs">
                    <p className="font-semibold">{u.name}</p>
                  </TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground">{u.email}</TableCell>
                  <TableCell>
                    <Badge className={`text-[10px] px-1.5 py-0 border capitalize ${ROLE_BADGE_STYLES[u.role] || ROLE_BADGE_STYLES.rep}`}>
                      {u.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      disabled={updateRoleMutation.isPending}
                      aria-label="Assign Role"
                      className="h-7 px-2 text-xs bg-background border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary rounded-none"
                    >
                      <option value="rep">Sales Rep</option>
                      <option value="manager">Sales Manager</option>
                      <option value="finance">Finance Director</option>
                      <option value="admin">System Admin</option>
                    </select>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground font-mono">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:bg-destructive/10"
                      onClick={() => setDeletingUser(u)}
                      title="Remove User"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
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

      <Dialog open={Boolean(deletingUser)} onOpenChange={(open) => !open && setDeletingUser(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base text-destructive flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-destructive" />
              Remove Team Member
            </DialogTitle>
            <DialogDescription className="text-xs">
              Are you sure you want to remove <span className="font-semibold text-foreground">{deletingUser?.name}</span> ({deletingUser?.email}) from the workspace? They will immediately lose access.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" size="sm" onClick={() => setDeletingUser(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={deleteUserMutation.isPending}
              onClick={() => {
                if (deletingUser) {
                  handleDeleteUser(deletingUser);
                }
              }}
            >
              {deleteUserMutation.isPending ? "Removing..." : "Remove User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
