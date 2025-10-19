/**
 * Level Builder Validation
 * Schema validation and level integrity checks
 */

import type { Level, GitStateSnapshot, TutorialStep } from '@/tutorial/types';

/**
 * Validation error type
 */
export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

/**
 * Validation result
 */
export interface LevelValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

/**
 * Validate a level object against the schema
 */
export function validateLevel(level: Partial<Level>): LevelValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Required fields
  if (!level.id || typeof level.id !== 'string' || level.id.trim() === '') {
    errors.push({ field: 'id', message: 'Level ID is required and must be a non-empty string', severity: 'error' });
  } else if (!/^[a-z0-9-_]+$/i.test(level.id)) {
    errors.push({ field: 'id', message: 'Level ID must contain only alphanumeric characters, hyphens, and underscores', severity: 'error' });
  }

  if (!level.name || typeof level.name !== 'object' || Object.keys(level.name).length === 0) {
    errors.push({ field: 'name', message: 'Level name is required and must have at least one locale', severity: 'error' });
  } else if (!level.name.en_US) {
    warnings.push({ field: 'name', message: 'Level name should have an English (en_US) translation', severity: 'warning' });
  }

  if (!level.description || typeof level.description !== 'object' || Object.keys(level.description).length === 0) {
    errors.push({ field: 'description', message: 'Level description is required and must have at least one locale', severity: 'error' });
  } else if (!level.description.en_US) {
    warnings.push({ field: 'description', message: 'Level description should have an English (en_US) translation', severity: 'warning' });
  }

  if (!level.difficulty || !['intro', 'beginner', 'intermediate', 'advanced'].includes(level.difficulty)) {
    errors.push({ field: 'difficulty', message: 'Difficulty must be one of: intro, beginner, intermediate, advanced', severity: 'error' });
  }

  if (typeof level.order !== 'number' || level.order < 0) {
    errors.push({ field: 'order', message: 'Order must be a non-negative number', severity: 'error' });
  }

  // Git state validation
  if (!level.initialState) {
    errors.push({ field: 'initialState', message: 'Initial state is required', severity: 'error' });
  } else {
    const stateErrors = validateGitState(level.initialState, 'initialState');
    errors.push(...stateErrors);
  }

  if (!level.goalState) {
    errors.push({ field: 'goalState', message: 'Goal state is required', severity: 'error' });
  } else {
    const stateErrors = validateGitState(level.goalState, 'goalState');
    errors.push(...stateErrors);
  }

  // Tutorial steps
  if (!level.tutorialSteps || !Array.isArray(level.tutorialSteps) || level.tutorialSteps.length === 0) {
    errors.push({ field: 'tutorialSteps', message: 'At least one tutorial step is required', severity: 'error' });
  } else {
    level.tutorialSteps.forEach((step, index) => {
      const stepErrors = validateTutorialStep(step, index);
      errors.push(...stepErrors);
    });
  }

  // Solution commands
  if (!level.solutionCommands || !Array.isArray(level.solutionCommands) || level.solutionCommands.length === 0) {
    warnings.push({ field: 'solutionCommands', message: 'Solution commands are recommended for proper scoring', severity: 'warning' });
  }

  // Hints
  if (!level.hints || !Array.isArray(level.hints) || level.hints.length === 0) {
    warnings.push({ field: 'hints', message: 'Hints are recommended to help users', severity: 'warning' });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate Git state snapshot
 */
function validateGitState(state: GitStateSnapshot, fieldName: string): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!state.commits || !Array.isArray(state.commits)) {
    errors.push({ field: `${fieldName}.commits`, message: 'Commits must be an array', severity: 'error' });
  } else if (state.commits.length === 0) {
    errors.push({ field: `${fieldName}.commits`, message: 'At least one commit is required', severity: 'error' });
  } else {
    // Validate each commit
    state.commits.forEach((commit, index) => {
      if (!commit.id || typeof commit.id !== 'string') {
        errors.push({ field: `${fieldName}.commits[${index}].id`, message: 'Commit ID is required', severity: 'error' });
      }
      if (!Array.isArray(commit.parents)) {
        errors.push({ field: `${fieldName}.commits[${index}].parents`, message: 'Commit parents must be an array', severity: 'error' });
      }
      if (!commit.message || typeof commit.message !== 'string') {
        errors.push({ field: `${fieldName}.commits[${index}].message`, message: 'Commit message is required', severity: 'error' });
      }
      if (typeof commit.timestamp !== 'number') {
        errors.push({ field: `${fieldName}.commits[${index}].timestamp`, message: 'Commit timestamp must be a number', severity: 'error' });
      }
    });
  }

  if (!state.branches || !Array.isArray(state.branches)) {
    errors.push({ field: `${fieldName}.branches`, message: 'Branches must be an array', severity: 'error' });
  } else if (state.branches.length === 0) {
    errors.push({ field: `${fieldName}.branches`, message: 'At least one branch is required', severity: 'error' });
  } else {
    state.branches.forEach((branch, index) => {
      if (!branch.name || typeof branch.name !== 'string') {
        errors.push({ field: `${fieldName}.branches[${index}].name`, message: 'Branch name is required', severity: 'error' });
      }
      if (!branch.target || typeof branch.target !== 'string') {
        errors.push({ field: `${fieldName}.branches[${index}].target`, message: 'Branch target is required', severity: 'error' });
      }
    });
  }

  if (!state.tags || !Array.isArray(state.tags)) {
    errors.push({ field: `${fieldName}.tags`, message: 'Tags must be an array', severity: 'error' });
  }

  if (!state.head || typeof state.head !== 'object') {
    errors.push({ field: `${fieldName}.head`, message: 'HEAD state is required', severity: 'error' });
  } else {
    if (!state.head.type || !['branch', 'detached'].includes(state.head.type)) {
      errors.push({ field: `${fieldName}.head.type`, message: 'HEAD type must be "branch" or "detached"', severity: 'error' });
    }
    if (state.head.type === 'branch' && (!state.head.name || typeof state.head.name !== 'string')) {
      errors.push({ field: `${fieldName}.head.name`, message: 'HEAD name is required for branch type', severity: 'error' });
    }
    if (state.head.type === 'detached' && (!state.head.commit || typeof state.head.commit !== 'string')) {
      errors.push({ field: `${fieldName}.head.commit`, message: 'HEAD commit is required for detached type', severity: 'error' });
    }
  }

  return errors;
}

