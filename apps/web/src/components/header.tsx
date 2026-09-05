import { Link, useRouterState } from "@tanstack/react-router";
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
} from "lucide-react";
import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";
import { useDemoStore, DEMO_ROLES, type DemoRole } from "@/stores/demo-store";
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
  const currentPath = routerState.location.pathname;
  const { role, setRole, activeQuoteToken } = useDemoStore();
  const activeRoleInfo = DEMO_ROLES[role];

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

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
      {/* Top Demo Toolbar */}
      <div className="flex h-8 items-center justify-between bg-zinc-900/90 px-4 text-xs text-zinc-300 dark:bg-zinc-950 border-b border-zinc-800">
        <div className="flex items-center gap-2 font-medium">
          <Badge
            variant="outline"
            className="border-emerald-500/40 bg-emerald-500/10 text-emerald-400 gap-1 text-[10px] uppercase tracking-wider font-mono py-0"
          >
            <Zap className="h-2.5 w-2.5 fill-emerald-400" />
            Hackathon Demo Control
          </Badge>
          <span className="hidden sm:inline text-zinc-400">
            Switch role to test multi-tier discount approval & governance live:
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Role Switcher Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="h-6 gap-1.5 px-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700/60 inline-flex items-center justify-center rounded-none text-xs font-medium cursor-pointer">
              <span
                className={`h-2 w-2 rounded-full ${activeRoleInfo.avatarColor}`}
              />
              <span className="font-semibold">{activeRoleInfo.name}</span>
              <ChevronDown className="h-3 w-3 opacity-60" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 bg-zinc-900 text-zinc-100 border-zinc-800">
              <DropdownMenuLabel className="text-zinc-400 text-[10px] uppercase tracking-wider">
                Select Evaluator Role
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-zinc-800" />
              {(Object.keys(DEMO_ROLES) as DemoRole[]).map((roleKey) => {
                const item = DEMO_ROLES[roleKey];
                const isSelected = role === roleKey;
                return (
                  <DropdownMenuItem
                    key={roleKey}
                    onClick={() => setRole(roleKey)}
                    className="flex flex-col items-start gap-0.5 py-2 cursor-pointer focus:bg-zinc-800 focus:text-zinc-100"
                  >
                    <div className="flex w-full items-center justify-between font-medium text-xs">
                      <span className="flex items-center gap-2">
                        <span
                          className={`h-2 w-2 rounded-full ${item.avatarColor}`}
                        />
                        {item.name}
                      </span>
                      {isSelected && (
                        <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-400 pl-4">
                      {item.description}
                    </span>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Quick Launch Customer Portal */}
          <Button
            variant="outline"
            size="xs"
            onClick={handleOpenCustomerPortal}
            className="h-6 gap-1.5 border-emerald-500/50 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/60 hover:text-emerald-200 text-[11px] font-medium"
          >
            <ExternalLink className="h-3 w-3" />
            <span>Open Customer Portal View</span>
          </Button>
        </div>
      </div>

      {/* Main Navigation Header */}
      <div className="flex h-14 items-center justify-between px-4 sm:px-6">
        {/* Brand & Main Links */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2.5 font-bold text-lg tracking-tight">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 text-white shadow-md shadow-emerald-500/20">
              <Zap className="h-4 w-4 fill-white" />
            </div>
            <span className="bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-700 dark:from-white dark:via-zinc-200 dark:to-zinc-400 bg-clip-text text-transparent font-extrabold">
              DealFlow<span className="text-emerald-500">360</span>
            </span>
            <Badge variant="secondary" className="text-[10px] font-mono font-medium px-1.5 py-0">
              v1.0
            </Badge>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(({ to, label, icon: Icon }) => {
              const isActive =
                currentPath === to ||
                (to !== "/" && currentPath.startsWith(to));
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium transition-colors rounded-none ${
                    isActive
                      ? "bg-muted text-foreground font-semibold border-b-2 border-emerald-500"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${isActive ? "text-emerald-500" : ""}`} />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Controls Right */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 bg-muted/50 border border-border/40 text-[11px] rounded-none">
            <span className="text-muted-foreground">Logged as:</span>
            <span className="font-mono font-medium text-foreground">{activeRoleInfo.email}</span>
          </div>
          <ModeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
