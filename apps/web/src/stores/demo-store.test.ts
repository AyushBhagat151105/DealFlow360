import { describe, it, expect, beforeEach } from "vitest";
import { useDemoStore, DEMO_ROLES } from "./demo-store";

describe("useDemoStore", () => {
  beforeEach(() => {
    useDemoStore.setState({
      role: "rep",
      activeQuoteId: "quote_42",
      activeQuoteToken: "demo-token-acme",
    });
  });

  it("should initialize with default rep role", () => {
    const state = useDemoStore.getState();
    expect(state.role).toBe("rep");
    expect(state.activeQuoteId).toBe("quote_42");
    expect(state.activeQuoteToken).toBe("demo-token-acme");
  });

  it("should switch demo roles properly", () => {
    useDemoStore.getState().setRole("manager");
    expect(useDemoStore.getState().role).toBe("manager");
    expect(DEMO_ROLES.manager.badge).toBe("Sales Manager");

    useDemoStore.getState().setRole("finance");
    expect(useDemoStore.getState().role).toBe("finance");
    expect(DEMO_ROLES.finance.email).toBe("finance@dealflow360.com");
  });

  it("should update active quote state", () => {
    useDemoStore.getState().setActiveQuoteId("quote_99");
    useDemoStore.getState().setActiveQuoteToken("token_99");
    expect(useDemoStore.getState().activeQuoteId).toBe("quote_99");
    expect(useDemoStore.getState().activeQuoteToken).toBe("token_99");
  });
});