/**
 * Validate tutorial step
 */
function validateTutorialStep(step: TutorialStep, index: number): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!step.type || !['dialog', 'demonstration', 'challenge'].includes(step.type)) {
    errors.push({ field: `tutorialSteps[${index}].type`, message: 'Tutorial step type must be "dialog", "demonstration", or "challenge"', severity: 'error' });
  }

  if (!step.id || typeof step.id !== 'string') {
    errors.push({ field: `tutorialSteps[${index}].id`, message: 'Tutorial step ID is required', severity: 'error' });
  }

  // Type-specific validation
  switch (step.type) {
    case 'dialog':
      if (!step.title || typeof step.title !== 'object' || Object.keys(step.title).length === 0) {
        errors.push({ field: `tutorialSteps[${index}].title`, message: 'Dialog title is required', severity: 'error' });
      }
      if (!step.content || typeof step.content !== 'object' || Object.keys(step.content).length === 0) {
        errors.push({ field: `tutorialSteps[${index}].content`, message: 'Dialog content is required', severity: 'error' });
      }
      break;
    case 'demonstration':
      if (!step.beforeText || typeof step.beforeText !== 'object') {
        errors.push({ field: `tutorialSteps[${index}].beforeText`, message: 'Demonstration beforeText is required', severity: 'error' });
      }
      if (!step.demonstrationCommand || typeof step.demonstrationCommand !== 'string') {
        errors.push({ field: `tutorialSteps[${index}].demonstrationCommand`, message: 'Demonstration command is required', severity: 'error' });
      }
      if (!step.afterText || typeof step.afterText !== 'object') {
        errors.push({ field: `tutorialSteps[${index}].afterText`, message: 'Demonstration afterText is required', severity: 'error' });
      }
      if (!Array.isArray(step.setupCommands)) {
        errors.push({ field: `tutorialSteps[${index}].setupCommands`, message: 'Setup commands must be an array', severity: 'error' });
      }
      break;
    case 'challenge':
      if (!step.instructions || typeof step.instructions !== 'object') {
        errors.push({ field: `tutorialSteps[${index}].instructions`, message: 'Challenge instructions are required', severity: 'error' });
      }
      if (!Array.isArray(step.hints)) {
        errors.push({ field: `tutorialSteps[${index}].hints`, message: 'Challenge hints must be an array', severity: 'error' });
      }
      break;
  }

  return errors;
}

/**
 * Check if a level ID is valid and unique
 */
export function isValidLevelId(id: string): boolean {
  return /^[a-z0-9-_]+$/i.test(id) && id.trim().length > 0;
}

/**
 * Sanitize level ID
 */
export function sanitizeLevelId(id: string): string {
  return id
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/--+/g, '-')
    .replace(/^-|-$/g, '');
}
