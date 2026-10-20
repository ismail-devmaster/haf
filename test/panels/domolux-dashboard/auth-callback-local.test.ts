import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getConnectionUrl } from "../../../src/data/auth";

describe("auth-callback local origin", () => {
  const origLocation = globalThis.location;

  beforeEach(() => {
    Object.defineProperty(globalThis, "location", {
      value: {
        protocol: "http:",
        host: "localhost:8124",
        hostname: "localhost",
        search: "",
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

  it("preserves internal URL for local access", () => {
    const url = getConnectionUrl();
    expect(url).toBe("http://192.168.100.92:8123");
    expect(url).not.toContain("ha.domolux.dpdns.org");
  });
});
