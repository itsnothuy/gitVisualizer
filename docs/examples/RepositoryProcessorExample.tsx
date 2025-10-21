"use client";

/**
 * Example component demonstrating Git Repository Processor usage
 * 
 * This component shows how to:
 * - Use the Repository Context Provider
 * - Load a repository from File System Access API
 * - Display repository metadata
 * - Visualize the DAG
 */

import React from "react";
import { useRepository } from "@/lib/repository";
import { pickLocalRepoDir } from "@/lib/git/local";

export function RepositoryProcessorExample(): React.ReactElement {
  const {
    currentRepository,
    isLoading,
    error,
    progress,
    loadRepository,
    clearRepository,
  } = useRepository();

  const handleLoadRepository = async () => {
    const result = await pickLocalRepoDir();
    
    if (result.error) {
      console.error("Failed to pick repository:", result.error.message);
      return;
    }

    if (result.handle) {
      await loadRepository(result.handle, {
        maxCommits: 1000,
        detectLFS: true,
      });
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h1>Git Repository Processor Example</h1>
      
      {!currentRepository && !isLoading && (
        <div>
          <p>Load a Git repository to visualize its commit history.</p>
          <button
            onClick={handleLoadRepository}
            style={{
              padding: "10px 20px",
              fontSize: "16px",
              cursor: "pointer",
            }}
          >
            Open Repository
          </button>
        </div>
      )}

      {isLoading && progress && (
        <div>
          <h2>Loading Repository...</h2>
          <p>Phase: {progress.phase}</p>
          <p>{progress.message}</p>
          <progress
            value={progress.percentage}
            max={100}
            style={{ width: "100%" }}
          />
          <p>{progress.percentage}%</p>
        </div>
      )}

      {error && (
        <div style={{ color: "red", padding: "10px", border: "1px solid red" }}>
          <h2>Error</h2>
          <p>{error}</p>
        </div>
      )}

      {currentRepository && (
        <div>
          <h2>Repository: {currentRepository.metadata.name}</h2>
          
          <div style={{ marginBottom: "20px" }}>
            <h3>Metadata</h3>
            <ul>
              <li>Commits: {currentRepository.metadata.commitCount}</li>
              <li>Branches: {currentRepository.metadata.branchCount}</li>
              <li>Tags: {currentRepository.metadata.tagCount}</li>
              {currentRepository.metadata.defaultBranch && (
                <li>Default Branch: {currentRepository.metadata.defaultBranch}</li>
              )}
              <li>
                Processed: {currentRepository.metadata.processedAt.toLocaleString()}
              </li>
            </ul>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <h3>Performance</h3>
            <ul>
              <li>Total Time: {currentRepository.performance.totalMs.toFixed(0)}ms</li>
              <li>Parse Time: {currentRepository.performance.parseMs.toFixed(0)}ms</li>
              <li>Build Time: {currentRepository.performance.buildMs.toFixed(0)}ms</li>
            </ul>
          </div>

          {currentRepository.warnings.length > 0 && (
            <div style={{ marginBottom: "20px" }}>
              <h3>Warnings</h3>
              <ul>
                {currentRepository.warnings.map((warning, index) => (
                  <li
                    key={index}
                    style={{
                      color:
                        warning.severity === "error"
                          ? "red"
                          : warning.severity === "warning"
                          ? "orange"
                          : "blue",
                    }}
                  >
                    [{warning.severity}] {warning.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div style={{ marginBottom: "20px" }}>
            <h3>Branches</h3>
            <ul>
              {currentRepository.dag.branches.map((branch) => (
                <li key={branch.name}>
                  {branch.name} → {branch.target.substring(0, 7)}
                </li>
              ))}
            </ul>
          </div>

          {currentRepository.dag.tags.length > 0 && (
            <div style={{ marginBottom: "20px" }}>
              <h3>Tags</h3>
              <ul>
                {currentRepository.dag.tags.map((tag) => (
                  <li key={tag.name}>
                    {tag.name} → {tag.target.substring(0, 7)}
                    {tag.message && ` (${tag.message})`}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div style={{ marginBottom: "20px" }}>
            <h3>DAG Nodes (First 10)</h3>
            <ul>
              {currentRepository.dag.nodes.slice(0, 10).map((node) => (
                <li key={node.id}>
                  <strong>{node.id.substring(0, 7)}</strong>: {node.title}
                  {node.refs && node.refs.length > 0 && (
                    <span style={{ color: "green" }}>
                      {" "}
                      ({node.refs.join(", ")})
                    </span>
                  )}
                  {node.parents.length > 0 && (
                    <div style={{ marginLeft: "20px", fontSize: "12px" }}>
                      Parents: {node.parents.map(p => p.substring(0, 7)).join(", ")}
                    </div>
                  )}
                </li>
              ))}
            </ul>
            {currentRepository.dag.nodes.length > 10 && (
              <p>... and {currentRepository.dag.nodes.length - 10} more commits</p>
            )}
          </div>

          <button
            onClick={clearRepository}
            style={{
              padding: "10px 20px",
              fontSize: "16px",
              cursor: "pointer",
            }}
          >
            Clear Repository
          </button>
        </div>
      )}
    </div>
  );
}
