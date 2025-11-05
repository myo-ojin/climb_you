/**
 * useAccessibleFontSize Test
 */

import { renderHook } from '@testing-library/react-hooks';
import { PixelRatio, AccessibilityInfo } from 'react-native';
import {
  useAccessibleFontSize,
  useAccessibleFontSizes,
  useFontScale,
  getScaledFontSize,
} from '../useAccessibleFontSize';

// Mock React Native modules
jest.mock('react-native', () => ({
  PixelRatio: {
    getFontScale: jest.fn(() => 1.0),
  },
  AccessibilityInfo: {
    addEventListener: jest.fn(() => ({
      remove: jest.fn(),
    })),
  },
}));

describe('useAccessibleFontSize', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('フォントスケール1.0の場合、ベースサイズをそのまま返す', () => {
    (PixelRatio.getFontScale as jest.Mock).mockReturnValue(1.0);

    const { result } = renderHook(() => useAccessibleFontSize(16));

    expect(result.current).toBe(16);
  });

  it('フォントスケール1.2の場合、スケーリングされたサイズを返す', () => {
    (PixelRatio.getFontScale as jest.Mock).mockReturnValue(1.2);

    const { result } = renderHook(() => useAccessibleFontSize(16));

    expect(result.current).toBe(19.2);
  });

  it('フォントスケール1.5の場合、スケーリングされたサイズを返す', () => {
    (PixelRatio.getFontScale as jest.Mock).mockReturnValue(1.5);

    const { result } = renderHook(() => useAccessibleFontSize(16));

    expect(result.current).toBe(24);
  });

  it('最小サイズ制約が適用される', () => {
    (PixelRatio.getFontScale as jest.Mock).mockReturnValue(0.8);

    const { result } = renderHook(() =>
      useAccessibleFontSize(16, { minSize: 14 })
    );

    // 16 * 0.8 = 12.8 → minSize 14 が適用される
    expect(result.current).toBe(14);
  });

  it('最大サイズ制約が適用される', () => {
    (PixelRatio.getFontScale as jest.Mock).mockReturnValue(2.0);

    const { result } = renderHook(() =>
      useAccessibleFontSize(16, { maxSize: 24 })
    );

    // 16 * 2.0 = 32 → maxSize 24 が適用される
    expect(result.current).toBe(24);
  });

  it('最小・最大サイズ制約が両方適用される', () => {
    (PixelRatio.getFontScale as jest.Mock).mockReturnValue(1.5);

    const { result } = renderHook(() =>
      useAccessibleFontSize(16, { minSize: 12, maxSize: 20 })
    );

    // 16 * 1.5 = 24 → maxSize 20 が適用される
    expect(result.current).toBe(20);
  });

  it('boldTextChangedイベントリスナーが登録される', () => {
    renderHook(() => useAccessibleFontSize(16));

    expect(AccessibilityInfo.addEventListener).toHaveBeenCalledWith(
      'boldTextChanged',
      expect.any(Function)
    );
  });

  it('アンマウント時にイベントリスナーが削除される', () => {
    const mockRemove = jest.fn();
    (AccessibilityInfo.addEventListener as jest.Mock).mockReturnValue({
      remove: mockRemove,
    });

    const { unmount } = renderHook(() => useAccessibleFontSize(16));

    unmount();

    expect(mockRemove).toHaveBeenCalled();
  });
});

describe('useAccessibleFontSizes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('複数のフォントサイズをスケーリングできる', () => {
    (PixelRatio.getFontScale as jest.Mock).mockReturnValue(1.2);

    const { result } = renderHook(() =>
      useAccessibleFontSizes({
        small: 12,
        medium: 16,
        large: 20,
      })
    );

    expect(result.current.small).toBe(14.4);
    expect(result.current.medium).toBe(19.2);
    expect(result.current.large).toBe(24);
  });

  it('フォントスケール1.0の場合、元のサイズを返す', () => {
    (PixelRatio.getFontScale as jest.Mock).mockReturnValue(1.0);

    const { result } = renderHook(() =>
      useAccessibleFontSizes({
        title: 24,
        body: 16,
        caption: 12,
      })
    );

    expect(result.current.title).toBe(24);
    expect(result.current.body).toBe(16);
    expect(result.current.caption).toBe(12);
  });

  it('イベントリスナーが登録される', () => {
    renderHook(() =>
      useAccessibleFontSizes({
        small: 12,
        medium: 16,
      })
    );

    expect(AccessibilityInfo.addEventListener).toHaveBeenCalledWith(
      'boldTextChanged',
      expect.any(Function)
    );
  });
});

describe('useFontScale', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('現在のフォントスケールを返す', () => {
    (PixelRatio.getFontScale as jest.Mock).mockReturnValue(1.3);

    const { result } = renderHook(() => useFontScale());

    expect(result.current).toBe(1.3);
  });

  it('フォントスケール1.0の場合、1.0を返す', () => {
    (PixelRatio.getFontScale as jest.Mock).mockReturnValue(1.0);

    const { result } = renderHook(() => useFontScale());

    expect(result.current).toBe(1.0);
  });

  it('イベントリスナーが登録される', () => {
    renderHook(() => useFontScale());

    expect(AccessibilityInfo.addEventListener).toHaveBeenCalledWith(
      'boldTextChanged',
      expect.any(Function)
    );
  });

  it('アンマウント時にイベントリスナーが削除される', () => {
    const mockRemove = jest.fn();
    (AccessibilityInfo.addEventListener as jest.Mock).mockReturnValue({
      remove: mockRemove,
    });

    const { unmount } = renderHook(() => useFontScale());

    unmount();

    expect(mockRemove).toHaveBeenCalled();
  });
});

describe('getScaledFontSize', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('フォントスケール1.0の場合、元のサイズを返す', () => {
    (PixelRatio.getFontScale as jest.Mock).mockReturnValue(1.0);

    const result = getScaledFontSize(16);

    expect(result).toBe(16);
  });

  it('フォントスケール1.2の場合、スケーリングされたサイズを返す', () => {
    (PixelRatio.getFontScale as jest.Mock).mockReturnValue(1.2);

    const result = getScaledFontSize(16);

    expect(result).toBe(19.2);
  });

  it('フォントスケール2.0の場合、スケーリングされたサイズを返す', () => {
    (PixelRatio.getFontScale as jest.Mock).mockReturnValue(2.0);

    const result = getScaledFontSize(20);

    expect(result).toBe(40);
  });
});
