import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  FileText,
  Kanban,
  CheckCircle2,
  Activity,
  ShieldCheck,
  ExternalLink,
  Zap,
  UserCheck,
  ChevronDown,
  LogOut,
  User,
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

export default function Header() {
  const routerState = useRouterState();
  const navigate = useNavigate();
  const currentPath = routerState.location.pathname;
  const { data: session } = authClient.useSession();
  const { user, setRole, activeQuoteToken, logout } = useAuthStore();
  const activeRoleInfo = USER_ROLES[user.role];

  const displayUserEmail = session?.user?.email || user.email;
  const displayUserName = session?.user?.name || user.name;

  const navItems = [
    { to: "/workspace/builder", label: "Quotations", icon: FileText },
    { to: "/workspace/pipeline", label: "Pipeline", icon: Kanban },
    { to: "/workspace/approvals", label: "Approvals", icon: CheckCircle2 },
    { to: "/dashboard", label: "Deal Health", icon: Activity },
    { to: "/admin", label: "Admin Config", icon: ShieldCheck },
  ];

  const handleOpenCustomerPortal = () => {
    const portalUrl = `/portal/quote/${activeQuoteToken}`;
    window.open(portalUrl, "_blank");
  };

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

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur-md">
      {/* Main Single-Row Navigation Header */}
      <div className="flex h-14 items-center justify-between px-4 sm:px-6">
        {/* Brand & Navigation Links */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2.5 font-bold text-lg tracking-tight">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-primary text-primary-foreground shadow-sm">
              <Zap className="h-4 w-4 fill-primary-foreground" />
            </div>
            <span className="font-extrabold text-foreground tracking-tight">
              DealFlow<span className="text-emerald-500">360</span>
            </span>
            <Badge variant="secondary" className="text-[10px] font-mono font-medium px-1.5 py-0">
              Enterprise
            </Badge>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(({ to, label, icon: Icon }) => {
              const isActive =
                currentPath === to || (to !== "/" && currentPath.startsWith(to));
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium transition-colors rounded-none ${
                    isActive
                      ? "bg-muted text-foreground font-semibold border-b-2 border-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${isActive ? "text-primary" : ""}`} />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Action Controls Right */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Customer Portal Shortcut */}
          <Button
            variant="outline"
            size="xs"
            onClick={handleOpenCustomerPortal}
            className="h-8 gap-1.5 text-xs font-medium"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Customer Portal</span>
          </Button>

          {/* Role Context Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger className="h-8 gap-1.5 px-2.5 bg-background hover:bg-muted text-foreground border border-input inline-flex items-center justify-center rounded-none text-xs font-medium cursor-pointer">
              <span className={`h-2 w-2 rounded-full ${activeRoleInfo.avatarColor}`} />
              <span className="font-semibold hidden sm:inline">{activeRoleInfo.name}</span>
              <ChevronDown className="h-3.5 w-3.5 opacity-60" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 bg-card text-card-foreground border-border">
              <DropdownMenuLabel className="text-muted-foreground text-[10px] uppercase tracking-wider">
                Role & Permission View
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {(Object.keys(USER_ROLES) as UserRole[]).map((roleKey) => {
                const item = USER_ROLES[roleKey];
                const isSelected = user.role === roleKey;
                return (
                  <DropdownMenuItem
                    key={roleKey}
                    onClick={() => setRole(roleKey)}
                    className="flex flex-col items-start gap-0.5 py-2 cursor-pointer"
                  >
                    <div className="flex w-full items-center justify-between font-medium text-xs">
                      <span className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${item.avatarColor}`} />
                        {item.name}
                      </span>
                      {isSelected && <UserCheck className="h-3.5 w-3.5 text-emerald-500" />}
                    </div>
                    <span className="text-[10px] text-muted-foreground pl-4">
                      {item.description}
                    </span>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          <ModeToggle />

          {/* User Profile & Sign Out Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="h-8 gap-2 px-2.5 bg-muted hover:bg-muted/80 text-foreground border border-border inline-flex items-center justify-center rounded-none text-xs font-medium cursor-pointer">
              <User className="h-3.5 w-3.5 text-emerald-500" />
              <span className="font-medium hidden md:inline">{displayUserName}</span>
              <ChevronDown className="h-3 w-3 opacity-60" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-card text-card-foreground border-border">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-xs font-semibold leading-none">{displayUserName}</p>
                  <p className="text-[11px] leading-none text-muted-foreground font-mono">{displayUserEmail}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="text-destructive focus:text-destructive cursor-pointer gap-2"
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
