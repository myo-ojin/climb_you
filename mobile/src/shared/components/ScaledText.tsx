/**
 * ScaledText Component
 * デバイスのテキストサイズ設定に応じて動的にフォントサイズを調整するTextコンポーネント
 *
 * 機能:
 * - 自動的にフォントサイズをスケーリング
 * - 最大サイズ制限のサポート
 * - 大きなフォントサイズ時の行間調整
 * - すべてのTextコンポーネントのプロパティをサポート
 */

import React, { useMemo } from 'react';
import { Text, TextProps, TextStyle, StyleSheet } from 'react-native';
import { useDynamicTextSize } from '../hooks';

export interface ScaledTextProps extends TextProps {
  /**
   * 基準フォントサイズ（スケーリング前）
   * デフォルト: 16
   */
  baseFontSize?: number;

  /**
   * 最大スケール係数（デフォルト: 1.5）
   */
  maxScale?: number;

  /**
   * 最小スケール係数（デフォルト: 0.85）
   */
  minScale?: number;

  /**
   * 行間の倍率（デフォルト: 1.4）
   * lineHeightMultiplier * fontSize = lineHeight
   */
  lineHeightMultiplier?: number;

  /**
   * 大きなテキスト時に行間を自動調整するか（デフォルト: true）
   */
  autoAdjustLineHeight?: boolean;
}

/**
 * ScaledText Component
 * 動的テキストサイズに対応したTextコンポーネント
 *
 * @example
 * ```tsx
 * <ScaledText baseFontSize={16} maxScale={1.5}>
 *   こんにちは
 * </ScaledText>
 *
 * <ScaledText
 *   baseFontSize={20}
 *   style={styles.title}
 *   maxScale={1.5}
 *   lineHeightMultiplier={1.3}
 * >
 *   タイトル
 * </ScaledText>
 * ```
 */
export const ScaledText: React.FC<ScaledTextProps> = ({
  baseFontSize = 16,
  maxScale = 1.5,
  minScale = 0.85,
  lineHeightMultiplier = 1.4,
  autoAdjustLineHeight = true,
  style,
  children,
  ...restProps
}) => {
  const { scaleFont, isLargeTextEnabled } = useDynamicTextSize({ maxScale, minScale });

  const scaledFontSize = useMemo(() => {
    // styleからフォントサイズを取得（優先）
    const styleArray = StyleSheet.flatten(style);
    const styleFontSize = styleArray?.fontSize;

    // styleFontSizeがあればそれを使用、なければbaseFontSizeを使用
    const fontSize = typeof styleFontSize === 'number' ? styleFontSize : baseFontSize;

    return scaleFont(fontSize);
  }, [baseFontSize, scaleFont, style]);

  const scaledLineHeight = useMemo(() => {
    if (!autoAdjustLineHeight) {
      return undefined;
    }

    // 大きなテキスト時はlineHeightMultiplierを少し増やす
    const adjustedMultiplier = isLargeTextEnabled
      ? lineHeightMultiplier * 1.1
      : lineHeightMultiplier;

    return Math.round(scaledFontSize * adjustedMultiplier);
  }, [scaledFontSize, lineHeightMultiplier, autoAdjustLineHeight, isLargeTextEnabled]);

  const scaledStyle: TextStyle = useMemo(() => {
    return {
      fontSize: scaledFontSize,
      ...(scaledLineHeight !== undefined && { lineHeight: scaledLineHeight }),
    };
  }, [scaledFontSize, scaledLineHeight]);

  return (
    <Text
      {...restProps}
      style={[style, scaledStyle]}
      // アクセシビリティ：大きなテキストが有効な場合はヒントを追加
      accessibilityHint={
        isLargeTextEnabled
          ? `大きなテキストサイズが有効です。${restProps.accessibilityHint || ''}`
          : restProps.accessibilityHint
      }
    >
      {children}
    </Text>
  );
};

/**
 * ScaledHeading Component
 * 見出し用のScaledText（デフォルトフォントサイズ: 24px）
 *
 * @example
 * ```tsx
 * <ScaledHeading>ページタイトル</ScaledHeading>
 * ```
 */
export const ScaledHeading: React.FC<ScaledTextProps> = (props) => {
  return (
    <ScaledText
      baseFontSize={24}
      lineHeightMultiplier={1.3}
      accessibilityRole="header"
      {...props}
      style={[{ fontWeight: '700' }, props.style]}
    />
  );
};

/**
 * ScaledTitle Component
 * タイトル用のScaledText（デフォルトフォントサイズ: 20px）
 *
 * @example
 * ```tsx
 * <ScaledTitle>セクションタイトル</ScaledTitle>
 * ```
 */
export const ScaledTitle: React.FC<ScaledTextProps> = (props) => {
  return (
    <ScaledText
      baseFontSize={20}
      lineHeightMultiplier={1.35}
      accessibilityRole="header"
      {...props}
      style={[{ fontWeight: '600' }, props.style]}
    />
  );
};

/**
 * ScaledBody Component
 * 本文用のScaledText（デフォルトフォントサイズ: 16px）
 *
 * @example
 * ```tsx
 * <ScaledBody>本文テキスト</ScaledBody>
 * ```
 */
export const ScaledBody: React.FC<ScaledTextProps> = (props) => {
  return (
    <ScaledText
      baseFontSize={16}
      lineHeightMultiplier={1.5}
      {...props}
    />
  );
};

/**
 * ScaledCaption Component
 * キャプション用のScaledText（デフォルトフォントサイズ: 14px）
 *
 * @example
 * ```tsx
 * <ScaledCaption>補足説明</ScaledCaption>
 * ```
 */
export const ScaledCaption: React.FC<ScaledTextProps> = (props) => {
  return (
    <ScaledText
      baseFontSize={14}
      lineHeightMultiplier={1.4}
      {...props}
      style={[{ opacity: 0.7 }, props.style]}
    />
  );
};

/**
 * ScaledLabel Component
 * ラベル用のScaledText（デフォルトフォントサイズ: 12px）
 *
 * @example
 * ```tsx
 * <ScaledLabel>フィールド名</ScaledLabel>
 * ```
 */
export const ScaledLabel: React.FC<ScaledTextProps> = (props) => {
  return (
    <ScaledText
      baseFontSize={12}
      lineHeightMultiplier={1.3}
      {...props}
      style={[{ fontWeight: '500' }, props.style]}
    />
  );
};
