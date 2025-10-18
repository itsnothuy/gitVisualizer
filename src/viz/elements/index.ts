/**
 * Visual elements for Git DAG rendering
 * 
 * This module provides class-based visual elements for rendering Git commits,
 * branches, tags, and edges in an SVG-based visualization.
 */

export { VisBase, type GitEntity, type Visuals } from './VisBase';
export { VisNode, type CommitNode } from './VisNode';
export { VisEdge, type EdgeEntity, createEdgesForCommit } from './VisEdge';
export { VisTag, type TagEntity, type TagType, type TagPlacement } from './VisTag';
export { VisBranch, type BranchEntity, calculateBranchIndices } from './VisBranch';
export {
  gridToScreen,
  screenToGrid,
  gridDistance,
  ROW_WIDTH,
  ROW_HEIGHT,
  type GridPosition,
  type ScreenCoords,
} from './grid';
