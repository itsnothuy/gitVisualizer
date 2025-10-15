import * as React from "react";
import type { Skin } from "../types";

interface LgbSvgDefsProps {
  /** Skin configuration with marker definitions */
  skin: Skin;
}

/**
 * LgbSvgDefs - SVG Definitions Component
 * 
 * Renders SVG <defs> element containing marker definitions for arrowheads
 * and other reusable shapes specific to the LGB skin.
 * 
 * Must be rendered within an <svg> element.
 */
export function LgbSvgDefs({ skin }: LgbSvgDefsProps) {
  return (
    <defs>
      {skin.markers.map((marker) => (
        <marker
          key={marker.id}
          id={marker.id}
          viewBox={marker.viewBox}
          refX={marker.refX}
          refY={marker.refY}
          markerWidth={marker.markerWidth}
          markerHeight={marker.markerHeight}
          orient={marker.orient}
          aria-hidden="true"
        >
          <g dangerouslySetInnerHTML={{ __html: marker.content }} />
        </marker>
      ))}
    </defs>
  );
}
