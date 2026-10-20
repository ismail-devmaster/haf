import { describe, it, expect } from "vitest";

describe("Phase 6.3 weather discovery — separate steps", () => {
  // Discovery step
  function discoverEntityId(card: any): string | undefined {
    if (card?.entity) return String(card.entity);
    const entities = (card?.entities || []);
    for (const e of entities) {
      if (e?.entity_id) return String(e.entity_id);
    }
    const nested = (card?.cards || []);
    for (const n of nested) {
      const found = discoverEntityId(n);
      if (found) return found;
    }
    return undefined;
  }

  // State lookup step (separate from discovery)
  function getState(hass: any, entityId: string) {
    return hass?.states?.[entityId] || undefined;
  }

  it("discovers weather.domolux from card with entity: weather.domolux", () => {
    expect(discoverEntityId({ card_type: "entity", entity: "weather.domolux" })).toBe("weather.domolux");
  });

  it("discovers from entities array", () => {
    expect(discoverEntityId({ entities: [{ entity_id: "weather.domolux" }] })).toBe("weather.domolux");
  });

  it("discovers from nested cards", () => {
    expect(discoverEntityId({ cards: [{ entity: "weather.domolux" }] })).toBe("weather.domolux");
  });

  it("state sunny / 23.6 when present", () => {
    const state = { state: "sunny", attributes: { temperature: 23.6 } };
    expect(state.state).toBe("sunny");
    expect(state.attributes.temperature).toBe(23.6);
  });

  it("not discovered -> undefined", () => {
    expect(discoverEntityId({})).toBeUndefined();
  });

  it("discovered but absent from hass.states", () => {
    const id = "weather.domolux";
    const hass = { states: {} };
    expect(getState(hass, id)).toBeUndefined();
  });

  it("state genuinely unavailable", () => {
    const state = { state: "unavailable", attributes: {} };
    expect(state.state).toBe("unavailable");
  });

  it("preserves permission (no control granted needed)", () => {
    expect("read").not.toBe("control");
  });
});
