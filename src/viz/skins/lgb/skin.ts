export type Skin = { node:{r:number;strokeWidth:number}; colors:Record<string,string>; defsId:string }

export const defaultSkin: Skin = { 
  node:{r:6,strokeWidth:2}, 
  colors:{}, 
  defsId:'defs' 
}

export const lgbSkin: Skin = {
  node: { r: 8, strokeWidth: 2 },
  colors: {
    bg: 'var(--lgb-bg)',
    fg: 'var(--lgb-fg)',
    muted: 'var(--lgb-muted)',
    accent: 'var(--lgb-accent)',
    merge: 'var(--lgb-merge)',
    rebase: 'var(--lgb-rebase)',
    danger: 'var(--lgb-danger)',
    edge: 'var(--lgb-edge)',
    edgeDashed: 'var(--lgb-edge-dashed)',
  },
  defsId: 'lgb-defs'
}
