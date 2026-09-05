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
} from "lucide-react";
import { ModeToggle } from "./mode-toggle";
import { authClient } from "@/lib/auth-client";
import { useAuthStore } from "@/stores/auth-store";
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
  const { user, logout } = useAuthStore();

  const displayUserEmail = session?.user?.email || user.email;
  const displayUserName = session?.user?.name || user.name;

  const navItems = [
    { to: "/workspace/builder", label: "Quotations", icon: FileText },
    { to: "/workspace/pipeline", label: "Pipeline", icon: Kanban },
    { to: "/workspace/approvals", label: "Approvals", icon: CheckCircle2 },
    { to: "/workspace/fulfillment", label: "Fulfillment", icon: Activity },
    { to: "/workspace/billing", label: "Billing", icon: Activity },
    { to: "/dashboard", label: "Deal Health", icon: Activity },
    { to: "/admin", label: "Admin Config", icon: ShieldCheck },
  ];

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
            {navItems.map(({ to, label, icon: Icon }) => {
              const isActive =
                currentPath === to || (to !== "/" && currentPath.startsWith(to));
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium transition-colors rounded-md ${
                    isActive
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
          <ModeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger className="h-8 gap-2 px-2.5 bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 inline-flex items-center justify-center rounded-md text-xs font-medium cursor-pointer">
              <User className="h-3.5 w-3.5 text-sky-400" />
              <span className="font-medium hidden md:inline">{displayUserName}</span>
              <ChevronDown className="h-3 w-3 opacity-60" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-[#101923] text-foreground border border-slate-700">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-xs font-semibold leading-none text-white">{displayUserName}</p>
                  <p className="text-[11px] leading-none text-slate-400 font-mono">{displayUserEmail}</p>
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
