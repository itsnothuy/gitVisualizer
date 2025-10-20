/**
 * Sample Repository Types
 * 
 * Type definitions for sample Git repositories that can be loaded
 * without requiring local files.
 */

export interface SampleMetadata {
  id: string;
  name: string;
  description: string;
  file: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  highlights: string[];
  commits: number;
  branches: number;
  tags: number;
}

export interface SampleCollection {
  samples: SampleMetadata[];
}

export interface LoadSampleOptions {
  onProgress?: (progress: {
    stage: "downloading" | "decompressing" | "loading";
    percentage: number;
    message: string;
  }) => void;
  signal?: AbortSignal;
}
