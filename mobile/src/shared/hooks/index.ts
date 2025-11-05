/**
 * Shared Hooks Export
 */

export { usePagination } from './usePagination';
export type {
  PaginatedResponse,
  PaginationOptions,
  PaginationState,
  FetchFunction,
} from './usePagination';

export {
  useAccessibility,
  useScreenReader,
  useReduceMotion,
  useAnnounce,
  useReduceTransparency,
  useBoldText,
  useGrayscale,
  useInvertColors,
  useHighContrast,
} from './useAccessibility';
export type { UseAccessibilityReturn } from './useAccessibility';

export {
  useDynamicTextSize,
  useFontScale,
  useScaledFont,
  scaleFontSize,
} from './useDynamicTextSize';
export type {
  UseDynamicTextSizeOptions,
  UseDynamicTextSizeReturn,
} from './useDynamicTextSize';

export {
  useAccessibleTheme,
  useThemeColors,
  useBorderStyle,
} from './useAccessibleTheme';
export type { Theme } from './useAccessibleTheme';

export { useTranslation } from './useTranslation';
export type { UseTranslationReturn } from './useTranslation';
