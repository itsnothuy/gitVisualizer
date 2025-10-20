/**
 * Sample Repository Loader
 * 
 * Loads pre-built sample Git repositories from bundled ZIP files.
 * All processing happens in the browser - no server interaction required.
 */

import { unzip, Unzipped } from "fflate";
import type { SampleMetadata, SampleCollection, LoadSampleOptions } from "./types";
import type { IngestResult, IngestFile } from "@/lib/git/ingestion-types";

/**
 * Fetch available sample metadata
 */
export async function fetchSampleMetadata(): Promise<SampleCollection> {
  const response = await fetch("/samples/samples.json");
  if (!response.ok) {
    throw new Error(`Failed to fetch samples metadata: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Load a sample repository by ID
 */
export async function loadSample(
  sample: SampleMetadata,
  options: LoadSampleOptions = {}
): Promise<IngestResult> {
  const { onProgress, signal } = options;

  // Download ZIP file
  onProgress?.({
    stage: "downloading",
    percentage: 0,
    message: `Downloading ${sample.name}...`,
  });

  const response = await fetch(`/samples/${sample.file}`, { signal });
  if (!response.ok) {
    throw new Error(`Failed to download sample: ${response.statusText}`);
  }

  const buffer = await response.arrayBuffer();
  
  onProgress?.({
    stage: "downloading",
    percentage: 100,
    message: "Download complete",
  });

  // Decompress ZIP
  onProgress?.({
    stage: "decompressing",
    percentage: 0,
    message: "Decompressing repository...",
  });

  const unzipped = await new Promise<Unzipped>((resolve, reject) => {
    unzip(new Uint8Array(buffer), (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });

  onProgress?.({
    stage: "decompressing",
    percentage: 100,
    message: "Decompression complete",
  });

  // Convert to IngestResult format
  onProgress?.({
    stage: "loading",
    percentage: 0,
    message: "Processing files...",
  });

  const files: IngestFile[] = [];
  let totalSize = 0;

  for (const [path, data] of Object.entries(unzipped)) {
    // Skip directories
    if (path.endsWith("/")) continue;

    // Remove the sample directory prefix
    const cleanPath = path.replace(/^[^/]+\//, "");

    files.push({
      path: cleanPath,
      content: data,
    });

    totalSize += data.length;
  }

  onProgress?.({
    stage: "loading",
    percentage: 100,
    message: "Processing complete",
  });

  return {
    name: sample.name,
    files,
    totalSize,
  };
}

/**
 * Get sample by ID
 */
export async function getSampleById(id: string): Promise<SampleMetadata | null> {
  const collection = await fetchSampleMetadata();
  return collection.samples.find((s) => s.id === id) || null;
}
