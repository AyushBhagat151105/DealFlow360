import prisma from "@DealFlow360/db";
import { env } from "@DealFlow360/env/server";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { organization } from "better-auth/plugins";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  trustedOrigins: [
    env.CORS_ORIGIN,
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://192.168.9.200:5173",
    "http://192.168.9.200:3000",
    "http://192.168.9.200:3001",
    "http://192.168.9.22:5173"
  ],
  emailAndPassword: {
    enabled: true,
  },
  advanced: {
    defaultCookieAttributes: {
      sameSite: "lax",
      secure: false,
      httpOnly: true,
    },
  },
  plugins: [organization()],
});
