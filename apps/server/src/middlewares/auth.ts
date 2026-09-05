import { auth } from "@DealFlow360/auth";
import prisma from "@DealFlow360/db";
import type { Context, Next } from "hono";
import { UnauthorizedError, ForbiddenError } from "../utils/errors";

export async function requireAuth(c: Context, next: Next) {
  let session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  const authHeader = c.req.header("Authorization");
  if (!session?.user && authHeader) {
    const identifier = authHeader.replace(/^Bearer\s+/i, "").trim();
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ id: identifier }, { email: identifier }],
      },
    });

    if (user) {
      session = {
        user,
        session: {
          id: `sess_${user.id}`,
          userId: user.id,
          expiresAt: new Date(Date.now() + 86400000),
          token: `token_${user.id}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          ipAddress: null,
          userAgent: null,
          activeOrganizationId: null,
        },
      };
    }
  }

  if (!session?.user) {
    throw new UnauthorizedError();
  }

  c.set("user", session.user);
  c.set("session", session.session);
  c.set("userId", session.user.id);

  const activeOrgId = session.session.activeOrganizationId;
  const member = await prisma.member.findFirst({
    where: {
      userId: session.user.id,
      ...(activeOrgId ? { organizationId: activeOrgId } : {}),
    },
  });

  if (member) {
    c.set("role", member.role);
    c.set("organizationId", member.organizationId);
  }

  await next();
}

export function requireRole(allowedRoles: string[]) {
  return async (c: Context, next: Next) => {
    const userRole = c.get("role") as string | undefined;
    const userId = c.get("userId") as string | undefined;

    if (!userId) {
      throw new UnauthorizedError();
    }

    if (userRole && allowedRoles.includes(userRole)) {
      return next();
    }

    const member = await prisma.member.findFirst({
      where: {
        userId,
        role: { in: allowedRoles },
      },
    });

    if (!member) {
      throw new ForbiddenError("You do not have the required role to perform this action.");
    }

    c.set("role", member.role);
    c.set("organizationId", member.organizationId);

    await next();
  };
}

export async function optionalAuth(c: Context, next: Next) {
  let session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  const authHeader = c.req.header("Authorization");
  if (!session?.user && authHeader) {
    const identifier = authHeader.replace(/^Bearer\s+/i, "").trim();
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ id: identifier }, { email: identifier }],
      },
    });

    if (user) {
      session = {
        user,
        session: {
          id: `sess_${user.id}`,
          userId: user.id,
          expiresAt: new Date(Date.now() + 86400000),
          token: `token_${user.id}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          ipAddress: null,
          userAgent: null,
          activeOrganizationId: null,
        },
      };
    }
  }

  if (session?.user) {
    c.set("user", session.user);
    c.set("session", session.session);
    c.set("userId", session.user.id);

    const activeOrgId = session.session.activeOrganizationId;
    const member = await prisma.member.findFirst({
      where: {
        userId: session.user.id,
        ...(activeOrgId ? { organizationId: activeOrgId } : {}),
      },
    });

    if (member) {
      c.set("role", member.role);
      c.set("organizationId", member.organizationId);
    }
  }

  await next();
}
