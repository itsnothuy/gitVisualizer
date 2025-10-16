export type AnimStep = {
  t: number; /* ms from scene start */
  sel: { nodes?: string[]; edges?: string[]; labels?: string[] };
  op: 'fade'|'move'|'pulse'|'stroke'|'classAdd'|'classRemove';
  to?: any; /* x,y,opacity,color,className,... */
  dur?: number;
}

export type AnimScene = { name: string; total: number; steps: AnimStep[] }