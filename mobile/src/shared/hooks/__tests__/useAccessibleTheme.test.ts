/**
 * useAccessibleTheme Hook Test
 */

import { renderHook, waitFor } from '@testing-library/react-native';
import { useColorScheme } from 'react-native';
import {
  useAccessibleTheme,
  useThemeColors,
  useBorderStyle,
} from '../useAccessibleTheme';
import { useHighContrast } from '../useAccessibility';
import {
  LightTheme,
  DarkTheme,
  HighContrastLightTheme,
  HighContrastDarkTheme,
} from '../../theme';

// Mock useColorScheme
jest.mock('react-native', () => ({
  useColorScheme: jest.fn(() => 'light'),
}));

// Mock useHighContrast
jest.mock('../useAccessibility', () => ({
  useHighContrast: jest.fn(() => false),
}));

describe('useAccessibleTheme', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useAccessibleTheme', () => {
    it('ライトモードで通常設定の場合はLightThemeを返す', () => {
      (useColorScheme as jest.Mock).mockReturnValue('light');
      (useHighContrast as jest.Mock).mockReturnValue(false);

      const { result } = renderHook(() => useAccessibleTheme());

      expect(result.current).toEqual(LightTheme);
    });

    it('ダークモードで通常設定の場合はDarkThemeを返す', () => {
      (useColorScheme as jest.Mock).mockReturnValue('dark');
      (useHighContrast as jest.Mock).mockReturnValue(false);

      const { result } = renderHook(() => useAccessibleTheme());

      expect(result.current).toEqual(DarkTheme);
    });

    it('ライトモードでハイコントラストが有効な場合はHighContrastLightThemeを返す', () => {
      (useColorScheme as jest.Mock).mockReturnValue('light');
      (useHighContrast as jest.Mock).mockReturnValue(true);

      const { result } = renderHook(() => useAccessibleTheme());

      expect(result.current).toEqual(HighContrastLightTheme);
    });

    it('ダークモードでハイコントラストが有効な場合はHighContrastDarkThemeを返す', () => {
      (useColorScheme as jest.Mock).mockReturnValue('dark');
      (useHighContrast as jest.Mock).mockReturnValue(true);

      const { result } = renderHook(() => useAccessibleTheme());

      expect(result.current).toEqual(HighContrastDarkTheme);
    });

    it('ハイコントラストが優先される', () => {
      (useColorScheme as jest.Mock).mockReturnValue('light');
      (useHighContrast as jest.Mock).mockReturnValue(true);

      const { result } = renderHook(() => useAccessibleTheme());

      expect(result.current).toEqual(HighContrastLightTheme);
      expect(result.current).not.toEqual(LightTheme);
    });
  });

  describe('useThemeColors', () => {
    it('ライトモードの色を返す', () => {
      (useColorScheme as jest.Mock).mockReturnValue('light');
      (useHighContrast as jest.Mock).mockReturnValue(false);

      const { result } = renderHook(() => useThemeColors());

      expect(result.current.background).toBe(LightTheme.background);
      expect(result.current.text).toBe(LightTheme.text);
      expect(result.current.surface).toBe(LightTheme.surface);
    });

    it('ダークモードの色を返す', () => {
      (useColorScheme as jest.Mock).mockReturnValue('dark');
      (useHighContrast as jest.Mock).mockReturnValue(false);

      const { result } = renderHook(() => useThemeColors());

      expect(result.current.background).toBe(DarkTheme.background);
      expect(result.current.text).toBe(DarkTheme.text);
      expect(result.current.surface).toBe(DarkTheme.surface);
    });

    it('ハイコントラストライトモードの色を返す', () => {
      (useColorScheme as jest.Mock).mockReturnValue('light');
      (useHighContrast as jest.Mock).mockReturnValue(true);

      const { result } = renderHook(() => useThemeColors());

      expect(result.current.background).toBe(HighContrastLightTheme.background);
      expect(result.current.text).toBe(HighContrastLightTheme.text);
      expect(result.current.border).toBe(HighContrastLightTheme.border);
    });

    it('ハイコントラストダークモードの色を返す', () => {
      (useColorScheme as jest.Mock).mockReturnValue('dark');
      (useHighContrast as jest.Mock).mockReturnValue(true);

      const { result } = renderHook(() => useThemeColors());

      expect(result.current.background).toBe(HighContrastDarkTheme.background);
      expect(result.current.text).toBe(HighContrastDarkTheme.text);
      expect(result.current.border).toBe(HighContrastDarkTheme.border);
    });

    it('必要な色プロパティがすべて含まれている', () => {
      (useColorScheme as jest.Mock).mockReturnValue('light');
      (useHighContrast as jest.Mock).mockReturnValue(false);

      const { result } = renderHook(() => useThemeColors());

      expect(result.current).toHaveProperty('background');
      expect(result.current).toHaveProperty('surface');
      expect(result.current).toHaveProperty('surfaceVariant');
      expect(result.current).toHaveProperty('text');
      expect(result.current).toHaveProperty('textSecondary');
      expect(result.current).toHaveProperty('border');
    });
  });

  describe('useBorderStyle', () => {
    it('通常モードではborderWidthが1になる', () => {
      (useColorScheme as jest.Mock).mockReturnValue('light');
      (useHighContrast as jest.Mock).mockReturnValue(false);

      const { result } = renderHook(() => useBorderStyle());

      expect(result.current.borderWidth).toBe(1);
      expect(result.current.borderColor).toBe(LightTheme.border);
    });

    it('ハイコントラストモードではborderWidthが2になる', () => {
      (useColorScheme as jest.Mock).mockReturnValue('light');
      (useHighContrast as jest.Mock).mockReturnValue(true);

      const { result } = renderHook(() => useBorderStyle());

      expect(result.current.borderWidth).toBe(2);
      expect(result.current.borderColor).toBe(HighContrastLightTheme.border);
    });

    it('ダークモードでもborderWidthが正しく設定される', () => {
      (useColorScheme as jest.Mock).mockReturnValue('dark');
      (useHighContrast as jest.Mock).mockReturnValue(false);

      const { result } = renderHook(() => useBorderStyle());

      expect(result.current.borderWidth).toBe(1);
      expect(result.current.borderColor).toBe(DarkTheme.border);
    });

    it('ハイコントラストダークモードではborderWidthが2になる', () => {
      (useColorScheme as jest.Mock).mockReturnValue('dark');
      (useHighContrast as jest.Mock).mockReturnValue(true);

      const { result } = renderHook(() => useBorderStyle());

      expect(result.current.borderWidth).toBe(2);
      expect(result.current.borderColor).toBe(HighContrastDarkTheme.border);
    });

    it('スタイルオブジェクトとして利用可能', () => {
      (useColorScheme as jest.Mock).mockReturnValue('light');
      (useHighContrast as jest.Mock).mockReturnValue(true);

      const { result } = renderHook(() => useBorderStyle());

      // borderColorとborderWidthの両方が含まれている
      expect(result.current).toHaveProperty('borderColor');
      expect(result.current).toHaveProperty('borderWidth');
      expect(typeof result.current.borderColor).toBe('string');
      expect(typeof result.current.borderWidth).toBe('number');
    });
  });
});
