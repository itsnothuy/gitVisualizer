/**
 * Skins module - Export all available skins and utilities
 */

export type { Skin, SvgMarkerDef } from "./types";
export { lgbSkin } from "./lgb/skin";
export { LgbSvgDefs } from "./lgb/LgbSvgDefs";

// Default skin (can be swapped based on user preference)
export { lgbSkin as defaultSkin } from "./lgb/skin";
