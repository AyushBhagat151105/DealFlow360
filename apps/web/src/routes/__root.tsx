import {
  HeadContent,
  Outlet,
  createRootRouteWithContext,
  useRouterState,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import Header from "@/components/header";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { authClient } from "@/lib/auth-client";
import { useAuthStore } from "@/stores/auth-store";

import "../index.css";

export interface RouterAppContext {}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  component: RootComponent,
  head: () => ({
    meta: [
      {
        title: "DealFlow360 — Enterprise B2B Quotation Engine",
      },
      {
        name: "description",
        content:
          "Enterprise B2B Quotation, Blended Margin Governance, Multi-Warehouse Auto-Split & Hybrid Billing Engine",
      },
    ],
    links: [
      {
        rel: "icon",
        href: "/favicon.ico",
      },
    ],
  }),
});

function RootComponent() {
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;
  const { data: session } = authClient.useSession();
  const storeIsAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const isAuthenticated = Boolean(session?.user || storeIsAuthenticated);
  const isPublicPage = pathname === "/login" || pathname.startsWith("/portal/");
  const showHeader = isAuthenticated && !isPublicPage;

  return (
    <>
      <HeadContent />

      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        disableTransitionOnChange
        storageKey="vite-ui-theme"
      >
        <div className="grid grid-rows-[auto_1fr] h-svh bg-background text-foreground">
          {showHeader && <Header />}
          <Outlet />
        </div>
        <Toaster richColors />
      </ThemeProvider>

      <TanStackRouterDevtools position="bottom-left" />
    </>
  );
}
