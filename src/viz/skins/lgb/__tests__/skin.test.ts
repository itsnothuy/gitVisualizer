import { describe, it, expect } from "vitest";
import { lgbSkin } from "../skin";

describe("LGB Skin Configuration", () => {
  it("should have correct id and name", () => {
    expect(lgbSkin.id).toBe("lgb");
    expect(lgbSkin.name).toBe("LGB");
  });

  it("should define node configuration", () => {
    expect(lgbSkin.node).toBeDefined();
    expect(lgbSkin.node.radius).toBe(8);
    expect(lgbSkin.node.strokeWidth).toBe(2);
  });

  it("should define edge configuration", () => {
    expect(lgbSkin.edge).toBeDefined();
    expect(lgbSkin.edge.strokeWidth).toBe(2);
    expect(lgbSkin.edge.dashArray).toBe("4 2");
  });

  it("should define label configuration", () => {
    expect(lgbSkin.label).toBeDefined();
    expect(lgbSkin.label.fontFamily).toContain("sans-serif");
    expect(lgbSkin.label.fontSize).toBe(12);
    expect(lgbSkin.label.fontWeight).toBe(400);
  });

  it("should define CI indicator configuration", () => {
    expect(lgbSkin.ci).toBeDefined();
    expect(lgbSkin.ci.offsetX).toBe(10);
    expect(lgbSkin.ci.offsetY).toBe(-10);
    expect(lgbSkin.ci.size).toBe(8);
  });

  it("should have marker definitions", () => {
    expect(lgbSkin.markers).toBeDefined();
    expect(lgbSkin.markers.length).toBeGreaterThan(0);
  });

  it("should include arrowhead markers", () => {
    const arrowhead = lgbSkin.markers.find((m) => m.id === "lgb-arrowhead");
    expect(arrowhead).toBeDefined();
    expect(arrowhead?.viewBox).toBe("0 0 6 6");
    expect(arrowhead?.orient).toBe("auto");
  });

  it("should include copy-style arrowhead marker", () => {
    const arrowheadCopy = lgbSkin.markers.find((m) => m.id === "lgb-arrowhead-copy");
    expect(arrowheadCopy).toBeDefined();
    expect(arrowheadCopy?.viewBox).toBe("0 0 6 6");
  });

  it("should have className for styling", () => {
    expect(lgbSkin.className).toBe("lgb-skin");
  });
});
