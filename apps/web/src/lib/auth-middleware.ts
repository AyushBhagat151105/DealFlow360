import { redirect } from "@tanstack/react-router";

import { authClient } from "@/lib/auth-client";
import { useAuthStore } from "@/stores/auth-store";

type OrganizationRole = "rep" | "manager" | "finance" | "admin" | "operations";

const publicPaths = ["/", "/login", "/success"];

const rolePolicies: Array<{
  path: string;
  roles: readonly OrganizationRole[];
}> = [
    { path: "/admin", roles: ["admin"] },
    { path: "/dashboard", roles: ["manager", "finance", "admin"] },
    {
      path: "/workspace/approvals",
      roles: ["manager", "finance", "admin"],
    },
    {
      path: "/workspace/billing",
      roles: ["manager", "finance", "admin"],
    },
    {
      path: "/workspace/fulfillment",
      roles: ["manager", "finance", "admin", "operations"],
    },
  ];

function isPublicPath(pathname: string) {
  return publicPaths.includes(pathname) || pathname.startsWith("/portal/");
}

function getRequiredRoles(pathname: string) {
  return rolePolicies.find(
    (policy) => pathname === policy.path || pathname.startsWith(`${policy.path}/`),
  )?.roles;
}

export async function requireAuthentication(pathname: string, redirectTo: string) {
  if (isPublicPath(pathname)) {
    return;
  }

  const session = await authClient.getSession();
  if (!session.data?.user) {
    throw redirect({
      to: "/login",
      search: { redirect: redirectTo },
      throw: true,
    });
  }
}

export async function requireRole(pathname: string) {
  const requiredRoles = getRequiredRoles(pathname);
  if (!requiredRoles) {
    return;
  }

  let role: OrganizationRole | undefined;

  try {
    const activeMember = await authClient.organization.getActiveMember();
    role = activeMember.data?.role as OrganizationRole | undefined;

    if (!role) {
      const orgList = await authClient.organization.list();
      const firstOrg = orgList.data?.[0];
      if (firstOrg) {
        await authClient.organization.setActive({
          organizationId: firstOrg.id,
        });
        const updatedMember = await authClient.organization.getActiveMember();
        role = updatedMember.data?.role as OrganizationRole | undefined;
      }
    }
  } catch {
    // If organization calls fail, continue to store fallback
  }

  if (!role || !requiredRoles.includes(role)) {
    const storeRole = useAuthStore.getState().user?.role as OrganizationRole | undefined;
    if (storeRole && requiredRoles.includes(storeRole)) {
      role = storeRole;
    }
  }

  if (!role || !requiredRoles.includes(role)) {
    throw redirect({
      to: "/",
      throw: true,
    });
  }
}

export async function authorizeRoute(pathname: string, redirectTo: string) {
  await requireAuthentication(pathname, redirectTo);

  if (!isPublicPath(pathname)) {
    await requireRole(pathname);
  }
}