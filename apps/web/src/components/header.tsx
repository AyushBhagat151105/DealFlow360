import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  FileText,
  Kanban,
  CheckCircle2,
  Activity,
  ShieldCheck,
  Zap,
  ChevronDown,
  LogOut,
  User,
  ExternalLink,
} from "lucide-react";
import { ModeToggle } from "./mode-toggle";
import { authClient } from "@/lib/auth-client";
import { useAuthStore, USER_ROLES, type UserRole } from "@/stores/auth-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type NavItem = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: readonly UserRole[];
};

const NAV_ITEMS: readonly NavItem[] = [
  { to: "/workspace/builder", label: "Quotations", icon: FileText, roles: ["rep", "manager", "finance", "admin"] },
  { to: "/workspace/pipeline", label: "Pipeline", icon: Kanban, roles: ["rep", "manager", "finance", "admin"] },
  { to: "/workspace/approvals", label: "Approvals", icon: CheckCircle2, roles: ["manager", "finance", "admin"] },
  { to: "/dashboard", label: "Deal Health", icon: Activity, roles: ["manager", "finance", "admin"] },
  { to: "/admin", label: "Admin Config", icon: ShieldCheck, roles: ["admin"] },
];

export function Header() {
  const routerState = useRouterState();
  const navigate = useNavigate();
  const currentPath = routerState.location.pathname;
  const { data: session } = authClient.useSession();
  const { user, switchRole, logout } = useAuthStore();

  const displayUserEmail = session?.user?.email || user.email;
  const displayUserName = session?.user?.name || user.name;
  const currentRoleInfo = USER_ROLES[user.role] || USER_ROLES.rep;

  const visibleNavItems = NAV_ITEMS.filter((item) => item.roles.includes(user.role));

  const handleSignOut = () => {
    authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          logout();
          navigate({ to: "/login" });
        },
        onError: () => {
          logout();
          navigate({ to: "/login" });
        },
      },
    });
  };

  const handleRoleSwitch = (newRole: UserRole) => {
    switchRole(newRole);
    if (newRole === "rep" && (currentPath === "/admin" || currentPath === "/workspace/approvals" || currentPath === "/dashboard")) {
      navigate({ to: "/workspace/builder" });
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-[#0a0f14]/90 backdrop-blur-md">
      <div className="flex h-14 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2.5 font-bold text-lg tracking-tight">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-[0_0_0_1px_rgba(59,130,246,0.18)]">
              <Zap className="h-4 w-4 fill-primary-foreground" />
            </div>
            <span className="font-extrabold text-foreground tracking-tight text-sm sm:text-base">
              DealFlow<span className="text-sky-400">360</span>
            </span>
            <Badge variant="secondary" className="text-[10px] font-mono font-medium px-1.5 py-0 bg-slate-800 text-slate-200 border border-slate-700">
              Enterprise
            </Badge>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {visibleNavItems.map(({ to, label, icon: Icon }) => {
              const isActive = currentPath === to || (to !== "/" && currentPath.startsWith(to));
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium transition-colors rounded-md ${isActive
                      ? "bg-slate-800 text-white border border-sky-500/30 shadow-[inset_0_0_0_1px_rgba(56,189,248,0.15)]"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/70"
                    }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${isActive ? "text-sky-400" : "text-slate-400"}`} />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5 border-emerald-500/30 text-emerald-400 hover:bg-emerald-950/40 hover:text-emerald-300"
            onClick={() => window.open("/portal/quote/acme_negotiation_token_2026", "_blank")}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span className="hidden xl:inline">Portal View</span>
          </Button>

          <ModeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger className="h-8 gap-2 px-2.5 bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 inline-flex items-center justify-center rounded-md text-xs font-medium cursor-pointer">
              <User className="h-3.5 w-3.5 text-sky-400" />
              <span className="font-medium hidden md:inline">{displayUserName}</span>
              <Badge variant="outline" className={`text-[10px] px-1 py-0 border-none ${currentRoleInfo.avatarColor} text-white`}>
                {currentRoleInfo.badge}
              </Badge>
              <ChevronDown className="h-3 w-3 opacity-60" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-[#101923] text-foreground border border-slate-700">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold leading-none text-white">{displayUserName}</p>
                    <Badge variant="outline" className="text-[10px] text-sky-400 border-sky-500/30">
                      {currentRoleInfo.badge}
                    </Badge>
                  </div>
                  <p className="text-[11px] leading-none text-slate-400 font-mono">{displayUserEmail}</p>
                  <p className="text-[10px] leading-tight text-slate-500 pt-1">{currentRoleInfo.description}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-700" />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="text-red-300 focus:text-red-300 cursor-pointer gap-2 hover:bg-slate-800"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
