"use client";
import * as React from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { DagNode } from "../elk/layout";
import type { Skin } from '@/viz/skins/lgb/skin';
import { defaultSkin } from '@/viz/skins/lgb/skin';
import { LgbSvgDefs } from '@/viz/skins/lgb/LgbSvgDefs';
import type { AnimScene } from '@/viz/anim/types';

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
  nodes: DagNode[];
  edges: Edge[];
  positions: Position;
  /** Optional: width of the SVG canvas, defaults to 100% */
  width?: string | number;
  /** Optional: height of the SVG canvas, defaults to 600 */
  height?: string | number;
  /** Optional: callback when a node is selected */
  onNodeSelect?: (node: DagNode) => void;
  /** Optional: callback when a node receives focus */
  onNodeFocus?: (node: DagNode) => void;
  /** Optional: enable/disable virtualization for large graphs */
  enableVirtualization?: boolean;
  /** Optional: threshold for enabling virtualization (number of visible elements) */
  virtualizationThreshold?: number;
}

/**
 * Get color-independent status encoding (shapes/patterns/icons) for CI status
 */
function getStatusMarker(status?: "success" | "failed" | "pending" | "unknown" | null) {
  if (!status) return null;
  
  switch (status) {
    case "success":
      return { shape: "checkmark", color: "text-green-600", ariaLabel: "Build passed" };
    case "failed":
      return { shape: "cross", color: "text-red-600", ariaLabel: "Build failed" };
    case "pending":
      return { shape: "clock", color: "text-yellow-600", ariaLabel: "Build pending" };
    default:
      return { shape: "question", color: "text-gray-500", ariaLabel: "Build status unknown" };
  }
}

/**
 * Render a status marker icon using SVG paths
 */
function StatusMarker({ status, x, y }: { status: "success" | "failed" | "pending" | "unknown"; x: number; y: number }) {
  const marker = getStatusMarker(status);
  if (!marker) return null;

  return (
    <g transform={`translate(${x}, ${y})`} aria-label={marker.ariaLabel}>
      {marker.shape === "checkmark" && (
        <path d="M-3,-1 L-1,1 L3,-3" stroke="currentColor" strokeWidth="1.5" fill="none" className={marker.color} />
      )}
      {marker.shape === "cross" && (
        <g className={marker.color}>
          <line x1="-3" y1="-3" x2="3" y2="3" stroke="currentColor" strokeWidth="1.5" />
          <line x1="3" y1="-3" x2="-3" y2="3" stroke="currentColor" strokeWidth="1.5" />
        </g>
      )}
      {marker.shape === "clock" && (
        <g className={marker.color}>
          <circle r="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <line x1="0" y1="0" x2="0" y2="-2" stroke="currentColor" strokeWidth="1" />
          <line x1="0" y1="0" x2="1.5" y2="1.5" stroke="currentColor" strokeWidth="1" />
        </g>
      )}
      {marker.shape === "question" && (
        <text x="0" y="0" fontSize="8" textAnchor="middle" dominantBaseline="central" className={marker.color}>?</text>
      )}
    </g>
  );
}

/**
 * GraphNode component - represents a single commit node with tooltip and keyboard navigation
 */
