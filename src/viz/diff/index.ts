/**
 * Tree comparison and diff exports
 * Central export point for diff functionality
 */

export {
  compareStates,
  classifyChange,
  getAffectedNodes,
  type ChangeType,
  type Change,
  type CommitAddedChange,
  type CommitRemovedChange,
  type BranchAddedChange,
  type BranchRemovedChange,
  type BranchMovedChange,
  type HeadMovedChange,
  type MergeChange,
  type RebaseChange,
  type CherryPickChange,
  type DiffResult,
} from './treeCompare';
