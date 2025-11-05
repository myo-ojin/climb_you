/**
 * AccessibilityService Test
 */

import { AccessibilityInfo } from 'react-native';
import { AccessibilityService } from '../AccessibilityService';

// Mock AccessibilityInfo
jest.mock('react-native', () => ({
  AccessibilityInfo: {
    isScreenReaderEnabled: jest.fn(),
    isBoldTextEnabled: jest.fn(),
    isGrayscaleEnabled: jest.fn(),
    isInvertColorsEnabled: jest.fn(),
    isReduceTransparencyEnabled: jest.fn(),
    isReduceMotionEnabled: jest.fn(),
    addEventListener: jest.fn(() => ({
      remove: jest.fn(),
    })),
    announceForAccessibility: jest.fn(),
    setAccessibilityFocus: jest.fn(),
  },
  Platform: {
    OS: 'ios',
  },
}));

describe('AccessibilityService', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    AccessibilityService.cleanup();
  });

  describe('initialize', () => {
    it('初期化できる', async () => {
      (AccessibilityInfo.isScreenReaderEnabled as jest.Mock).mockResolvedValue(false);
      (AccessibilityInfo.isBoldTextEnabled as jest.Mock).mockResolvedValue(false);
      (AccessibilityInfo.isGrayscaleEnabled as jest.Mock).mockResolvedValue(false);
      (AccessibilityInfo.isInvertColorsEnabled as jest.Mock).mockResolvedValue(false);
      (AccessibilityInfo.isReduceTransparencyEnabled as jest.Mock).mockResolvedValue(false);
      (AccessibilityInfo.isReduceMotionEnabled as jest.Mock).mockResolvedValue(false);

      await AccessibilityService.initialize();

      const state = AccessibilityService.getState();
      expect(state.isScreenReaderEnabled).toBe(false);
      expect(state.isBoldTextEnabled).toBe(false);
      expect(state.isGrayscaleEnabled).toBe(false);
      expect(state.isInvertColorsEnabled).toBe(false);
      expect(state.isReduceTransparencyEnabled).toBe(false);
      expect(state.isReduceMotionEnabled).toBe(false);
    });

    it('スクリーンリーダーが有効な状態を読み込める', async () => {
      (AccessibilityInfo.isScreenReaderEnabled as jest.Mock).mockResolvedValue(true);
      (AccessibilityInfo.isBoldTextEnabled as jest.Mock).mockResolvedValue(false);
      (AccessibilityInfo.isGrayscaleEnabled as jest.Mock).mockResolvedValue(false);
      (AccessibilityInfo.isInvertColorsEnabled as jest.Mock).mockResolvedValue(false);
      (AccessibilityInfo.isReduceTransparencyEnabled as jest.Mock).mockResolvedValue(false);
      (AccessibilityInfo.isReduceMotionEnabled as jest.Mock).mockResolvedValue(false);

      await AccessibilityService.initialize();

      const state = AccessibilityService.getState();
      expect(state.isScreenReaderEnabled).toBe(true);
    });

    it('既に初期化済みの場合はスキップする', async () => {
      (AccessibilityInfo.isScreenReaderEnabled as jest.Mock).mockResolvedValue(false);
      (AccessibilityInfo.isBoldTextEnabled as jest.Mock).mockResolvedValue(false);
      (AccessibilityInfo.isGrayscaleEnabled as jest.Mock).mockResolvedValue(false);
      (AccessibilityInfo.isInvertColorsEnabled as jest.Mock).mockResolvedValue(false);
      (AccessibilityInfo.isReduceTransparencyEnabled as jest.Mock).mockResolvedValue(false);
      (AccessibilityInfo.isReduceMotionEnabled as jest.Mock).mockResolvedValue(false);

      await AccessibilityService.initialize();
      await AccessibilityService.initialize(); // 2回目

      expect(AccessibilityInfo.isScreenReaderEnabled).toHaveBeenCalledTimes(1); // 1回のみ
    });

    it('イベントリスナーを設定する', async () => {
      (AccessibilityInfo.isScreenReaderEnabled as jest.Mock).mockResolvedValue(false);
      (AccessibilityInfo.isBoldTextEnabled as jest.Mock).mockResolvedValue(false);
      (AccessibilityInfo.isGrayscaleEnabled as jest.Mock).mockResolvedValue(false);
      (AccessibilityInfo.isInvertColorsEnabled as jest.Mock).mockResolvedValue(false);
      (AccessibilityInfo.isReduceTransparencyEnabled as jest.Mock).mockResolvedValue(false);
      (AccessibilityInfo.isReduceMotionEnabled as jest.Mock).mockResolvedValue(false);

      await AccessibilityService.initialize();

      expect(AccessibilityInfo.addEventListener).toHaveBeenCalledWith(
        'screenReaderChanged',
        expect.any(Function)
      );
      expect(AccessibilityInfo.addEventListener).toHaveBeenCalledWith(
        'reduceMotionChanged',
        expect.any(Function)
      );
    });
  });

  describe('getState', () => {
    it('アクセシビリティ状態を取得できる', async () => {
      (AccessibilityInfo.isScreenReaderEnabled as jest.Mock).mockResolvedValue(true);
      (AccessibilityInfo.isBoldTextEnabled as jest.Mock).mockResolvedValue(false);
      (AccessibilityInfo.isGrayscaleEnabled as jest.Mock).mockResolvedValue(true);
      (AccessibilityInfo.isInvertColorsEnabled as jest.Mock).mockResolvedValue(false);
      (AccessibilityInfo.isReduceTransparencyEnabled as jest.Mock).mockResolvedValue(true);
      (AccessibilityInfo.isReduceMotionEnabled as jest.Mock).mockResolvedValue(false);

      await AccessibilityService.initialize();
      const state = AccessibilityService.getState();

      expect(state).toHaveProperty('isScreenReaderEnabled');
      expect(state).toHaveProperty('isBoldTextEnabled');
      expect(state).toHaveProperty('isGrayscaleEnabled');
      expect(state).toHaveProperty('isInvertColorsEnabled');
      expect(state).toHaveProperty('isReduceTransparencyEnabled');
      expect(state).toHaveProperty('isReduceMotionEnabled');
      expect(state.isScreenReaderEnabled).toBe(true);
      expect(state.isGrayscaleEnabled).toBe(true);
      expect(state.isReduceTransparencyEnabled).toBe(true);
    });
  });

  describe('isScreenReaderEnabled', () => {
    it('スクリーンリーダー有効状態を取得できる', async () => {
      (AccessibilityInfo.isScreenReaderEnabled as jest.Mock).mockResolvedValue(true);
      (AccessibilityInfo.isBoldTextEnabled as jest.Mock).mockResolvedValue(false);
      (AccessibilityInfo.isGrayscaleEnabled as jest.Mock).mockResolvedValue(false);
      (AccessibilityInfo.isInvertColorsEnabled as jest.Mock).mockResolvedValue(false);
      (AccessibilityInfo.isReduceTransparencyEnabled as jest.Mock).mockResolvedValue(false);
      (AccessibilityInfo.isReduceMotionEnabled as jest.Mock).mockResolvedValue(false);

      await AccessibilityService.initialize();

      expect(AccessibilityService.isScreenReaderEnabled()).toBe(true);
    });
  });

  describe('isReduceMotionEnabled', () => {
    it('モーション低減有効状態を取得できる', async () => {
      (AccessibilityInfo.isScreenReaderEnabled as jest.Mock).mockResolvedValue(false);
      (AccessibilityInfo.isBoldTextEnabled as jest.Mock).mockResolvedValue(false);
      (AccessibilityInfo.isGrayscaleEnabled as jest.Mock).mockResolvedValue(false);
      (AccessibilityInfo.isInvertColorsEnabled as jest.Mock).mockResolvedValue(false);
      (AccessibilityInfo.isReduceTransparencyEnabled as jest.Mock).mockResolvedValue(false);
      (AccessibilityInfo.isReduceMotionEnabled as jest.Mock).mockResolvedValue(true);

      await AccessibilityService.initialize();

      expect(AccessibilityService.isReduceMotionEnabled()).toBe(true);
    });
  });

  describe('addListener', () => {
    it('リスナーを追加できる', async () => {
      (AccessibilityInfo.isScreenReaderEnabled as jest.Mock).mockResolvedValue(false);
      (AccessibilityInfo.isBoldTextEnabled as jest.Mock).mockResolvedValue(false);
      (AccessibilityInfo.isGrayscaleEnabled as jest.Mock).mockResolvedValue(false);
      (AccessibilityInfo.isInvertColorsEnabled as jest.Mock).mockResolvedValue(false);
      (AccessibilityInfo.isReduceTransparencyEnabled as jest.Mock).mockResolvedValue(false);
      (AccessibilityInfo.isReduceMotionEnabled as jest.Mock).mockResolvedValue(false);

      await AccessibilityService.initialize();

      const mockListener = jest.fn();
      const unsubscribe = AccessibilityService.addListener(mockListener);

      // 初回通知が来る
      expect(mockListener).toHaveBeenCalledWith(
        expect.objectContaining({
          isScreenReaderEnabled: false,
        })
      );

      // クリーンアップできる
      unsubscribe();
      expect(unsubscribe).toBeInstanceOf(Function);
    });
  });

  describe('announce', () => {
    it('アナウンスできる', async () => {
      (AccessibilityInfo.isScreenReaderEnabled as jest.Mock).mockResolvedValue(false);
      (AccessibilityInfo.isBoldTextEnabled as jest.Mock).mockResolvedValue(false);
      (AccessibilityInfo.isGrayscaleEnabled as jest.Mock).mockResolvedValue(false);
      (AccessibilityInfo.isInvertColorsEnabled as jest.Mock).mockResolvedValue(false);
      (AccessibilityInfo.isReduceTransparencyEnabled as jest.Mock).mockResolvedValue(false);
      (AccessibilityInfo.isReduceMotionEnabled as jest.Mock).mockResolvedValue(false);

      await AccessibilityService.initialize();

      AccessibilityService.announce('テストメッセージ');

      expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith('テストメッセージ');
    });
  });

  describe('announceDelayed', () => {
    it('遅延アナウンスできる', async () => {
      jest.useFakeTimers();

      (AccessibilityInfo.isScreenReaderEnabled as jest.Mock).mockResolvedValue(false);
      (AccessibilityInfo.isBoldTextEnabled as jest.Mock).mockResolvedValue(false);
      (AccessibilityInfo.isGrayscaleEnabled as jest.Mock).mockResolvedValue(false);
      (AccessibilityInfo.isInvertColorsEnabled as jest.Mock).mockResolvedValue(false);
      (AccessibilityInfo.isReduceTransparencyEnabled as jest.Mock).mockResolvedValue(false);
      (AccessibilityInfo.isReduceMotionEnabled as jest.Mock).mockResolvedValue(false);

      await AccessibilityService.initialize();

      AccessibilityService.announceDelayed('遅延メッセージ', 500);

      // まだ呼ばれていない
      expect(AccessibilityInfo.announceForAccessibility).not.toHaveBeenCalled();

      // 500ms経過
      jest.advanceTimersByTime(500);

      expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith('遅延メッセージ');

      jest.useRealTimers();
    });
  });

  describe('setAccessibilityFocus', () => {
    it('フォーカスを設定できる', async () => {
      (AccessibilityInfo.isScreenReaderEnabled as jest.Mock).mockResolvedValue(false);
      (AccessibilityInfo.isBoldTextEnabled as jest.Mock).mockResolvedValue(false);
      (AccessibilityInfo.isGrayscaleEnabled as jest.Mock).mockResolvedValue(false);
      (AccessibilityInfo.isInvertColorsEnabled as jest.Mock).mockResolvedValue(false);
      (AccessibilityInfo.isReduceTransparencyEnabled as jest.Mock).mockResolvedValue(false);
      (AccessibilityInfo.isReduceMotionEnabled as jest.Mock).mockResolvedValue(false);

      await AccessibilityService.initialize();

      AccessibilityService.setAccessibilityFocus(123);

      expect(AccessibilityInfo.setAccessibilityFocus).toHaveBeenCalledWith(123);
    });

    it('nullの場合はフォーカス設定をスキップする', async () => {
      (AccessibilityInfo.isScreenReaderEnabled as jest.Mock).mockResolvedValue(false);
      (AccessibilityInfo.isBoldTextEnabled as jest.Mock).mockResolvedValue(false);
      (AccessibilityInfo.isGrayscaleEnabled as jest.Mock).mockResolvedValue(false);
      (AccessibilityInfo.isInvertColorsEnabled as jest.Mock).mockResolvedValue(false);
      (AccessibilityInfo.isReduceTransparencyEnabled as jest.Mock).mockResolvedValue(false);
      (AccessibilityInfo.isReduceMotionEnabled as jest.Mock).mockResolvedValue(false);

      await AccessibilityService.initialize();

      AccessibilityService.setAccessibilityFocus(null);

      expect(AccessibilityInfo.setAccessibilityFocus).not.toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('クリーンアップできる', async () => {
      const mockRemove = jest.fn();
      (AccessibilityInfo.addEventListener as jest.Mock).mockReturnValue({
        remove: mockRemove,
      });
      (AccessibilityInfo.isScreenReaderEnabled as jest.Mock).mockResolvedValue(false);
      (AccessibilityInfo.isBoldTextEnabled as jest.Mock).mockResolvedValue(false);
      (AccessibilityInfo.isGrayscaleEnabled as jest.Mock).mockResolvedValue(false);
      (AccessibilityInfo.isInvertColorsEnabled as jest.Mock).mockResolvedValue(false);
      (AccessibilityInfo.isReduceTransparencyEnabled as jest.Mock).mockResolvedValue(false);
      (AccessibilityInfo.isReduceMotionEnabled as jest.Mock).mockResolvedValue(false);

      await AccessibilityService.initialize();

      AccessibilityService.cleanup();

      expect(mockRemove).toHaveBeenCalled();
    });
  });
});
