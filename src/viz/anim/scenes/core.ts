import { AnimScene, AnimStep } from '../types'
const D = { veryShort: 120, short: 220, medium: 320, long: 480 }

export function sceneCommit(newId: string, atMs=0): AnimScene {
  const steps: AnimStep[] = [
    { t: atMs, sel: { nodes: [newId] }, op: 'fade', to: { opacity: 0 }, dur: 0 },
    { t: atMs, sel: { nodes: [newId] }, op: 'fade', to: { opacity: 1 }, dur: D.short },
    { t: atMs, sel: { labels: ['branch:current','head'] }, op: 'move', dur: D.short }
  ]
  return { name: 'commit', total: atMs + D.short, steps }
}

/* add scenes for branchCreate, checkout, merge2P, reset, revert similarly */