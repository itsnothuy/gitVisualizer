/**
 * Skin type definitions for graph visualization
 * Defines the interface for customizing the look & feel of the commit graph
 */

/**
 * SVG marker definition for arrowheads and other reusable shapes
 */
export interface SvgMarkerDef {
  id: string;
  /** SVG path data or element definition */
  content: string;
  /** ViewBox dimensions */
  viewBox?: string;
  /** Marker reference point */
  refX?: number;
  refY?: number;
  /** Marker dimensions */
  markerWidth?: number;
  markerHeight?: number;
  /** Marker orientation */
  orient?: string | "auto";
}

/**
 * Skin configuration for graph visualization
 * Controls visual appearance of nodes, edges, labels, and status indicators
 */
export interface Skin {
  /** Unique identifier for the skin */
  id: string;
  /** Human-readable name */
  name: string;
  /** Node appearance */
  node: {
    /** Node radius in pixels */
    radius: number;
    /** Stroke width in pixels */
    strokeWidth: number;
  };
  /** Edge appearance */
  edge: {
    /** Edge stroke width in pixels */
    strokeWidth: number;
    /** Dash array for "copy" or dashed edges */
    dashArray?: string;
  };
  /** Label styling */
  label: {
    /** Font family */
    fontFamily: string;
    /** Font size in pixels */
    fontSize: number;
    /** Font weight */
    fontWeight: string | number;
  };
  /** SVG marker definitions (arrowheads, etc.) */
  markers: SvgMarkerDef[];
  /** CI status glyph configurations (placeholders) */
  ci: {
    /** Offset from node center for CI status indicator */
    offsetX: number;
    offsetY: number;
    /** Size of CI status glyph */
    size: number;
  };
  /** Optional CSS class name for custom styling */
  className?: string;
}
