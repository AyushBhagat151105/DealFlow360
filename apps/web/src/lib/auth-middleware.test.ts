import { describe, it, expect, vi, beforeEach } from "vitest";
import { authorizeRoute, requireAuthentication, requireRole } from "./auth-middleware";
import { authClient } from "./auth-client";
import { useAuthStore } from "@/stores/auth-store";

vi.mock("./auth-client", () => ({
  authClient: {
    getSession: vi.fn(),
    organization: {
      getActiveMember: vi.fn(),
      list: vi.fn(),
      setActive: vi.fn(),
    },
  },
}));

describe("auth-middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      isAuthenticated: false,
      user: {
        id: "usr_rep_01",
        name: "Alice Rep",
        email: "rep@dealflow360.com",
        role: "rep",
      },
    });
  });

  describe("requireAuthentication", () => {
    it("allows public paths without checking session", async () => {
      await expect(requireAuthentication("/", "/")).resolves.toBeUndefined();
      await expect(requireAuthentication("/login", "/login")).resolves.toBeUndefined();
      await expect(requireAuthentication("/success", "/success")).resolves.toBeUndefined();
      await expect(requireAuthentication("/portal/quote/test-token", "/portal/quote/test-token")).resolves.toBeUndefined();
      expect(authClient.getSession).not.toHaveBeenCalled();
    });

    it("redirects unauthenticated users to /login for protected paths", async () => {
      vi.mocked(authClient.getSession).mockResolvedValue({ data: null } as never);

      await expect(
        requireAuthentication("/workspace/approvals", "/workspace/approvals")
      ).rejects.toMatchObject({
        options: {
          to: "/login",
        },
      });
    });

    it("allows authenticated users to proceed", async () => {
      vi.mocked(authClient.getSession).mockResolvedValue({
        data: { user: { id: "u1", name: "Test User", email: "test@example.com" } },
      } as never);

      await expect(
        requireAuthentication("/workspace/builder", "/workspace/builder")
      ).resolves.toBeUndefined();
    });
  });

  describe("requireRole", () => {
    it("does nothing if path has no role requirements", async () => {
      await expect(requireRole("/workspace/builder")).resolves.toBeUndefined();
    });

    it("succeeds if active member already has the required role", async () => {
      vi.mocked(authClient.organization.getActiveMember).mockResolvedValue({
        data: { role: "admin" },
      } as never);

      await expect(requireRole("/admin")).resolves.toBeUndefined();
    });

    it("auto-activates the first organization when getActiveMember returns null", async () => {
      vi.mocked(authClient.organization.getActiveMember)
        .mockResolvedValueOnce({ data: null } as never)
        .mockResolvedValueOnce({ data: { role: "manager" } } as never);

      vi.mocked(authClient.organization.list).mockResolvedValue({
        data: [{ id: "org_1", name: "Org 1" }],
      } as never);

      vi.mocked(authClient.organization.setActive).mockResolvedValue({ data: {} } as never);

      await expect(requireRole("/workspace/approvals")).resolves.toBeUndefined();
      expect(authClient.organization.setActive).toHaveBeenCalledWith({
        organizationId: "org_1",
      });
    });

    it("falls back to useAuthStore role when organization lookup fails or has no role", async () => {
      vi.mocked(authClient.organization.getActiveMember).mockResolvedValue({
        data: null,
      } as never);
      vi.mocked(authClient.organization.list).mockResolvedValue({
        data: [],
      } as never);

      useAuthStore.setState({
        user: {
          id: "usr_mgr",
          name: "Manager User",
          email: "manager@dealflow360.com",
          role: "manager",
        },
      });

      await expect(requireRole("/workspace/approvals")).resolves.toBeUndefined();
    });

    it("falls back to useAuthStore role when active member role does not satisfy route requirements", async () => {
      vi.mocked(authClient.organization.getActiveMember).mockResolvedValue({
        data: { role: "rep" },
      } as never);

      useAuthStore.setState({
        user: {
          id: "usr_mgr",
          name: "Manager User",
          email: "manager@dealflow360.com",
          role: "manager",
        },
      });

      await expect(requireRole("/workspace/approvals")).resolves.toBeUndefined();
    });

    it("redirects to / when role does not satisfy requirements", async () => {
      vi.mocked(authClient.organization.getActiveMember).mockResolvedValue({
        data: null,
      } as never);
      vi.mocked(authClient.organization.list).mockResolvedValue({
        data: [],
      } as never);

      useAuthStore.setState({
        user: {
          id: "usr_rep",
          name: "Rep User",
          email: "rep@dealflow360.com",
          role: "rep",
        },
      });

      await expect(requireRole("/admin")).rejects.toMatchObject({
        options: {
          to: "/",
        },
      });
    });
  });

  describe("authorizeRoute", () => {
    it("allows access to /success without redirect", async () => {
      await expect(authorizeRoute("/success", "/success")).resolves.toBeUndefined();
      expect(authClient.getSession).not.toHaveBeenCalled();
    });
  });
});