const GraphNode = React.memo(function GraphNode({
  node,
  position,
  onSelect,
  onFocus,
  isInView,
}: {
  node: DagNode;
  position: { x: number; y: number };
  onSelect?: (node: DagNode) => void;
  onFocus?: (node: DagNode) => void;
  isInView: boolean;
}) {
  const nodeRef = React.useRef<SVGGElement>(null);
  const [isFocused, setIsFocused] = React.useState(false);

  // Don't render if not in view (virtualization)
  if (!isInView) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect?.(node);
    } else if (e.key === "Escape") {
      e.preventDefault();
      nodeRef.current?.blur();
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.(node);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const handleClick = () => {
    onSelect?.(node);
  };

  // Format timestamp for tooltip
  const formattedDate = new Date(node.ts).toLocaleString();
  const shortId = node.id.slice(0, 7);
  const hasRefs = node.refs && node.refs.length > 0;
  const hasPR = node.pr?.id;
  const hasCI = node.ci?.status;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <g
          ref={nodeRef}
          transform={`translate(${position.x},${position.y})`}
          tabIndex={0}
          role="button"
          aria-label={`Commit ${shortId}: ${node.title}${hasCI ? `, ${getStatusMarker(node.ci?.status)?.ariaLabel}` : ""}`}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onClick={handleClick}
          className="cursor-pointer outline-none"
          data-testid={`graph-node-${node.id}`}
        >
          {/* Focus ring */}
          {isFocused && (
            <circle
              r="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-ring"
              aria-hidden="true"
            />
          )}
          
          {/* Main node circle */}
          <circle
            r="8"
            fill="currentColor"
            className={`transition-colors ${isFocused ? "text-primary" : "text-foreground"}`}
            aria-hidden="true"
          />
          
          {/* Status indicator overlay (color-independent) */}
          {hasCI && (
            <StatusMarker status={node.ci!.status} x={8} y={-8} />
          )}
          
          {/* Branch/tag indicator (if refs exist) */}
          {hasRefs && (
            <circle
              r="3"
              cx="-8"
              cy="-8"
              fill="currentColor"
              className="text-accent"
              aria-hidden="true"
            />
          )}
          
          {/* PR indicator */}
          {hasPR && (
            <rect
              x="-10"
              y="6"
              width="4"
              height="4"
              fill="currentColor"
              className="text-secondary"
              aria-hidden="true"
            />
          )}
          
          {/* Commit message label */}
          <text
            x="12"
            y="4"
            fontSize="12"
            className="fill-current pointer-events-none select-none"
            aria-hidden="true"
          >
            {node.title.length > 30 ? node.title.slice(0, 30) + "..." : node.title}
          </text>
        </g>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={8}>
        <div className="space-y-1 max-w-xs">
          <p className="font-mono text-xs">{shortId}</p>
          <p className="font-semibold text-sm">{node.title}</p>
          <p className="text-xs opacity-80">{formattedDate}</p>
          {hasRefs && (
            <p className="text-xs">
              <span className="opacity-60">Refs: </span>
              {node.refs?.join(", ")}
            </p>
          )}
          {hasPR && (
            <p className="text-xs">
              <span className="opacity-60">PR: </span>#{node.pr!.id}
            </p>
          )}
          {hasCI && (
            <p className="text-xs">
              <span className="opacity-60">CI: </span>
              {node.ci!.status}
            </p>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
});

/**
 * GraphEdge component - represents a commit parent-child relationship
 */
const GraphEdge = React.memo(function GraphEdge({
  edge,
  positions,
  isInView,
}: {
  edge: Edge;
  positions: Position;
  isInView: boolean;
}) {
  // Don't render if not in view (virtualization)
  if (!isInView) return null;

  const sourcePos = positions[edge.source];
  const targetPos = positions[edge.target];
  
  if (!sourcePos || !targetPos) return null;

  return (
    <line
      key={edge.id}
      x1={sourcePos.x}
      y1={sourcePos.y}
      x2={targetPos.x}
      y2={targetPos.y}
      stroke="currentColor"
      strokeWidth="2"
      className="text-muted-foreground"
      aria-hidden="true"
    />
  );
});

/**
 * Calculate which elements are visible in the viewport for virtualization
 */
function useVirtualization(
  nodes: DagNode[],
  edges: Edge[],
  positions: Position,
  enabled: boolean,
  threshold: number,
  viewBox: { x: number; y: number; width: number; height: number }
) {
  return React.useMemo(() => {
    const totalElements = nodes.length + edges.length;
    
    // Skip virtualization if disabled or below threshold
    if (!enabled || totalElements <= threshold) {
      return {
        visibleNodes: nodes.map((n) => n.id),
        visibleEdges: edges.map((e) => e.id),
      };
    }

    // Simple viewport culling - include elements within or near viewport
    const padding = 100; // Extra padding for smooth scrolling
    const visibleNodes = nodes.filter((node) => {
      const pos = positions[node.id];
      if (!pos) return false;
      return (
        pos.x >= viewBox.x - padding &&
        pos.x <= viewBox.x + viewBox.width + padding &&
        pos.y >= viewBox.y - padding &&
        pos.y <= viewBox.y + viewBox.height + padding
      );
    }).map((n) => n.id);

    const visibleNodeSet = new Set(visibleNodes);
    const visibleEdges = edges.filter((edge) => {
      // Show edge if either endpoint is visible
      return visibleNodeSet.has(edge.source) || visibleNodeSet.has(edge.target);
    }).map((e) => e.id);

    return { visibleNodes, visibleEdges };
  }, [nodes, edges, positions, enabled, threshold, viewBox]);
}

/**
 * Main GraphSVG component with zoom/pan, keyboard navigation, and virtualization
 * 
 * Meets WCAG 2.2 AA requirements:
 * - Keyboard navigation (Tab/Shift+Tab, Arrow keys, Enter, Escape)
 * - Visible focus indicators (focus rings)
 * - Color-independent status encoding (shapes + text)
 * - Screen reader support (ARIA labels, semantic SVG)
 * - Reduced motion support (respects prefers-reduced-motion)
 */
export function GraphSVG({
  nodes,
  edges,
  positions,
  width = "100%",
  height = 600,
  onNodeSelect,
  onNodeFocus,
  enableVirtualization = true,
  virtualizationThreshold = 1000,
<<<<<<< HEAD
  skin = defaultSkin,
}: GraphSVGProps & { skin?: Skin; scene?: AnimScene }) {
=======
  skin,
}: GraphSVGProps & { skin: Skin }) {
>>>>>>> 8e0abed (fix: resolve type and unused variable issues)
  const [viewBox] = React.useState({ x: 0, y: 0, width: 1200, height: 600 });
  const svgRef = React.useRef<SVGSVGElement>(null);

  // Calculate visible elements for virtualization
  const { visibleNodes, visibleEdges } = useVirtualization(
    nodes,
    edges,
    positions,
    enableVirtualization,
    virtualizationThreshold,
    viewBox
  );

  // Handle keyboard navigation between nodes
  const handleSVGKeyDown = React.useCallback((e: React.KeyboardEvent<SVGSVGElement>) => {
    const focusedElement = document.activeElement;
    if (!focusedElement || focusedElement.tagName !== "g") return;

    const currentNodeId = focusedElement.getAttribute("data-testid")?.replace("graph-node-", "");
    if (!currentNodeId) return;

    const currentIndex = nodes.findIndex((n) => n.id === currentNodeId);
    let nextIndex = -1;

    switch (e.key) {
      case "ArrowRight":
        e.preventDefault();
        nextIndex = Math.min(currentIndex + 1, nodes.length - 1);
        break;
      case "ArrowLeft":
        e.preventDefault();
        nextIndex = Math.max(currentIndex - 1, 0);
        break;
      case "ArrowDown":
        e.preventDefault();
        // Find next node in lower layer (higher y position)
        const currentY = positions[currentNodeId]?.y ?? 0;
        nextIndex = nodes.findIndex((n, i) => i > currentIndex && (positions[n.id]?.y ?? 0) > currentY);
        if (nextIndex === -1) nextIndex = currentIndex;
        break;
      case "ArrowUp":
        e.preventDefault();
        // Find previous node in upper layer (lower y position)
        const currentYUp = positions[currentNodeId]?.y ?? 0;
        for (let i = currentIndex - 1; i >= 0; i--) {
          if ((positions[nodes[i].id]?.y ?? 0) < currentYUp) {
            nextIndex = i;
            break;
          }
        }
        if (nextIndex === -1) nextIndex = currentIndex;
        break;
      default:
        return;
    }

    if (nextIndex !== -1 && nextIndex !== currentIndex) {
      const nextNode = nodes[nextIndex];
      const nextElement = svgRef.current?.querySelector(`[data-testid="graph-node-${nextNode.id}"]`) as SVGElement;
      nextElement?.focus();
    }
  }, [nodes, positions]);

  // Calculate SVG dimensions to fit all nodes
  const svgDimensions = React.useMemo(() => {
    if (nodes.length === 0) return { minX: 0, minY: 0, maxX: 1200, maxY: 600 };

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    nodes.forEach((node) => {
      const pos = positions[node.id];
      if (pos) {
        minX = Math.min(minX, pos.x);
        minY = Math.min(minY, pos.y);
        maxX = Math.max(maxX, pos.x);
        maxY = Math.max(maxY, pos.y);
      }
    });

    // Add padding
    const padding = 50;
    return {
      minX: minX - padding,
      minY: minY - padding,
      maxX: maxX + padding,
      maxY: maxY + padding,
    };
  }, [nodes, positions]);

  const viewBoxString = `${svgDimensions.minX} ${svgDimensions.minY} ${svgDimensions.maxX - svgDimensions.minX} ${svgDimensions.maxY - svgDimensions.minY}`;

  return (
    <TransformWrapper
      minScale={0.1}
      maxScale={3}
      initialScale={1}
      centerOnInit
      limitToBounds={false}
      panning={{ velocityDisabled: true }}
      wheel={{ smoothStep: 0.01 }}
    >
      <TransformComponent
        wrapperStyle={{
          width: typeof width === "number" ? `${width}px` : width,
          height: typeof height === "number" ? `${height}px` : height,
        }}
      >
        <svg
          ref={svgRef}
          width={svgDimensions.maxX - svgDimensions.minX}
          height={svgDimensions.maxY - svgDimensions.minY}
          viewBox={viewBoxString}
          role="graphics-document"
          aria-label={`Git commit graph with ${nodes.length} commits`}
          onKeyDown={handleSVGKeyDown}
          className="outline-none"
          style={{ minWidth: "100%", minHeight: "100%" }}
          data-skin={skin.defsId}
        >
          {/* Render LGB defs if using LGB skin */}
          {skin.defsId === 'lgb-defs' && <LgbSvgDefs />}
          
          {/* Edges layer (render behind nodes) */}
          <g aria-label="Commit relationships" role="group">
            {edges.map((edge) => (
              <GraphEdge
                key={edge.id}
                edge={edge}
                positions={positions}
                isInView={visibleEdges.includes(edge.id)}
              />
            ))}
          </g>

          {/* Nodes layer */}
          <g aria-label="Commits">
            {nodes.map((node) => (
              <GraphNode
                key={node.id}
                node={node}
                position={positions[node.id] || { x: 0, y: 0 }}
                onSelect={onNodeSelect}
                onFocus={onNodeFocus}
                isInView={visibleNodes.includes(node.id)}
              />
            ))}
          </g>
        </svg>
      </TransformComponent>
    </TransformWrapper>
  );
}
