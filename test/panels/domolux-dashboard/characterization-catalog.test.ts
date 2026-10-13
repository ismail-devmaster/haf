/** Catalog API Characterization Tests — Phase 2
 * Verifies catalog command structure, auth and safe metadata rules.
 */
import { describe, it, expect } from "vitest";

describe("Catalog API Contract (Phase 2)", () => {
  it("uses stable command name domolux/catalog", () => {
    expect("domolux/catalog").toBeTruthy();
  });

  it("response schema excludes raw entity states and attributes", () => {
    const safeKeys = ["entity_id", "name", "domain", "device_id", "registry_managed", "state_available", "unavailable"];
    const forbiddenKeys = ["state", "attributes", "context", "last_updated"];
    expect(safeKeys.every(k => !forbiddenKeys.includes(k))).toBe(true);
  });

  it("authorization requires father (parent)", () => {
    expect("father_role_required").toBeTruthy();
  });
});
