import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { LgbSvgDefs } from "../LgbSvgDefs";
import { lgbSkin } from "../skin";

describe("LgbSvgDefs Component", () => {
  it("should render SVG defs element", () => {
    const { container } = render(
      <svg>
        <LgbSvgDefs skin={lgbSkin} />
      </svg>
    );

    const defs = container.querySelector("defs");
    expect(defs).toBeInTheDocument();
  });

  it("should render all marker definitions from skin", () => {
    const { container } = render(
      <svg>
        <LgbSvgDefs skin={lgbSkin} />
      </svg>
    );

    // Check that markers are rendered
    lgbSkin.markers.forEach((marker) => {
      const markerElement = container.querySelector(`marker#${marker.id}`);
      expect(markerElement).toBeInTheDocument();
      expect(markerElement).toHaveAttribute("viewBox", marker.viewBox);
      expect(markerElement).toHaveAttribute("refX", String(marker.refX));
      expect(markerElement).toHaveAttribute("refY", String(marker.refY));
      expect(markerElement).toHaveAttribute("markerWidth", String(marker.markerWidth));
      expect(markerElement).toHaveAttribute("markerHeight", String(marker.markerHeight));
      expect(markerElement).toHaveAttribute("orient", marker.orient);
    });
  });

  it("should render lgb-arrowhead marker", () => {
    const { container } = render(
      <svg>
        <LgbSvgDefs skin={lgbSkin} />
      </svg>
    );

    const arrowhead = container.querySelector("marker#lgb-arrowhead");
    expect(arrowhead).toBeInTheDocument();
  });

  it("should render lgb-arrowhead-copy marker", () => {
    const { container } = render(
      <svg>
        <LgbSvgDefs skin={lgbSkin} />
      </svg>
    );

    const arrowheadCopy = container.querySelector("marker#lgb-arrowhead-copy");
    expect(arrowheadCopy).toBeInTheDocument();
  });

  it("should have aria-hidden on markers", () => {
    const { container } = render(
      <svg>
        <LgbSvgDefs skin={lgbSkin} />
      </svg>
    );

    const markers = container.querySelectorAll("marker");
    markers.forEach((marker) => {
      expect(marker).toHaveAttribute("aria-hidden", "true");
    });
  });
});
