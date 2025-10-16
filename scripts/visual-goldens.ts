/**
 * Visual Golden System for LGB Mode
 * 
 * Renders SVG goldens for LGB-style scenes and provides diff comparison
 * with tolerance for regression testing.
 */

import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

export interface SceneFrame {
  id: string;
  label: string;
  svgContent: string;
  timestamp: string;
}

export interface GoldenMetadata {
  sceneName: string;
  frames: SceneFrame[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Tolerance settings for SVG diff comparison
 */
export interface DiffTolerance {
  /** Ignore position differences smaller than this (px) */
  positionTolerance: number;
  /** Ignore opacity differences smaller than this */
  opacityTolerance: number;
  /** Ignore transform differences smaller than this */
  transformTolerance: number;
  /** Attributes to ignore in comparison */
  ignoreAttributes: string[];
}

const DEFAULT_TOLERANCE: DiffTolerance = {
  positionTolerance: 0.5,
  opacityTolerance: 0.01,
  transformTolerance: 0.5,
  ignoreAttributes: ['data-testid', 'id', 'aria-describedby'],
};

/**
 * Simple SVG structure normalizer
 * Strips whitespace and normalizes formatting for comparison
 */
function normalizeSvg(svgContent: string): string {
  return svgContent
    .replace(/\s+/g, ' ')
    .replace(/>\s+</g, '><')
    .replace(/\s*=\s*/g, '=')
    .trim();
}

/**
 * Extract numeric values from SVG for comparison
 */
function extractNumericValues(svg: string): Map<string, number[]> {
  const values = new Map<string, number[]>();
  
  // Extract x, y coordinates
  const xMatches = svg.matchAll(/\bx="([0-9.]+)"/g);
  const yMatches = svg.matchAll(/\by="([0-9.]+)"/g);
  const opacityMatches = svg.matchAll(/\bopacity="([0-9.]+)"/g);
  
  values.set('x', Array.from(xMatches).map(m => parseFloat(m[1])));
  values.set('y', Array.from(yMatches).map(m => parseFloat(m[1])));
  values.set('opacity', Array.from(opacityMatches).map(m => parseFloat(m[1])));
  
  return values;
}

/**
 * Compare two SVG strings with tolerance
 * Returns true if they match within tolerance
 */
export function compareSvgWithTolerance(
  actual: string,
  expected: string,
  tolerance: DiffTolerance = DEFAULT_TOLERANCE
): { match: boolean; diffs: string[] } {
  const diffs: string[] = [];
  
  // Normalize both SVGs
  const normalizedActual = normalizeSvg(actual);
  const normalizedExpected = normalizeSvg(expected);
  
  // Exact match after normalization
  if (normalizedActual === normalizedExpected) {
    return { match: true, diffs: [] };
  }
  
  // Extract and compare numeric values
  const actualValues = extractNumericValues(normalizedActual);
  const expectedValues = extractNumericValues(normalizedExpected);
  
  // Compare positions
  const actualX = actualValues.get('x') || [];
  const expectedX = expectedValues.get('x') || [];
  const actualY = actualValues.get('y') || [];
  const expectedY = expectedValues.get('y') || [];
  
  if (actualX.length !== expectedX.length) {
    diffs.push(`Different number of x coordinates: ${actualX.length} vs ${expectedX.length}`);
  } else {
    for (let i = 0; i < actualX.length; i++) {
      if (Math.abs(actualX[i] - expectedX[i]) > tolerance.positionTolerance) {
        diffs.push(`x[${i}]: ${actualX[i]} vs ${expectedX[i]} (diff: ${Math.abs(actualX[i] - expectedX[i])})`);
      }
    }
  }
  
  if (actualY.length !== expectedY.length) {
    diffs.push(`Different number of y coordinates: ${actualY.length} vs ${expectedY.length}`);
  } else {
    for (let i = 0; i < actualY.length; i++) {
      if (Math.abs(actualY[i] - expectedY[i]) > tolerance.positionTolerance) {
        diffs.push(`y[${i}]: ${actualY[i]} vs ${expectedY[i]} (diff: ${Math.abs(actualY[i] - expectedY[i])})`);
      }
    }
  }
  
  // Compare opacities
  const actualOpacity = actualValues.get('opacity') || [];
  const expectedOpacity = expectedValues.get('opacity') || [];
  
  if (actualOpacity.length === expectedOpacity.length) {
    for (let i = 0; i < actualOpacity.length; i++) {
      if (Math.abs(actualOpacity[i] - expectedOpacity[i]) > tolerance.opacityTolerance) {
        diffs.push(`opacity[${i}]: ${actualOpacity[i]} vs ${expectedOpacity[i]} (diff: ${Math.abs(actualOpacity[i] - expectedOpacity[i])})`);
      }
    }
  }
  
  return {
    match: diffs.length === 0,
    diffs,
  };
}

/**
 * Save golden SVG frames for a scene
 */
export async function saveGolden(
  sceneName: string,
  frames: SceneFrame[],
  outputDir: string = 'fixtures/lgb/goldens'
): Promise<void> {
  const goldenDir = resolve(outputDir);
  
  // Ensure directory exists
  if (!existsSync(goldenDir)) {
    await mkdir(goldenDir, { recursive: true });
  }
  
  const metadata: GoldenMetadata = {
    sceneName,
    frames,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  // Save metadata file
  const metadataPath = resolve(goldenDir, `${sceneName}.json`);
  await writeFile(metadataPath, JSON.stringify(metadata, null, 2));
  
  // Save individual SVG frames
  for (const frame of frames) {
    const svgPath = resolve(goldenDir, `${sceneName}-${frame.id}.svg`);
    await writeFile(svgPath, frame.svgContent);
  }
  
  console.log(`✓ Saved golden for scene "${sceneName}" with ${frames.length} frames`);
}

/**
 * Load golden SVG frames for a scene
 */
export async function loadGolden(
  sceneName: string,
  outputDir: string = 'fixtures/lgb/goldens'
): Promise<GoldenMetadata | null> {
  const metadataPath = resolve(outputDir, `${sceneName}.json`);
  
  if (!existsSync(metadataPath)) {
    return null;
  }
  
  const content = await readFile(metadataPath, 'utf-8');
  const metadata: GoldenMetadata = JSON.parse(content);
  
  // Load SVG content for each frame
  for (const frame of metadata.frames) {
    const svgPath = resolve(outputDir, `${sceneName}-${frame.id}.svg`);
    if (existsSync(svgPath)) {
      frame.svgContent = await readFile(svgPath, 'utf-8');
    }
  }
  
  return metadata;
}

/**
 * Compare actual frames against golden
 */
export async function compareAgainstGolden(
  sceneName: string,
  actualFrames: SceneFrame[],
  tolerance: DiffTolerance = DEFAULT_TOLERANCE,
  goldenDir: string = 'fixtures/lgb/goldens'
): Promise<{ passed: boolean; results: Array<{ frameId: string; match: boolean; diffs: string[] }> }> {
  const golden = await loadGolden(sceneName, goldenDir);
  
  if (!golden) {
    throw new Error(`No golden found for scene: ${sceneName}`);
  }
  
  if (golden.frames.length !== actualFrames.length) {
    throw new Error(
      `Frame count mismatch: expected ${golden.frames.length}, got ${actualFrames.length}`
    );
  }
  
  const results = [];
  let allPassed = true;
  
  for (let i = 0; i < golden.frames.length; i++) {
    const expectedFrame = golden.frames[i];
    const actualFrame = actualFrames[i];
    
    const comparison = compareSvgWithTolerance(
      actualFrame.svgContent,
      expectedFrame.svgContent,
      tolerance
    );
    
    results.push({
      frameId: actualFrame.id,
      match: comparison.match,
      diffs: comparison.diffs,
    });
    
    if (!comparison.match) {
      allPassed = false;
      console.error(`✗ Frame ${actualFrame.id} (${actualFrame.label}) differs from golden:`);
      comparison.diffs.forEach(diff => console.error(`  - ${diff}`));
    }
  }
  
  return {
    passed: allPassed,
    results,
  };
}

/**
 * Update existing golden with new frames
 */
export async function updateGolden(
  sceneName: string,
  frames: SceneFrame[],
  outputDir: string = 'fixtures/lgb/goldens'
): Promise<void> {
  const existing = await loadGolden(sceneName, outputDir);
  
  const metadata: GoldenMetadata = {
    sceneName,
    frames,
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  const metadataPath = resolve(outputDir, `${sceneName}.json`);
  await writeFile(metadataPath, JSON.stringify(metadata, null, 2));
  
  // Update SVG frames
  for (const frame of frames) {
    const svgPath = resolve(outputDir, `${sceneName}-${frame.id}.svg`);
    await writeFile(svgPath, frame.svgContent);
  }
  
  console.log(`✓ Updated golden for scene "${sceneName}" with ${frames.length} frames`);
}

export { DEFAULT_TOLERANCE };
