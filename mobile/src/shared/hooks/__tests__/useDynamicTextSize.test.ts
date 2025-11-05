/**
 * useDynamicTextSize Hooks Test
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { PixelRatio, Dimensions } from 'react-native';
import {
  useDynamicTextSize,
  useFontScale,
  useScaledFont,
  scaleFontSize,
} from '../useDynamicTextSize';

// Mock PixelRatio
jest.mock('react-native', () => ({
  PixelRatio: {
    getFontScale: jest.fn(() => 1.0),
  },
  Platform: {
    OS: 'ios',
  },
  Dimensions: {
    addEventListener: jest.fn(() => ({
      remove: jest.fn(),
    })),
    get: jest.fn(() => ({
      width: 375,
      height: 812,
      fontScale: 1.0,
    })),
  },
}));

describe('useDynamicTextSize', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (PixelRatio.getFontScale as jest.Mock).mockReturnValue(1.0);
  });

  describe('useDynamicTextSize（フル機能版）', () => {
    it('デフォルトのフォントスケールを取得できる', () => {
      const { result } = renderHook(() => useDynamicTextSize());

      expect(result.current.fontScale).toBe(1.0);
      expect(result.current.isLargeTextEnabled).toBe(false);
      expect(result.current.isMaxScaleReached).toBe(false);
      expect(result.current.isMinScaleReached).toBe(false);
    });

    it('フォントスケール1.3の場合、大きなテキストが有効と判定される', () => {
      (PixelRatio.getFontScale as jest.Mock).mockReturnValue(1.3);

      const { result } = renderHook(() => useDynamicTextSize());

      expect(result.current.fontScale).toBe(1.3);
      expect(result.current.isLargeTextEnabled).toBe(true);
    });

    it('最大スケール制限が適用される', () => {
      (PixelRatio.getFontScale as jest.Mock).mockReturnValue(2.0);

      const { result } = renderHook(() => useDynamicTextSize({ maxScale: 1.5 }));

      expect(result.current.fontScale).toBe(1.5);
      expect(result.current.isMaxScaleReached).toBe(true);
    });

    it('最小スケール制限が適用される', () => {
      (PixelRatio.getFontScale as jest.Mock).mockReturnValue(0.5);

      const { result } = renderHook(() => useDynamicTextSize({ minScale: 0.85 }));

      expect(result.current.fontScale).toBe(0.85);
      expect(result.current.isMinScaleReached).toBe(true);
    });

    it('scaleFontでフォントサイズをスケーリングできる', () => {
      (PixelRatio.getFontScale as jest.Mock).mockReturnValue(1.2);

      const { result } = renderHook(() => useDynamicTextSize());

      const scaledSize = result.current.scaleFont(16);
      expect(scaledSize).toBe(19); // 16 * 1.2 = 19.2 → 19（四捨五入）
    });

    it('scaleFontで複数のフォントサイズをスケーリングできる', () => {
      (PixelRatio.getFontScale as jest.Mock).mockReturnValue(1.5);

      const { result } = renderHook(() => useDynamicTextSize());

      expect(result.current.scaleFont(12)).toBe(18); // 12 * 1.5 = 18
      expect(result.current.scaleFont(16)).toBe(24); // 16 * 1.5 = 24
      expect(result.current.scaleFont(20)).toBe(30); // 20 * 1.5 = 30
    });

    it('フォントスケール変更を検知できる', () => {
      let dimensionChangeCallback: any = null;
      (Dimensions.addEventListener as jest.Mock).mockImplementation((event, callback) => {
        if (event === 'change') {
          dimensionChangeCallback = callback;
        }
        return { remove: jest.fn() };
      });

      (PixelRatio.getFontScale as jest.Mock).mockReturnValue(1.0);

      const { result, rerender } = renderHook(() => useDynamicTextSize());

      expect(result.current.fontScale).toBe(1.0);

      // フォントスケールを変更
      (PixelRatio.getFontScale as jest.Mock).mockReturnValue(1.3);

      // Dimensions変更イベントをトリガー
      act(() => {
        if (dimensionChangeCallback) {
          dimensionChangeCallback({
            window: { width: 375, height: 812 },
            screen: { width: 375, height: 812 },
          });
        }
      });

      expect(result.current.fontScale).toBe(1.3);
      expect(result.current.isLargeTextEnabled).toBe(true);
    });

    it('アンマウント時にリスナーをクリーンアップする', () => {
      const mockRemove = jest.fn();
      (Dimensions.addEventListener as jest.Mock).mockReturnValue({
        remove: mockRemove,
      });

      const { unmount } = renderHook(() => useDynamicTextSize());

      unmount();

      expect(mockRemove).toHaveBeenCalled();
    });
  });

  describe('useFontScale（軽量版）', () => {
    it('フォントスケール係数を取得できる', () => {
      (PixelRatio.getFontScale as jest.Mock).mockReturnValue(1.2);

      const { result } = renderHook(() => useFontScale());

      expect(result.current).toBe(1.2);
    });

    it('最大スケール制限が適用される', () => {
      (PixelRatio.getFontScale as jest.Mock).mockReturnValue(2.0);

      const { result } = renderHook(() => useFontScale({ maxScale: 1.5 }));

      expect(result.current).toBe(1.5);
    });

    it('最小スケール制限が適用される', () => {
      (PixelRatio.getFontScale as jest.Mock).mockReturnValue(0.7);

      const { result } = renderHook(() => useFontScale({ minScale: 0.85 }));

      expect(result.current).toBe(0.85);
    });
  });

  describe('useScaledFont（軽量版）', () => {
    it('スケーリング関数を取得できる', () => {
      (PixelRatio.getFontScale as jest.Mock).mockReturnValue(1.25);

      const { result } = renderHook(() => useScaledFont());

      const scaledSize = result.current(16);
      expect(scaledSize).toBe(20); // 16 * 1.25 = 20
    });

    it('複数のサイズをスケーリングできる', () => {
      (PixelRatio.getFontScale as jest.Mock).mockReturnValue(1.5);

      const { result } = renderHook(() => useScaledFont());

      expect(result.current(10)).toBe(15);
      expect(result.current(14)).toBe(21);
      expect(result.current(18)).toBe(27);
    });

    it('関数の参照が安定している', () => {
      (PixelRatio.getFontScale as jest.Mock).mockReturnValue(1.0);

      const { result, rerender } = renderHook(() => useScaledFont());

      const firstFunction = result.current;
      rerender();
      const secondFunction = result.current;

      // フォントスケールが変わらない限り、同じ関数参照が返される
      expect(firstFunction).toBe(secondFunction);
    });
  });

  describe('scaleFontSize（ユーティリティ関数）', () => {
    it('静的にフォントサイズをスケーリングできる', () => {
      (PixelRatio.getFontScale as jest.Mock).mockReturnValue(1.2);

      const scaledSize = scaleFontSize(16);
      expect(scaledSize).toBe(19); // 16 * 1.2 = 19.2 → 19
    });

    it('最大スケール制限が適用される', () => {
      (PixelRatio.getFontScale as jest.Mock).mockReturnValue(2.0);

      const scaledSize = scaleFontSize(16, 1.5);
      expect(scaledSize).toBe(24); // 16 * 1.5 = 24
    });

    it('最小スケール制限が適用される', () => {
      (PixelRatio.getFontScale as jest.Mock).mockReturnValue(0.6);

      const scaledSize = scaleFontSize(16, 1.5, 0.85);
      expect(scaledSize).toBe(14); // 16 * 0.85 = 13.6 → 14
    });

    it('複数のサイズをスケーリングできる', () => {
      (PixelRatio.getFontScale as jest.Mock).mockReturnValue(1.3);

      expect(scaleFontSize(12)).toBe(16); // 12 * 1.3 = 15.6 → 16
      expect(scaleFontSize(16)).toBe(21); // 16 * 1.3 = 20.8 → 21
      expect(scaleFontSize(20)).toBe(26); // 20 * 1.3 = 26
    });
  });

  describe('エッジケース', () => {
    it('フォントスケールが0の場合も処理できる', () => {
      (PixelRatio.getFontScale as jest.Mock).mockReturnValue(0);

      const { result } = renderHook(() => useDynamicTextSize({ minScale: 0.85 }));

      expect(result.current.fontScale).toBe(0.85);
    });

    it('フォントスケールが非常に大きい場合も処理できる', () => {
      (PixelRatio.getFontScale as jest.Mock).mockReturnValue(10.0);

      const { result } = renderHook(() => useDynamicTextSize({ maxScale: 1.5 }));

      expect(result.current.fontScale).toBe(1.5);
    });

    it('基準フォントサイズが0の場合も処理できる', () => {
      (PixelRatio.getFontScale as jest.Mock).mockReturnValue(1.5);

      const { result } = renderHook(() => useDynamicTextSize());

      expect(result.current.scaleFont(0)).toBe(0);
    });

    it('基準フォントサイズが小数の場合は四捨五入される', () => {
      (PixelRatio.getFontScale as jest.Mock).mockReturnValue(1.5);

      const { result } = renderHook(() => useDynamicTextSize());

      expect(result.current.scaleFont(10.5)).toBe(16); // 10.5 * 1.5 = 15.75 → 16
    });
  });
});
