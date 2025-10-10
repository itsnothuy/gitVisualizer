"use client";
import * as React from "react";

type Node = {
  id: string;
  title: string;
};

type Edge = {
  id: string;
  source: string;
  target: string;
};

type Position = {
  [id: string]: {
    x: number;
    y: number;
  };
};

interface GraphSVGProps {
  nodes: Node[];
  edges: Edge[];
  positions: Position;
}

export function GraphSVG({ nodes, edges, positions }: GraphSVGProps) {
  // virtualize later; for ≤ ~10k elements SVG is OK, beyond that switch to Canvas/WebGL
  // (perf evidence in Section 1) 
  return (
    <svg width="100%" height="600" role="graphics-document" aria-label="Commit graph">
      {edges.map((e) => (
        <line key={e.id} x1={positions[e.source].x} y1={positions[e.source].y}
              x2={positions[e.target].x} y2={positions[e.target].y}
              stroke="currentColor" strokeWidth="2" />
      ))}
      {nodes.map((n) => (
        <g key={n.id} transform={`translate(${positions[n.id].x},${positions[n.id].y})`} tabIndex={0}>
          <circle r="8" />
          <text x="12" y="4">{n.title}</text>
        </g>
      ))}
    </svg>
  );
}
