export type AnimStep = { t:number; sel:{nodes?:string[];edges?:string[];labels?:string[]}; op:string; to?:any; dur?:number }
export type AnimScene = { name:string; total:number; steps:AnimStep[] }
