import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  FileText,
  Kanban,
  CheckCircle2,
  Activity,
  ShieldCheck,
  ReceiptText,
  ExternalLink,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useAuthStore, USER_ROLES, type UserRole } from "@/stores/auth-store";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

type NavItem = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: readonly UserRole[];
};

const NAV_WORKSPACE: readonly NavItem[] = [
  { to: "/workspace/builder", label: "Quotations", icon: FileText, roles: ["rep", "manager", "finance", "admin"] },
  { to: "/workspace/pipeline", label: "Pipeline", icon: Kanban, roles: ["rep", "manager", "finance", "admin"] },
  { to: "/workspace/approvals", label: "Approvals", icon: CheckCircle2, roles: ["manager", "finance", "admin"] },
  { to: "/workspace/invoices", label: "Invoices", icon: ReceiptText, roles: ["rep", "manager", "finance", "admin"] },
];

const NAV_INTELLIGENCE: readonly NavItem[] = [
  { to: "/dashboard", label: "Deal Health", icon: Activity, roles: ["manager", "finance", "admin"] },
];

const NAV_ADMIN: readonly NavItem[] = [
  { to: "/admin", label: "Admin Config", icon: ShieldCheck, roles: ["admin"] },
];

const ROLE_BADGE_COLORS: Record<UserRole, string> = {
  rep: "bg-sticky-note-teal text-forest-ink",
  manager: "bg-highlighter-yellow text-forest-ink",
  finance: "bg-sticky-note-mint text-forest-ink",
  admin: "bg-sticky-note-blush text-forest-ink",
};

function NavGroup({ label, items, currentPath, role }: {
  label: string;
  items: readonly NavItem[];
  currentPath: string;
  role: UserRole;
}) {
  const { state } = useSidebar();
  const visible = items.filter((item) => item.roles.includes(role));
  if (visible.length === 0) return null;

  return (
    <SidebarGroup>
      {state === "expanded" && (
        <SidebarGroupLabel className="font-mono text-[10px] uppercase tracking-[0.12em] text-pencil-gray px-2 mb-1">
          {label}
        </SidebarGroupLabel>
      )}
      <SidebarGroupContent>
        <SidebarMenu>
          {visible.map(({ to, label: itemLabel, icon: Icon }) => {
            const isActive = currentPath === to || (to !== "/" && currentPath.startsWith(to));
            return (
              <SidebarMenuItem key={to}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={itemLabel}
                  className={
                    isActive
                      ? "bg-sticky-note-mint text-forest-ink font-medium border-l-2 border-forest-ink rounded-l-none"
                      : "text-forest-ink/70 hover:bg-whisper-gray hover:text-forest-ink"
                  }
                >
                  <Link to={to}>
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{itemLabel}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebar() {
  const routerState = useRouterState();
  const navigate = useNavigate();
  const currentPath = routerState.location.pathname;
  const { data: session } = authClient.useSession();
  const { user, switchRole, logout } = useAuthStore();
  const { state } = useSidebar();

  const displayName = session?.user?.name || user.name;
  const displayEmail = session?.user?.email || user.email;
  const roleInfo = USER_ROLES[user.role] ?? USER_ROLES.rep;

  const handleSignOut = () => {
    authClient.signOut({
      fetchOptions: {
        onSuccess: () => { logout(); navigate({ to: "/login" }); },
        onError: () => { logout(); navigate({ to: "/login" }); },
      },
    });
  };

  const handleRoleSwitch = (newRole: UserRole) => {
    switchRole(newRole);
    const restrictedPaths = ["/admin", "/workspace/approvals", "/dashboard"];
    if (newRole === "rep" && restrictedPaths.some((p) => currentPath.startsWith(p))) {
      navigate({ to: "/workspace/builder" });
    }
  };

  return (
    <Sidebar collapsible="icon">
      {/* Logo */}
      <SidebarHeader className="border-b border-pencil-gray/40 pb-3 pt-4">
        <Link to="/" className="flex items-center gap-2.5 px-2">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-highlighter-yellow text-forest-ink font-black text-sm leading-none select-none"
            aria-hidden
          >
            DF
          </div>
          {state === "expanded" && (
            <span className="font-bold text-sm text-forest-ink tracking-tight leading-none">
              DealFlow<span className="font-black">360</span>
            </span>
          )}
        </Link>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent className="pt-2">
        <NavGroup label="Workspace" items={NAV_WORKSPACE} currentPath={currentPath} role={user.role} />
        <NavGroup label="Intelligence" items={NAV_INTELLIGENCE} currentPath={currentPath} role={user.role} />
        <NavGroup label="Admin" items={NAV_ADMIN} currentPath={currentPath} role={user.role} />

        {/* Customer portal quick launch */}
        {state === "expanded" && (
          <SidebarGroup className="mt-auto">
            <SidebarGroupContent>
              <button
                type="button"
                onClick={() => window.open("/portal/quote/acme_negotiation_token_2026", "_blank")}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium text-forest-ink/60 hover:bg-whisper-gray hover:text-forest-ink transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                <span>Customer Portal</span>
              </button>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarSeparator />

      {/* Role switcher + user footer */}
      <SidebarFooter className="py-3">
        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left hover:bg-whisper-gray transition-colors cursor-pointer outline-none"
          >
            {/* Avatar */}
            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-forest-ink ${ROLE_BADGE_COLORS[user.role]}`}>
              {displayName.charAt(0).toUpperCase()}
            </div>
            {state === "expanded" && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-forest-ink leading-tight">{displayName}</p>
                <p className="truncate text-[10px] font-mono text-forest-ink/50 leading-tight">{roleInfo.badge}</p>
              </div>
            )}
            {state === "expanded" && <ChevronDown className="h-3.5 w-3.5 shrink-0 text-forest-ink/40" />}
          </DropdownMenuTrigger>

          <DropdownMenuContent side="top" align="start" className="w-60 bg-cream-paper border-pencil-gray">
            <DropdownMenuLabel className="font-normal pb-2">
              <p className="text-xs font-semibold text-forest-ink">{displayName}</p>
              <p className="text-[10px] font-mono text-forest-ink/50 mt-0.5">{displayEmail}</p>
              <p className="text-[10px] text-forest-ink/40 mt-1 leading-snug">{roleInfo.description}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-pencil-gray/40" />


            <DropdownMenuItem
              onClick={handleSignOut}
              className="gap-2 text-xs text-terracotta focus:bg-terracotta/10 focus:text-terracotta cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
