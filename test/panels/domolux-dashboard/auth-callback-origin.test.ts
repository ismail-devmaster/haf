import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getConnectionUrl } from "../../../src/data/auth";

describe("auth-callback external origin", () => {
  const origLocation = globalThis.location;

  beforeEach(() => {
    // Mock external browser returning after OAuth callback
    Object.defineProperty(globalThis, "location", {
      value: {
        protocol: "https:",
        host: "ha.domolux.dpdns.org",
        hostname: "ha.domolux.dpdns.org",
        search: "?auth_callback=1&code=abc",
        pathname: "/",
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(globalThis, "location", {
      value: origLocation,
      writable: true,
      configurable: true,
    });
  });

  it("selects external URL after auth_callback, not LAN IP", () => {
    const url = getConnectionUrl();
    expect(url).toBe("https://ha.domolux.dpdns.org");
    expect(url).not.toContain("192.168.");
  });
});
