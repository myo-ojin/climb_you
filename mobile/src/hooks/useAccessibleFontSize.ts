/**
 * useAccessibleFontSize
 * アクセシビリティ対応のフォントサイズ管理フック
 *
 * ユーザーのデバイスのテキストサイズ設定に応じて、
 * 動的にフォントサイズを調整します。
 */

import { useState, useEffect } from 'react';
import { PixelRatio, AccessibilityInfo } from 'react-native';

/**
 * フォントサイズの範囲設定
 */
interface FontSizeConstraints {
  /**
   * 最小フォントサイズ（ピクセル）
   */
  minSize?: number;

  /**
   * 最大フォントサイズ（ピクセル）
   */
  maxSize?: number;
}

/**
 * アクセシブルなフォントサイズを計算
 *
 * @param baseFontSize - ベースとなるフォントサイズ（ピクセル）
 * @param constraints - フォントサイズの制約（最小・最大）
 * @returns スケーリングされたフォントサイズ
 *
 * @example
 * ```tsx
 * const MyComponent = () => {
 *   const fontSize = useAccessibleFontSize(16);
 *   return <Text style={{ fontSize }}>Hello</Text>;
 * };
 * ```
 *
 * @example
 * ```tsx
 * // 最小12px、最大24pxの制約付き
 * const fontSize = useAccessibleFontSize(16, { minSize: 12, maxSize: 24 });
 * ```
 */
export const useAccessibleFontSize = (
  baseFontSize: number,
  constraints?: FontSizeConstraints
): number => {
  const [scaledFontSize, setScaledFontSize] = useState(baseFontSize);

  useEffect(() => {
    const updateFontSize = () => {
      // デバイスのフォントスケールを取得
      const fontScale = PixelRatio.getFontScale();

      // スケーリング適用
      let newSize = baseFontSize * fontScale;

      // 制約を適用
      if (constraints?.minSize !== undefined) {
        newSize = Math.max(newSize, constraints.minSize);
      }
      if (constraints?.maxSize !== undefined) {
        newSize = Math.min(newSize, constraints.maxSize);
      }

      setScaledFontSize(newSize);
    };

    // 初回実行
    updateFontSize();

    // iOS: 太字テキストの変更を監視
    const boldTextListener = AccessibilityInfo.addEventListener(
      'boldTextChanged',
      updateFontSize
    );

    return () => {
      boldTextListener.remove();
    };
  }, [baseFontSize, constraints?.minSize, constraints?.maxSize]);

  return scaledFontSize;
};

/**
 * 複数のフォントサイズを一度に計算
 *
 * @param sizes - フォントサイズのマップ
 * @returns スケーリングされたフォントサイズのマップ
 *
 * @example
 * ```tsx
 * const MyComponent = () => {
 *   const sizes = useAccessibleFontSizes({
 *     small: 12,
 *     medium: 16,
 *     large: 20,
 *   });
 *
 *   return (
 *     <>
 *       <Text style={{ fontSize: sizes.small }}>Small</Text>
 *       <Text style={{ fontSize: sizes.medium }}>Medium</Text>
 *       <Text style={{ fontSize: sizes.large }}>Large</Text>
 *     </>
 *   );
 * };
 * ```
 */
export const useAccessibleFontSizes = <T extends Record<string, number>>(
  sizes: T
): T => {
  const [scaledSizes, setScaledSizes] = useState<T>(sizes);

  useEffect(() => {
    const updateFontSizes = () => {
      const fontScale = PixelRatio.getFontScale();

      const newSizes = Object.keys(sizes).reduce((acc, key) => {
        acc[key as keyof T] = (sizes[key] * fontScale) as T[keyof T];
        return acc;
      }, {} as T);

      setScaledSizes(newSizes);
    };

    updateFontSizes();

    const boldTextListener = AccessibilityInfo.addEventListener(
      'boldTextChanged',
      updateFontSizes
    );

    return () => {
      boldTextListener.remove();
    };
  }, [sizes]);

  return scaledSizes;
};

/**
 * フォントスケール値を取得
 *
 * @returns 現在のフォントスケール値（1.0 = 標準、1.2 = 大、1.5 = 特大など）
 *
 * @example
 * ```tsx
 * const MyComponent = () => {
 *   const fontScale = useFontScale();
 *   const isLargeText = fontScale > 1.2;
 *
 *   return (
 *     <View style={{ padding: isLargeText ? 20 : 16 }}>
 *       <Text>Content</Text>
 *     </View>
 *   );
 * };
 * ```
 */
export const useFontScale = (): number => {
  const [fontScale, setFontScale] = useState(PixelRatio.getFontScale());

  useEffect(() => {
    const updateFontScale = () => {
      setFontScale(PixelRatio.getFontScale());
    };

    const boldTextListener = AccessibilityInfo.addEventListener(
      'boldTextChanged',
      updateFontScale
    );

    return () => {
      boldTextListener.remove();
    };
  }, []);

  return fontScale;
};

/**
 * ヘルパー: レスポンシブなフォントサイズを計算
 *
 * @param size - ベースフォントサイズ
 * @returns スケーリングされたフォントサイズ
 */
export const getScaledFontSize = (size: number): number => {
  return size * PixelRatio.getFontScale();
};
