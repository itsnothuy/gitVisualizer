export type AnimStep = { t:number; sel:{nodes?:string[];edges?:string[];labels?:string[]}; op:string; to?:string | number | { custom: string }; dur?:number };
export type AnimScene = { name:string; total:number; steps:AnimStep[] };
