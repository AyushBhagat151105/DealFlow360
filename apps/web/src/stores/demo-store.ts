import { create } from "zustand";

export type DemoRole = "rep" | "manager" | "finance" | "admin";

export interface RoleInfo {
  id: DemoRole;
  name: string;
  badge: string;
  email: string;
  avatarColor: string;
  description: string;
}

export const DEMO_ROLES: Record<DemoRole, RoleInfo> = {
  rep: {
    id: "rep",
    name: "Sales Representative",
    badge: "Sales Rep",
    email: "rep@dealflow360.com",
    avatarColor: "bg-blue-500",
    description: "Build quotes, request discounts, apply upsells",
  },
  manager: {
    id: "manager",
    name: "Sales Manager",
    badge: "Sales Manager",
    email: "manager@dealflow360.com",
    avatarColor: "bg-amber-500",
    description: "Approve 1-tier discounts, review team pipeline",
  },
  finance: {
    id: "finance",
    name: "Finance Officer",
    badge: "Finance",
    email: "finance@dealflow360.com",
    avatarColor: "bg-emerald-500",
    description: "Approve high-risk quotes, view billing & margin health",
  },
  admin: {
    id: "admin",
    name: "System Administrator",
    badge: "Admin",
    email: "admin@dealflow360.com",
    avatarColor: "bg-purple-500",
    description: "Manage system config, discount ceilings & catalog",
  },
};

interface DemoState {
  role: DemoRole;
  activeQuoteId: string;
  activeQuoteToken: string;
  setRole: (role: DemoRole) => void;
  setActiveQuoteId: (id: string) => void;
  setActiveQuoteToken: (token: string) => void;
}

export const useDemoStore = create<DemoState>((set) => ({
  role: "rep",
  activeQuoteId: "quote_42",
  activeQuoteToken: "demo-token-acme",
  setRole: (role) => set({ role }),
  setActiveQuoteId: (activeQuoteId) => set({ activeQuoteId }),
  setActiveQuoteToken: (activeQuoteToken) => set({ activeQuoteToken }),
}));
