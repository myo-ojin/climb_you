/**
 * useAccessibility Hooks Test
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { findNodeHandle } from 'react-native';
import {
  useAccessibility,
  useScreenReader,
  useReduceMotion,
  useAnnounce,
  useReduceTransparency,
  useBoldText,
  useGrayscale,
  useInvertColors,
  useHighContrast,
} from '../useAccessibility';
import { AccessibilityService } from '../../../services/AccessibilityService';

// Mock AccessibilityService
jest.mock('../../../services/AccessibilityService', () => ({
  AccessibilityService: {
    initialize: jest.fn().mockResolvedValue(undefined),
    getState: jest.fn(() => ({
      isScreenReaderEnabled: false,
      isBoldTextEnabled: false,
      isGrayscaleEnabled: false,
      isInvertColorsEnabled: false,
      isReduceTransparencyEnabled: false,
      isReduceMotionEnabled: false,
    })),
    isScreenReaderEnabled: jest.fn(() => false),
    isReduceMotionEnabled: jest.fn(() => false),
    addListener: jest.fn(() => jest.fn()),
    announce: jest.fn(),
    announceDelayed: jest.fn(),
    setAccessibilityFocus: jest.fn(),
  },
}));

jest.mock('react-native', () => ({
  findNodeHandle: jest.fn(() => 123),
}));

describe('useAccessibility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useAccessibility（フル機能版）', () => {
    it('初期状態を取得できる', async () => {
      const { result } = renderHook(() => useAccessibility());

      await waitFor(() => {
        expect(AccessibilityService.initialize).toHaveBeenCalled();
      });

      expect(result.current.state).toHaveProperty('isScreenReaderEnabled');
      expect(result.current.state).toHaveProperty('isReduceMotionEnabled');
      expect(result.current.isScreenReaderEnabled).toBe(false);
      expect(result.current.isReduceMotionEnabled).toBe(false);
    });

    it('スクリーンリーダーが有効な場合は状態を反映する', async () => {
      (AccessibilityService.getState as jest.Mock).mockReturnValue({
        isScreenReaderEnabled: true,
        isBoldTextEnabled: false,
        isGrayscaleEnabled: false,
        isInvertColorsEnabled: false,
        isReduceTransparencyEnabled: false,
        isReduceMotionEnabled: false,
      });

      const { result } = renderHook(() => useAccessibility());

      await waitFor(() => {
        expect(result.current.isScreenReaderEnabled).toBe(true);
      });
    });

    it('モーション低減が有効な場合は状態を反映する', async () => {
      (AccessibilityService.getState as jest.Mock).mockReturnValue({
        isScreenReaderEnabled: false,
        isBoldTextEnabled: false,
        isGrayscaleEnabled: false,
        isInvertColorsEnabled: false,
        isReduceTransparencyEnabled: false,
        isReduceMotionEnabled: true,
      });

      const { result } = renderHook(() => useAccessibility());

      await waitFor(() => {
        expect(result.current.isReduceMotionEnabled).toBe(true);
      });
    });

    it('アナウンス機能を使用できる', async () => {
      const { result } = renderHook(() => useAccessibility());

      await waitFor(() => {
        expect(AccessibilityService.initialize).toHaveBeenCalled();
      });

      act(() => {
        result.current.announce('テストメッセージ');
      });

      expect(AccessibilityService.announce).toHaveBeenCalledWith('テストメッセージ');
    });

    it('遅延アナウンス機能を使用できる', async () => {
      const { result } = renderHook(() => useAccessibility());

      await waitFor(() => {
        expect(AccessibilityService.initialize).toHaveBeenCalled();
      });

      act(() => {
        result.current.announceDelayed('遅延メッセージ', 300);
      });

      expect(AccessibilityService.announceDelayed).toHaveBeenCalledWith(
        '遅延メッセージ',
        300
      );
    });

    it('フォーカス設定機能を使用できる', async () => {
      const { result } = renderHook(() => useAccessibility());

      await waitFor(() => {
        expect(AccessibilityService.initialize).toHaveBeenCalled();
      });

      const mockRef = { current: {} };

      act(() => {
        result.current.setFocus(mockRef);
      });

      expect(findNodeHandle).toHaveBeenCalledWith(mockRef.current);
      expect(AccessibilityService.setAccessibilityFocus).toHaveBeenCalledWith(123);
    });

    it('refがnullの場合はフォーカス設定をスキップする', async () => {
      const { result } = renderHook(() => useAccessibility());

      await waitFor(() => {
        expect(AccessibilityService.initialize).toHaveBeenCalled();
      });

      const mockRef = { current: null };

      act(() => {
        result.current.setFocus(mockRef);
      });

      expect(AccessibilityService.setAccessibilityFocus).not.toHaveBeenCalled();
    });

    it('アンマウント時にリスナーをクリーンアップする', async () => {
      const mockUnsubscribe = jest.fn();
      (AccessibilityService.addListener as jest.Mock).mockReturnValue(mockUnsubscribe);

      const { unmount } = renderHook(() => useAccessibility());

      await waitFor(() => {
        expect(AccessibilityService.addListener).toHaveBeenCalled();
      });

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it('状態変更時にリスナーが呼ばれる', async () => {
      let listener: (state: any) => void = () => {};
      (AccessibilityService.addListener as jest.Mock).mockImplementation((cb) => {
        listener = cb;
        return jest.fn();
      });

      const { result } = renderHook(() => useAccessibility());

      await waitFor(() => {
        expect(AccessibilityService.addListener).toHaveBeenCalled();
      });

      // 状態変更をシミュレート
      act(() => {
        listener({
          isScreenReaderEnabled: true,
          isBoldTextEnabled: false,
          isGrayscaleEnabled: false,
          isInvertColorsEnabled: false,
          isReduceTransparencyEnabled: false,
          isReduceMotionEnabled: false,
        });
      });

      expect(result.current.isScreenReaderEnabled).toBe(true);
    });
  });

  describe('useScreenReader（軽量版）', () => {
    it('スクリーンリーダー状態を取得できる', async () => {
      (AccessibilityService.isScreenReaderEnabled as jest.Mock).mockReturnValue(false);

      const { result } = renderHook(() => useScreenReader());

      await waitFor(() => {
        expect(AccessibilityService.initialize).toHaveBeenCalled();
      });

      expect(result.current).toBe(false);
    });

    it('スクリーンリーダーが有効な場合はtrueを返す', async () => {
      (AccessibilityService.isScreenReaderEnabled as jest.Mock).mockReturnValue(true);

      const { result } = renderHook(() => useScreenReader());

      await waitFor(() => {
        expect(result.current).toBe(true);
      });
    });

    it('状態変更を検知できる', async () => {
      let listener: (state: any) => void = () => {};
      (AccessibilityService.addListener as jest.Mock).mockImplementation((cb) => {
        listener = cb;
        return jest.fn();
      });
      (AccessibilityService.isScreenReaderEnabled as jest.Mock).mockReturnValue(false);

      const { result } = renderHook(() => useScreenReader());

      await waitFor(() => {
        expect(AccessibilityService.addListener).toHaveBeenCalled();
      });

      // 状態変更をシミュレート
      act(() => {
        listener({
          isScreenReaderEnabled: true,
          isBoldTextEnabled: false,
          isGrayscaleEnabled: false,
          isInvertColorsEnabled: false,
          isReduceTransparencyEnabled: false,
          isReduceMotionEnabled: false,
        });
      });

      expect(result.current).toBe(true);
    });

    it('アンマウント時にリスナーをクリーンアップする', async () => {
      const mockUnsubscribe = jest.fn();
      (AccessibilityService.addListener as jest.Mock).mockReturnValue(mockUnsubscribe);

      const { unmount } = renderHook(() => useScreenReader());

      await waitFor(() => {
        expect(AccessibilityService.addListener).toHaveBeenCalled();
      });

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });

  describe('useReduceMotion（軽量版）', () => {
    it('モーション低減状態を取得できる', async () => {
      (AccessibilityService.isReduceMotionEnabled as jest.Mock).mockReturnValue(false);

      const { result } = renderHook(() => useReduceMotion());

      await waitFor(() => {
        expect(AccessibilityService.initialize).toHaveBeenCalled();
      });

      expect(result.current).toBe(false);
    });

    it('モーション低減が有効な場合はtrueを返す', async () => {
      (AccessibilityService.isReduceMotionEnabled as jest.Mock).mockReturnValue(true);

      const { result } = renderHook(() => useReduceMotion());

      await waitFor(() => {
        expect(result.current).toBe(true);
      });
    });

    it('状態変更を検知できる', async () => {
      let listener: (state: any) => void = () => {};
      (AccessibilityService.addListener as jest.Mock).mockImplementation((cb) => {
        listener = cb;
        return jest.fn();
      });
      (AccessibilityService.isReduceMotionEnabled as jest.Mock).mockReturnValue(false);

      const { result } = renderHook(() => useReduceMotion());

      await waitFor(() => {
        expect(AccessibilityService.addListener).toHaveBeenCalled();
      });

      // 状態変更をシミュレート
      act(() => {
        listener({
          isScreenReaderEnabled: false,
          isBoldTextEnabled: false,
          isGrayscaleEnabled: false,
          isInvertColorsEnabled: false,
          isReduceTransparencyEnabled: false,
          isReduceMotionEnabled: true,
        });
      });

      expect(result.current).toBe(true);
    });

    it('アンマウント時にリスナーをクリーンアップする', async () => {
      const mockUnsubscribe = jest.fn();
      (AccessibilityService.addListener as jest.Mock).mockReturnValue(mockUnsubscribe);

      const { unmount } = renderHook(() => useReduceMotion());

      await waitFor(() => {
        expect(AccessibilityService.addListener).toHaveBeenCalled();
      });

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });

  describe('useAnnounce（軽量版）', () => {
    it('アナウンス機能を提供する', async () => {
      const { result } = renderHook(() => useAnnounce());

      await waitFor(() => {
        expect(AccessibilityService.initialize).toHaveBeenCalled();
      });

      act(() => {
        result.current('テストアナウンス');
      });

      expect(AccessibilityService.announce).toHaveBeenCalledWith('テストアナウンス');
    });

    it('複数回呼び出せる', async () => {
      const { result } = renderHook(() => useAnnounce());

      await waitFor(() => {
        expect(AccessibilityService.initialize).toHaveBeenCalled();
      });

      act(() => {
        result.current('メッセージ1');
        result.current('メッセージ2');
        result.current('メッセージ3');
      });

      expect(AccessibilityService.announce).toHaveBeenCalledTimes(3);
      expect(AccessibilityService.announce).toHaveBeenCalledWith('メッセージ1');
      expect(AccessibilityService.announce).toHaveBeenCalledWith('メッセージ2');
      expect(AccessibilityService.announce).toHaveBeenCalledWith('メッセージ3');
    });

    it('参照が安定している', () => {
      const { result, rerender } = renderHook(() => useAnnounce());

      const firstAnnounce = result.current;
      rerender();
      const secondAnnounce = result.current;

      expect(firstAnnounce).toBe(secondAnnounce);
    });
  });

  describe('useReduceTransparency（軽量版）', () => {
    it('透明度削減状態を取得できる', async () => {
      (AccessibilityService.getState as jest.Mock).mockReturnValue({
        isScreenReaderEnabled: false,
        isBoldTextEnabled: false,
        isGrayscaleEnabled: false,
        isInvertColorsEnabled: false,
        isReduceTransparencyEnabled: false,
        isReduceMotionEnabled: false,
      });

      const { result } = renderHook(() => useReduceTransparency());

      await waitFor(() => {
        expect(AccessibilityService.initialize).toHaveBeenCalled();
      });

      expect(result.current).toBe(false);
    });

    it('透明度削減が有効な場合はtrueを返す', async () => {
      (AccessibilityService.getState as jest.Mock).mockReturnValue({
        isScreenReaderEnabled: false,
        isBoldTextEnabled: false,
        isGrayscaleEnabled: false,
        isInvertColorsEnabled: false,
        isReduceTransparencyEnabled: true,
        isReduceMotionEnabled: false,
      });

      const { result } = renderHook(() => useReduceTransparency());

      await waitFor(() => {
        expect(result.current).toBe(true);
      });
    });

    it('状態変更を検知できる', async () => {
      let listener: (state: any) => void = () => {};
      (AccessibilityService.addListener as jest.Mock).mockImplementation((cb) => {
        listener = cb;
        return jest.fn();
      });
      (AccessibilityService.getState as jest.Mock).mockReturnValue({
        isScreenReaderEnabled: false,
        isBoldTextEnabled: false,
        isGrayscaleEnabled: false,
        isInvertColorsEnabled: false,
        isReduceTransparencyEnabled: false,
        isReduceMotionEnabled: false,
      });

      const { result } = renderHook(() => useReduceTransparency());

      await waitFor(() => {
        expect(AccessibilityService.addListener).toHaveBeenCalled();
      });

      // 状態変更をシミュレート
      act(() => {
        listener({
          isScreenReaderEnabled: false,
          isBoldTextEnabled: false,
          isGrayscaleEnabled: false,
          isInvertColorsEnabled: false,
          isReduceTransparencyEnabled: true,
          isReduceMotionEnabled: false,
        });
      });

      expect(result.current).toBe(true);
    });
  });

  describe('useBoldText（軽量版）', () => {
    it('太字テキスト状態を取得できる', async () => {
      (AccessibilityService.getState as jest.Mock).mockReturnValue({
        isScreenReaderEnabled: false,
        isBoldTextEnabled: false,
        isGrayscaleEnabled: false,
        isInvertColorsEnabled: false,
        isReduceTransparencyEnabled: false,
        isReduceMotionEnabled: false,
      });

      const { result } = renderHook(() => useBoldText());

      await waitFor(() => {
        expect(AccessibilityService.initialize).toHaveBeenCalled();
      });

      expect(result.current).toBe(false);
    });

    it('太字テキストが有効な場合はtrueを返す', async () => {
      (AccessibilityService.getState as jest.Mock).mockReturnValue({
        isScreenReaderEnabled: false,
        isBoldTextEnabled: true,
        isGrayscaleEnabled: false,
        isInvertColorsEnabled: false,
        isReduceTransparencyEnabled: false,
        isReduceMotionEnabled: false,
      });

      const { result } = renderHook(() => useBoldText());

      await waitFor(() => {
        expect(result.current).toBe(true);
      });
    });
  });

  describe('useGrayscale（軽量版）', () => {
    it('グレースケール状態を取得できる', async () => {
      (AccessibilityService.getState as jest.Mock).mockReturnValue({
        isScreenReaderEnabled: false,
        isBoldTextEnabled: false,
        isGrayscaleEnabled: false,
        isInvertColorsEnabled: false,
        isReduceTransparencyEnabled: false,
        isReduceMotionEnabled: false,
      });

      const { result } = renderHook(() => useGrayscale());

      await waitFor(() => {
        expect(AccessibilityService.initialize).toHaveBeenCalled();
      });

      expect(result.current).toBe(false);
    });

    it('グレースケールが有効な場合はtrueを返す', async () => {
      (AccessibilityService.getState as jest.Mock).mockReturnValue({
        isScreenReaderEnabled: false,
        isBoldTextEnabled: false,
        isGrayscaleEnabled: true,
        isInvertColorsEnabled: false,
        isReduceTransparencyEnabled: false,
        isReduceMotionEnabled: false,
      });

      const { result } = renderHook(() => useGrayscale());

      await waitFor(() => {
        expect(result.current).toBe(true);
      });
    });
  });

  describe('useInvertColors（軽量版）', () => {
    it('反転色状態を取得できる', async () => {
      (AccessibilityService.getState as jest.Mock).mockReturnValue({
        isScreenReaderEnabled: false,
        isBoldTextEnabled: false,
        isGrayscaleEnabled: false,
        isInvertColorsEnabled: false,
        isReduceTransparencyEnabled: false,
        isReduceMotionEnabled: false,
      });

      const { result } = renderHook(() => useInvertColors());

      await waitFor(() => {
        expect(AccessibilityService.initialize).toHaveBeenCalled();
      });

      expect(result.current).toBe(false);
    });

    it('反転色が有効な場合はtrueを返す', async () => {
      (AccessibilityService.getState as jest.Mock).mockReturnValue({
        isScreenReaderEnabled: false,
        isBoldTextEnabled: false,
        isGrayscaleEnabled: false,
        isInvertColorsEnabled: true,
        isReduceTransparencyEnabled: false,
        isReduceMotionEnabled: false,
      });

      const { result } = renderHook(() => useInvertColors());

      await waitFor(() => {
        expect(result.current).toBe(true);
      });
    });
  });

  describe('useHighContrast（軽量版）', () => {
    it('すべてのハイコントラスト設定がオフの場合はfalseを返す', async () => {
      (AccessibilityService.getState as jest.Mock).mockReturnValue({
        isScreenReaderEnabled: false,
        isBoldTextEnabled: false,
        isGrayscaleEnabled: false,
        isInvertColorsEnabled: false,
        isReduceTransparencyEnabled: false,
        isReduceMotionEnabled: false,
      });

      const { result } = renderHook(() => useHighContrast());

      await waitFor(() => {
        expect(AccessibilityService.initialize).toHaveBeenCalled();
      });

      expect(result.current).toBe(false);
    });

    it('太字テキストが有効な場合はtrueを返す', async () => {
      (AccessibilityService.getState as jest.Mock).mockReturnValue({
        isScreenReaderEnabled: false,
        isBoldTextEnabled: true,
        isGrayscaleEnabled: false,
        isInvertColorsEnabled: false,
        isReduceTransparencyEnabled: false,
        isReduceMotionEnabled: false,
      });

      const { result } = renderHook(() => useHighContrast());

      await waitFor(() => {
        expect(result.current).toBe(true);
      });
    });

    it('グレースケールが有効な場合はtrueを返す', async () => {
      (AccessibilityService.getState as jest.Mock).mockReturnValue({
        isScreenReaderEnabled: false,
        isBoldTextEnabled: false,
        isGrayscaleEnabled: true,
        isInvertColorsEnabled: false,
        isReduceTransparencyEnabled: false,
        isReduceMotionEnabled: false,
      });

      const { result } = renderHook(() => useHighContrast());

      await waitFor(() => {
        expect(result.current).toBe(true);
      });
    });

    it('反転色が有効な場合はtrueを返す', async () => {
      (AccessibilityService.getState as jest.Mock).mockReturnValue({
        isScreenReaderEnabled: false,
        isBoldTextEnabled: false,
        isGrayscaleEnabled: false,
        isInvertColorsEnabled: true,
        isReduceTransparencyEnabled: false,
        isReduceMotionEnabled: false,
      });

      const { result } = renderHook(() => useHighContrast());

      await waitFor(() => {
        expect(result.current).toBe(true);
      });
    });

    it('複数の設定が有効な場合はtrueを返す', async () => {
      (AccessibilityService.getState as jest.Mock).mockReturnValue({
        isScreenReaderEnabled: false,
        isBoldTextEnabled: true,
        isGrayscaleEnabled: true,
        isInvertColorsEnabled: true,
        isReduceTransparencyEnabled: false,
        isReduceMotionEnabled: false,
      });

      const { result } = renderHook(() => useHighContrast());

      await waitFor(() => {
        expect(result.current).toBe(true);
      });
    });

    it('状態変更を検知できる', async () => {
      let listener: (state: any) => void = () => {};
      (AccessibilityService.addListener as jest.Mock).mockImplementation((cb) => {
        listener = cb;
        return jest.fn();
      });
      (AccessibilityService.getState as jest.Mock).mockReturnValue({
        isScreenReaderEnabled: false,
        isBoldTextEnabled: false,
        isGrayscaleEnabled: false,
        isInvertColorsEnabled: false,
        isReduceTransparencyEnabled: false,
        isReduceMotionEnabled: false,
      });

      const { result } = renderHook(() => useHighContrast());

      await waitFor(() => {
        expect(AccessibilityService.addListener).toHaveBeenCalled();
      });

      expect(result.current).toBe(false);

      // 太字テキストを有効化
      act(() => {
        listener({
          isScreenReaderEnabled: false,
          isBoldTextEnabled: true,
          isGrayscaleEnabled: false,
          isInvertColorsEnabled: false,
          isReduceTransparencyEnabled: false,
          isReduceMotionEnabled: false,
        });
      });

      expect(result.current).toBe(true);
    });
  });
});
