import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UserRole = "rep" | "manager" | "finance" | "admin";

export type RoleInfo = {
  id: UserRole;
  name: string;
  badge: string;
  email: string;
  avatarColor: string;
  description: string;
};

export const USER_ROLES: Record<UserRole, RoleInfo> = {
  rep: {
    id: "rep",
    name: "Alice Rep",
    badge: "Sales Rep",
    email: "rep@dealflow360.com",
    avatarColor: "bg-blue-500",
    description: "Build quotes, configure line discounts, and view live margin meters",
  },
  manager: {
    id: "manager",
    name: "Marcus Manager",
    badge: "Sales Manager",
    email: "manager@dealflow360.com",
    avatarColor: "bg-amber-500",
    description: "Approve 1-tier discount requests and audit rep pipeline",
  },
  finance: {
    id: "finance",
    name: "Fiona Finance",
    badge: "Finance Officer",
    email: "finance@dealflow360.com",
    avatarColor: "bg-emerald-500",
    description: "Approve high-risk quotes, oversee margin health & billing",
  },
  admin: {
    id: "admin",
    name: "Arthur Admin",
    badge: "Administrator",
    email: "admin@dealflow360.com",
    avatarColor: "bg-purple-500",
    description: "Manage system discount ceilings, catalog items & rules",
  },
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

type AuthState = {
  isAuthenticated: boolean;
  user: AuthUser;
  login: (role?: UserRole, customUser?: Partial<AuthUser>) => void;
  switchRole: (role: UserRole) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: {
        id: "usr_rep_01",
        name: "Alice Rep",
        email: USER_ROLES.rep.email,
        role: "rep",
      },
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
      switchRole: (role: UserRole) => {
        const roleDetails = USER_ROLES[role];
        set({
          isAuthenticated: true,
          user: {
            id: `usr_${role}_01`,
            name: roleDetails.name,
            email: roleDetails.email,
            role,
          },
        });
      },
      logout: () => {
        set({ isAuthenticated: false });
      },
    }),
    {
      name: "dealflow360_auth",
    }
  )
);
