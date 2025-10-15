import type { Skin } from "../types";

/**
 * LGB Skin Configuration
 * 
 * Defines the visual appearance for the LGB (look & feel) theme.
 * Includes node sizing, edge styling, labels, SVG markers, and CI indicators.
 */
export const lgbSkin: Skin = {
  id: "lgb",
  name: "LGB",
  node: {
    radius: 8,
    strokeWidth: 2,
  },
  edge: {
    strokeWidth: 2,
    dashArray: "4 2", // For copy/dashed edges
  },
  label: {
    fontFamily: "var(--font-sans, ui-sans-serif, system-ui, sans-serif)",
    fontSize: 12,
    fontWeight: 400,
  },
  markers: [
    {
      id: "lgb-arrowhead",
      content: '<path d="M 0 0 L 6 3 L 0 6 z" fill="var(--lgb-edge-stroke)" />',
      viewBox: "0 0 6 6",
      refX: 6,
      refY: 3,
      markerWidth: 6,
      markerHeight: 6,
      orient: "auto",
    },
    {
      id: "lgb-arrowhead-copy",
      content: '<path d="M 0 0 L 6 3 L 0 6 z" fill="var(--lgb-edge-copy-stroke)" stroke="var(--lgb-edge-copy-stroke)" stroke-dasharray="2 1" />',
      viewBox: "0 0 6 6",
      refX: 6,
      refY: 3,
      markerWidth: 6,
      markerHeight: 6,
      orient: "auto",
    },
  ],
  ci: {
    offsetX: 10,
    offsetY: -10,
    size: 8,
  },
  className: "lgb-skin",
};
