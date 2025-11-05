/**
 * useAccessibleTheme Hook
 * アクセシビリティ設定を考慮したテーマ選択フック
 *
 * 機能:
 * - useColorSchemeとuseHighContrastを組み合わせて、適切なテーマを返す
 * - ハイコントラストモードが有効な場合は、HighContrastThemeを返す
 * - 通常時は、LightThemeまたはDarkThemeを返す
 */

import { useColorScheme } from 'react-native';
import { useHighContrast } from './useAccessibility';
import {
  LightTheme,
  DarkTheme,
  HighContrastLightTheme,
  HighContrastDarkTheme,
} from '../theme';

/**
 * テーマの型定義
 */
export type Theme =
  | typeof LightTheme
  | typeof DarkTheme
  | typeof HighContrastLightTheme
  | typeof HighContrastDarkTheme;

/**
 * useAccessibleTheme
 * アクセシビリティ設定を考慮したテーマを返すフック
 *
 * @returns 現在のテーマ
 *
 * @example
 * ```tsx
 * const theme = useAccessibleTheme();
 *
 * <View style={{ backgroundColor: theme.background }}>
 *   <Text style={{ color: theme.text }}>Hello</Text>
 * </View>
 * ```
 */
export const useAccessibleTheme = (): Theme => {
  const colorScheme = useColorScheme();
  const isHighContrast = useHighContrast();
  const isDark = colorScheme === 'dark';

  // ハイコントラストモードが有効な場合
  if (isHighContrast) {
    return isDark ? HighContrastDarkTheme : HighContrastLightTheme;
  }

  // 通常モード
  return isDark ? DarkTheme : LightTheme;
};

/**
 * useThemeColors
 * テーマのcolorsプロパティのみを返す軽量版フック
 *
 * @returns テーマのcolors
 *
 * @example
 * ```tsx
 * const colors = useThemeColors();
 *
 * <View style={{ backgroundColor: colors.background }}>
 *   <Text style={{ color: colors.text }}>Hello</Text>
 * </View>
 * ```
 */
export const useThemeColors = () => {
  const theme = useAccessibleTheme();
  return {
    background: theme.background,
    surface: theme.surface,
    surfaceVariant: theme.surfaceVariant,
    text: theme.text,
    textSecondary: theme.textSecondary,
    border: theme.border,
  };
};

/**
 * useBorderStyle
 * ハイコントラストモードを考慮したボーダースタイルを返す
 *
 * @returns ボーダースタイル
 *
 * @example
 * ```tsx
 * const borderStyle = useBorderStyle();
 *
 * <View style={[styles.container, borderStyle]}>
 *   {children}
 * </View>
 * ```
 */
export const useBorderStyle = () => {
  const theme = useAccessibleTheme();
  const isHighContrast = useHighContrast();

  return {
    borderColor: theme.border,
    borderWidth: isHighContrast ? 2 : 1,
  };
};
