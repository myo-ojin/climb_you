/**
 * Hooks Export
 * カスタムフックのエクスポート
 */

export { useVisibility, useIntersectionObserver } from './useVisibility';
export { usePagination, useInfiniteScroll } from './usePagination';
export type { PaginationOptions, PaginationResult } from './usePagination';
export {
  usePowerSaving,
  useBatteryState,
  useLowPowerMode,
  useConditionalFeature,
} from './usePowerSaving';
export type { PowerSavingHookResult } from './usePowerSaving';

// Accessibility
export {
  useAccessibleFontSize,
  useAccessibleFontSizes,
  useFontScale,
  getScaledFontSize,
} from './useAccessibleFontSize';
