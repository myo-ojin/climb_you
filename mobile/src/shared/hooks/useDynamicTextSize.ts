/**
 * useDynamicTextSize Hook
 * デバイスのテキストサイズ設定に応じて動的にフォントサイズを調整するカスタムフック
 *
 * 機能:
 * - デバイスのフォントスケール係数を取得（PixelRatio.getFontScale()）
 * - 最大サイズ制限のサポート
 * - スケーリングされたフォントサイズを計算
 * - フォントスケール変更の検知（iOS/Android）
 */

import { useState, useEffect, useCallback } from 'react';
import { PixelRatio, Platform, Dimensions } from 'react-native';

export interface UseDynamicTextSizeOptions {
  /**
   * 最大スケール係数（デフォルト: 1.5）
   * 例: 1.5 = 150%まで拡大可能
   */
  maxScale?: number;

  /**
   * 最小スケール係数（デフォルト: 0.85）
   * 例: 0.85 = 85%まで縮小可能
   */
  minScale?: number;
}

export interface UseDynamicTextSizeReturn {
  /**
   * 現在のフォントスケール係数（1.0 = 100%）
   */
  fontScale: number;

  /**
   * 基準フォントサイズから動的にスケーリングされたサイズを計算
   */
  scaleFont: (baseFontSize: number) => number;

  /**
   * 大きなテキストサイズが有効か（fontScale > 1.2）
   */
  isLargeTextEnabled: boolean;

  /**
   * 最大サイズに達しているか
   */
  isMaxScaleReached: boolean;

  /**
   * 最小サイズに達しているか
   */
  isMinScaleReached: boolean;
}

/**
 * useDynamicTextSize
 * デバイスのテキストサイズ設定に応じて動的にフォントサイズを調整するフック
 *
 * @param options - オプション設定
 * @returns フォントスケール情報とスケーリング関数
 *
 * @example
 * ```tsx
 * const { fontScale, scaleFont, isLargeTextEnabled } = useDynamicTextSize({ maxScale: 1.5 });
 *
 * // 基準サイズ16pxを動的にスケーリング
 * const fontSize = scaleFont(16);
 *
 * // 大きなテキストが有効な場合の条件分岐
 * if (isLargeTextEnabled) {
 *   return <Text style={{ fontSize, lineHeight: fontSize * 1.5 }}>...</Text>;
 * }
 * ```
 */
export const useDynamicTextSize = (
  options: UseDynamicTextSizeOptions = {}
): UseDynamicTextSizeReturn => {
  const { maxScale = 1.5, minScale = 0.85 } = options;

  const [fontScale, setFontScale] = useState<number>(() => {
    const rawScale = PixelRatio.getFontScale();
    return Math.min(Math.max(rawScale, minScale), maxScale);
  });

  useEffect(() => {
    // フォントスケール変更の検知（Dimensions APIを使用）
    const subscription = Dimensions.addEventListener('change', ({ window, screen }) => {
      const rawScale = PixelRatio.getFontScale();
      const clampedScale = Math.min(Math.max(rawScale, minScale), maxScale);
      setFontScale(clampedScale);
      console.log('[useDynamicTextSize] Font scale changed:', clampedScale);
    });

    return () => {
      subscription?.remove();
    };
  }, [maxScale, minScale]);

  /**
   * フォントサイズをスケーリング
   */
  const scaleFont = useCallback(
    (baseFontSize: number): number => {
      return Math.round(baseFontSize * fontScale);
    },
    [fontScale]
  );

  /**
   * 大きなテキストサイズが有効か（120%以上）
   */
  const isLargeTextEnabled = fontScale > 1.2;

  /**
   * 最大スケールに達しているか
   */
  const isMaxScaleReached = fontScale >= maxScale;

  /**
   * 最小スケールに達しているか
   */
  const isMinScaleReached = fontScale <= minScale;

  return {
    fontScale,
    scaleFont,
    isLargeTextEnabled,
    isMaxScaleReached,
    isMinScaleReached,
  };
};

/**
 * useFontScale
 * フォントスケール係数のみを取得する軽量版フック
 *
 * @param options - オプション設定
 * @returns 現在のフォントスケール係数
 *
 * @example
 * ```tsx
 * const fontScale = useFontScale();
 *
 * const fontSize = 16 * fontScale;
 * ```
 */
export const useFontScale = (options: UseDynamicTextSizeOptions = {}): number => {
  const { fontScale } = useDynamicTextSize(options);
  return fontScale;
};

/**
 * useScaledFont
 * スケーリング関数のみを提供する軽量版フック
 *
 * @param options - オプション設定
 * @returns フォントサイズをスケーリングする関数
 *
 * @example
 * ```tsx
 * const scaleFont = useScaledFont({ maxScale: 1.5 });
 *
 * const titleFontSize = scaleFont(24);
 * const bodyFontSize = scaleFont(16);
 * ```
 */
export const useScaledFont = (
  options: UseDynamicTextSizeOptions = {}
): ((baseFontSize: number) => number) => {
  const { scaleFont } = useDynamicTextSize(options);
  return scaleFont;
};

/**
 * Utility: 静的にフォントサイズをスケーリング
 * フック外で使用する場合のヘルパー関数
 *
 * @param baseFontSize - 基準フォントサイズ
 * @param maxScale - 最大スケール係数（デフォルト: 1.5）
 * @param minScale - 最小スケール係数（デフォルト: 0.85）
 * @returns スケーリングされたフォントサイズ
 */
export const scaleFontSize = (
  baseFontSize: number,
  maxScale: number = 1.5,
  minScale: number = 0.85
): number => {
  const rawScale = PixelRatio.getFontScale();
  const clampedScale = Math.min(Math.max(rawScale, minScale), maxScale);
  return Math.round(baseFontSize * clampedScale);
};
