import { describe, it, expect } from "vitest";
import { app } from "../index";

describe("API Route Request Validation E2E", () => {
  it("rejects quote preview calculation with empty lines", async () => {
    const res = await app.request("/api/quotes/calculate-preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId: "cust-1",
        lines: [],
      }),
    });

    expect(res.status).toBe(400);
    const json = (await res.json()) as { success: boolean; error: { code: string } };
    expect(json.success).toBe(false);
  });

  it("rejects portal counter offer with invalid discount percentage", async () => {
    const res = await app.request("/api/portal/quote/tok-test-123/counter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        authorName: "Kunal Shah",
        proposedDiscounts: [
          {
            lineId: "line-1",
            counterDiscountPercent: 200, // Invalid: exceeds 100%
          },
        ],
      }),
    });

    expect(res.status).toBe(400);
    const json = (await res.json()) as { success: boolean };
    expect(json.success).toBe(false);
  });

  it("rejects portal magic link request with invalid email", async () => {
    const res = await app.request("/api/portal/magic-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "not-an-email",
      }),
    });

    expect(res.status).toBe(400);
    const json = (await res.json()) as { success: boolean };
    expect(json.success).toBe(false);
  });
});
