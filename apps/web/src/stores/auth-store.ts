import { create } from "zustand";

export type UserRole = "rep" | "manager" | "finance" | "admin";

export interface RoleInfo {
  id: UserRole;
  name: string;
  badge: string;
  email: string;
  avatarColor: string;
  description: string;
}

export const USER_ROLES: Record<UserRole, RoleInfo> = {
  rep: {
    id: "rep",
    name: "Sales Representative",
    badge: "Sales Rep",
    email: "rep@dealflow360.com",
    avatarColor: "bg-blue-500",
    description: "Build quotes, configure line discounts, and view live margin meters",
  },
  manager: {
    id: "manager",
    name: "Sales Manager",
    badge: "Sales Manager",
    email: "manager@dealflow360.com",
    avatarColor: "bg-amber-500",
    description: "Approve 1-tier discount requests and audit rep pipeline",
  },
  finance: {
    id: "finance",
    name: "Finance Officer",
    badge: "Finance",
    email: "finance@dealflow360.com",
    avatarColor: "bg-emerald-500",
    description: "Approve high-risk quotes, oversee margin health & billing",
  },
  admin: {
    id: "admin",
    name: "System Administrator",
    badge: "Admin",
    email: "admin@dealflow360.com",
    avatarColor: "bg-purple-500",
    description: "Manage system discount ceilings, catalog items & rules",
  },
};

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser;
  activeQuoteId: string;
  activeQuoteToken: string;
  login: (role?: UserRole, customUser?: Partial<AuthUser>) => void;
  logout: () => void;
  setRole: (role: UserRole) => void;
  setActiveQuoteId: (id: string) => void;
  setActiveQuoteToken: (token: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: {
    id: "usr_rep_01",
    name: "Alice Rep",
    email: USER_ROLES.rep.email,
    role: "rep",
  },
  activeQuoteId: "quote_42",
  activeQuoteToken: "demo-token-acme",
  login: (role = "rep", customUser) => {
    const roleDetails = USER_ROLES[role];
    set({
      isAuthenticated: true,
      user: {
        id: customUser?.id || `usr_${role}_01`,
        name: customUser?.name || roleDetails.name,
        email: customUser?.email || roleDetails.email,
        role,
      },
    });
  },
  logout: () => {
    set({ isAuthenticated: false });
  },
  setRole: (role) => {
    const roleDetails = USER_ROLES[role];
    set((state) => ({
      user: {
        ...state.user,
        role,
        email: roleDetails.email,
        name: roleDetails.name,
      },
    }));
  },
  setActiveQuoteId: (activeQuoteId) => set({ activeQuoteId }),
  setActiveQuoteToken: (activeQuoteToken) => set({ activeQuoteToken }),
}));
