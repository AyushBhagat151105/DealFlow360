import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore, USER_ROLES } from "./auth-store";

describe("useAuthStore", () => {
  beforeEach(() => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: {
        id: "usr_rep_01",
        name: "Sales Representative",
        email: "rep@dealflow360.com",
        role: "rep",
      },
      activeQuoteId: "quote_42",
      activeQuoteToken: "demo-token-acme",
    });
  });

  it("should initialize with default rep role and authenticated state", () => {
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user.role).toBe("rep");
    expect(state.activeQuoteId).toBe("quote_42");
    expect(state.activeQuoteToken).toBe("demo-token-acme");
  });

  it("should switch user roles properly", () => {
    useAuthStore.getState().setRole("manager");
    expect(useAuthStore.getState().user.role).toBe("manager");
    expect(USER_ROLES.manager.badge).toBe("Sales Manager");

    useAuthStore.getState().setRole("finance");
    expect(useAuthStore.getState().user.role).toBe("finance");
    expect(USER_ROLES.finance.email).toBe("finance@dealflow360.com");
  });

  it("should handle login and logout correctly", () => {
    useAuthStore.getState().logout();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);

    useAuthStore.getState().login("admin");
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().user.role).toBe("admin");
  });

  it("should update active quote state", () => {
    useAuthStore.getState().setActiveQuoteId("quote_99");
    useAuthStore.getState().setActiveQuoteToken("token_99");
    expect(useAuthStore.getState().activeQuoteId).toBe("quote_99");
    expect(useAuthStore.getState().activeQuoteToken).toBe("token_99");
  });
});
