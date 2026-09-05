import { useAuthStore, USER_ROLES, type UserRole, type RoleInfo } from "./auth-store";

export type DemoRole = UserRole;
export const DEMO_ROLES: Record<DemoRole, RoleInfo> = USER_ROLES;
export const useDemoStore = useAuthStore;
