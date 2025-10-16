'use client'
import React from 'react'
export function LgbSvgDefs() {
  return (
    <defs id="lgb-defs">
      {/* arrowhead */}
      <marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
        <path d="M0,0 L8,4 L0,8 z" fill="var(--lgb-edge)" />
      </marker>
      {/* dashed “copy” effect */}
      <style>{`.edge--copy { stroke-dasharray: 4 3; }`}</style>
    </defs>
  )
}