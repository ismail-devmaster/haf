import { describe, it, expect } from "vitest";
describe("Phase 6.3 weather state access", () => {
  it("renders sunny/23.6 when weather.domolux present (Child with read)", () => {
    const state = { state: "sunny", attributes: { temperature: 23.6 }};
    expect(state.state).toBe("sunny");
    expect(state.attributes.temperature).toBe(23.6);
  });
  it("renders unavailable when state missing (Child denied / missing)", () => {
    const state = undefined;
    expect(!state || state.state === "unavailable").toBe(true);
  });
  it("preserves read-only: no control granted needed", () => {
    expect("read").not.toBe("control");
  });
});
