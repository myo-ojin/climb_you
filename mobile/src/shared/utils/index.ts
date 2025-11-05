// Utility Functions
// Export all utility functions here

export { StorageManager } from './StorageManager';

export {
  MIN_TOUCH_TARGET_SIZE,
  checkTouchTargetSize,
  ensureTouchTargetSize,
  adjustForHighContrast,
  adjustForReduceTransparency,
  checkColorDistinguishability,
  adjustAnimationDuration,
} from './accessibility';
export type { TouchTargetSizeCheck } from './accessibility';

export {
  calculateRelativeLuminance,
  hexToRgb,
  calculateContrastRatio,
  meetsWCAG_AA_NormalText,
  meetsWCAG_AA_LargeText,
  meetsWCAG_AA_UIComponent,
  meetsWCAG_AAA_NormalText,
  meetsWCAG_AAA_LargeText,
  checkContrast,
  WCAG_AA,
  WCAG_AAA,
} from './wcag';
export type { ContrastCheckResult } from './wcag';
