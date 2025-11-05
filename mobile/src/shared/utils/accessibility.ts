/**
 * Accessibility Utilities
 * アクセシビリティに関するユーティリティ関数
 */

import { ViewStyle } from 'react-native';

/**
 * 最小タッチターゲットサイズ (WCAG 2.1 AA基準: 44x44pt)
 */
export const MIN_TOUCH_TARGET_SIZE = 44;

/**
 * タッチターゲットサイズのチェック結果
 */
export interface TouchTargetSizeCheck {
  /**
   * サイズが基準を満たしているか
   */
  isValid: boolean;

  /**
   * 現在の幅
   */
  currentWidth: number | undefined;

  /**
   * 現在の高さ
   */
  currentHeight: number | undefined;

  /**
   * 推奨される幅
   */
  recommendedWidth: number;

  /**
   * 推奨される高さ
   */
  recommendedHeight: number;

  /**
   * 警告メッセージ
   */
  warnings: string[];
}

/**
 * タッチターゲットサイズをチェックする
 *
 * @param style - チェックするViewStyle
 * @param minSize - 最小サイズ（デフォルト: 44pt）
 * @returns チェック結果
 *
 * @example
 * ```tsx
 * const buttonStyle = { width: 30, height: 30 };
 * const check = checkTouchTargetSize(buttonStyle);
 *
 * if (!check.isValid) {
 *   console.warn('Touch target too small:', check.warnings);
 * }
 * ```
 */
export const checkTouchTargetSize = (
  style: ViewStyle,
  minSize: number = MIN_TOUCH_TARGET_SIZE
): TouchTargetSizeCheck => {
  const warnings: string[] = [];
  let isValid = true;

  const width = typeof style.width === 'number' ? style.width : undefined;
  const height = typeof style.height === 'number' ? style.height : undefined;

  // 幅のチェック
  if (width !== undefined && width < minSize) {
    warnings.push(
      `Width ${width}pt is smaller than minimum ${minSize}pt. Recommended: ${minSize}pt`
    );
    isValid = false;
  }

  // 高さのチェック
  if (height !== undefined && height < minSize) {
    warnings.push(
      `Height ${height}pt is smaller than minimum ${minSize}pt. Recommended: ${minSize}pt`
    );
    isValid = false;
  }

  return {
    isValid,
    currentWidth: width,
    currentHeight: height,
    recommendedWidth: Math.max(width || minSize, minSize),
    recommendedHeight: Math.max(height || minSize, minSize),
    warnings,
  };
};

/**
 * タッチターゲットサイズを自動的に調整する
 *
 * スタイルオブジェクトにminWidthとminHeightを追加して、
 * 最小タッチターゲットサイズを保証します。
 *
 * @param style - 調整するViewStyle
 * @param minSize - 最小サイズ（デフォルト: 44pt）
 * @returns 調整されたViewStyle
 *
 * @example
 * ```tsx
 * const buttonStyle = ensureTouchTargetSize({
 *   width: 30,
 *   height: 30,
 *   backgroundColor: '#007AFF',
 * });
 * // 結果: { width: 30, height: 30, minWidth: 44, minHeight: 44, ... }
 * ```
 */
export const ensureTouchTargetSize = (
  style: ViewStyle,
  minSize: number = MIN_TOUCH_TARGET_SIZE
): ViewStyle => {
  return {
    ...style,
    minWidth: minSize,
    minHeight: minSize,
  };
};

/**
 * ハイコントラストモード用のスタイル調整
 *
 * ボーダーの太さと色を調整して、ハイコントラストモードでの
 * 視認性を向上させます。
 *
 * @param style - 調整するViewStyle
 * @param isHighContrast - ハイコントラストモードが有効か
 * @returns 調整されたViewStyle
 *
 * @example
 * ```tsx
 * const isHighContrast = useHighContrast();
 * const buttonStyle = adjustForHighContrast(
 *   { borderWidth: 1, borderColor: '#ccc' },
 *   isHighContrast
 * );
 * ```
 */
export const adjustForHighContrast = (
  style: ViewStyle,
  isHighContrast: boolean
): ViewStyle => {
  if (!isHighContrast) {
    return style;
  }

  return {
    ...style,
    borderWidth: Math.max((style.borderWidth as number) || 1, 2),
    borderColor: style.borderColor || '#000000',
  };
};

/**
 * 透明度削減モード用のスタイル調整
 *
 * 透明度を削減して、視認性を向上させます。
 *
 * @param color - 調整する色（rgba形式）
 * @param isReduceTransparency - 透明度削減が有効か
 * @returns 調整された色
 *
 * @example
 * ```tsx
 * const isReduceTransparency = useReduceTransparency();
 * const overlayColor = adjustForReduceTransparency(
 *   'rgba(0, 0, 0, 0.5)',
 *   isReduceTransparency
 * );
 * // ReduceTransparency有効時: 'rgba(0, 0, 0, 0.9)'
 * ```
 */
export const adjustForReduceTransparency = (
  color: string,
  isReduceTransparency: boolean
): string => {
  if (!isReduceTransparency) {
    return color;
  }

  // rgba形式の色をパース
  const rgbaMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (!rgbaMatch) {
    return color;
  }

  const r = rgbaMatch[1];
  const g = rgbaMatch[2];
  const b = rgbaMatch[3];
  const alpha = parseFloat(rgbaMatch[4] || '1');

  // 透明度を0.9以上に調整
  const adjustedAlpha = Math.max(alpha, 0.9);

  return `rgba(${r}, ${g}, ${b}, ${adjustedAlpha})`;
};

/**
 * 色覚異常対応のための色の区別を確認
 *
 * 色のみで情報を伝えている場合に警告を出します。
 *
 * @param hasIcon - アイコンがあるか
 * @param hasLabel - ラベルがあるか
 * @returns 区別可能かどうか
 *
 * @example
 * ```tsx
 * // 良い例: 色 + アイコン
 * const isDistinguishable = checkColorDistinguishability(true, true);
 * // true
 *
 * // 悪い例: 色のみ
 * const isDistinguishable = checkColorDistinguishability(false, false);
 * // false (警告を出すべき)
 * ```
 */
export const checkColorDistinguishability = (
  hasIcon: boolean,
  hasLabel: boolean
): boolean => {
  // 色だけでなく、アイコンやラベルがあれば区別可能
  return hasIcon || hasLabel;
};

/**
 * アニメーション設定の調整
 *
 * モーション低減が有効な場合、アニメーションの継続時間を0にします。
 *
 * @param duration - アニメーション継続時間（ミリ秒）
 * @param isReduceMotion - モーション低減が有効か
 * @returns 調整されたアニメーション継続時間
 *
 * @example
 * ```tsx
 * const isReduceMotion = useReduceMotion();
 * const animationDuration = adjustAnimationDuration(300, isReduceMotion);
 * // ReduceMotion有効時: 0
 * // ReduceMotion無効時: 300
 * ```
 */
export const adjustAnimationDuration = (
  duration: number,
  isReduceMotion: boolean
): number => {
  return isReduceMotion ? 0 : duration;
};
