import {
  HeadContent,
  Outlet,
  createRootRouteWithContext,
  useRouterState,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import { AppSidebar } from "@/components/app-sidebar";
import { AppTopBar } from "@/components/app-top-bar";
import { Toaster } from "@/components/ui/sonner";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { authorizeRoute } from "@/lib/auth-middleware";

import "../index.css";

export type RouterAppContext = Record<string, never>;

export const Route = createRootRouteWithContext<RouterAppContext>()({
  component: RootComponent,
  beforeLoad: async ({ location }) => {
    await authorizeRoute(location.pathname, location.href);
  },
  head: () => ({
    meta: [
      { title: "DealFlow360 — Enterprise B2B Quotation Engine" },
      {
        name: "description",
        content: "Enterprise B2B Quotation, Blended Margin Governance, Multi-Warehouse Auto-Split & Hybrid Billing Engine",
      },
    ],
    links: [{ rel: "icon", href: "/favicon.ico" }],
  }),
});

// Routes that get the full sidebar shell
const SIDEBAR_ROUTES = [
  "/workspace",
  "/dashboard",
  "/admin",
];

function isSidebarRoute(pathname: string) {
  return SIDEBAR_ROUTES.some((prefix) => pathname.startsWith(prefix));
}

function RootComponent() {
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;
  const showSidebar = isSidebarRoute(pathname);

  if (showSidebar) {
    return (
      <>
        <HeadContent />
        <SidebarProvider defaultOpen>
          <AppSidebar />
          <SidebarInset>
            <AppTopBar />
            <div className="flex-1 overflow-y-auto">
              <Outlet />
            </div>
          </SidebarInset>
        </SidebarProvider>
        <Toaster richColors />
        <TanStackRouterDevtools position="bottom-left" />
      </>
    );
  }

  // Public routes (/, /login, /portal/*, /success) — no sidebar
  return (
    <>
      <HeadContent />
      <div className="min-h-screen bg-background text-foreground">
        <Outlet />
      </div>
      <Toaster richColors />
      <TanStackRouterDevtools position="bottom-left" />
    </>
  );
}
