/**
 * useVisibility Hook
 * コンポーネントの可視状態を検出（IntersectionObserver的な機能）
 *
 * 機能:
 * - コンポーネントが画面内に入ったときにコールバック実行
 * - 画面外に出たときにコールバック実行
 * - 遅延読み込みのトリガー
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { View, LayoutChangeEvent, findNodeHandle, UIManager } from 'react-native';

interface VisibilityOptions {
  /**
   * 画面内に入ったときのコールバック
   */
  onVisible?: () => void;

  /**
   * 画面外に出たときのコールバック
   */
  onHidden?: () => void;

  /**
   * 閾値（0-1）
   * 0: 少しでも見えたら可視
   * 1: 全体が見えたら可視
   */
  threshold?: number;

  /**
   * 一度だけ実行するか
   */
  once?: boolean;
}

interface VisibilityResult {
  /**
   * Viewにアタッチするref
   */
  ref: React.RefObject<View>;

  /**
   * 可視状態
   */
  isVisible: boolean;

  /**
   * onLayoutハンドラー
   */
  onLayout: (event: LayoutChangeEvent) => void;
}

/**
 * useVisibility Hook
 *
 * @example
 * ```tsx
 * function LazyImage({ uri }: { uri: string }) {
 *   const { ref, isVisible, onLayout } = useVisibility({
 *     onVisible: () => {
 *       console.log('Image is visible, loading...');
 *     },
 *     once: true,
 *   });
 *
 *   return (
 *     <View ref={ref} onLayout={onLayout}>
 *       {isVisible && <Image source={{ uri }} />}
 *     </View>
 *   );
 * }
 * ```
 */
export function useVisibility(options: VisibilityOptions = {}): VisibilityResult {
  const { onVisible, onHidden, threshold = 0, once = false } = options;

  const ref = useRef<View>(null);
  const [isVisible, setIsVisible] = useState(false);
  const hasTriggered = useRef(false);

  /**
   * レイアウト変更時のハンドラー
   */
  const onLayout = useCallback(
    (event: LayoutChangeEvent) => {
      if (once && hasTriggered.current) {
        return;
      }

      const { y, height } = event.nativeEvent.layout;

      // 簡易的な可視判定（実際の画面高さとの比較が必要）
      // React Nativeでは、Dimensions APIを使って画面高さを取得
      const windowHeight = 800; // 仮の値（実際はDimensions.get('window').heightを使用）

      const isInView = y >= 0 && y + height * threshold <= windowHeight;

      if (isInView && !isVisible) {
        setIsVisible(true);
        hasTriggered.current = true;
        onVisible?.();
      } else if (!isInView && isVisible) {
        setIsVisible(false);
        onHidden?.();
      }
    },
    [isVisible, threshold, once, onVisible, onHidden]
  );

  return {
    ref,
    isVisible,
    onLayout,
  };
}

/**
 * useIntersectionObserver Hook
 * より詳細な可視状態の検出
 *
 * @example
 * ```tsx
 * const { ref, isIntersecting, intersectionRatio } = useIntersectionObserver({
 *   threshold: 0.5,
 *   onChange: (isIntersecting, ratio) => {
 *     console.log(`Intersecting: ${isIntersecting}, Ratio: ${ratio}`);
 *   },
 * });
 * ```
 */
export function useIntersectionObserver(options: {
  threshold?: number;
  onChange?: (isIntersecting: boolean, ratio: number) => void;
  once?: boolean;
}) {
  const { threshold = 0, onChange, once = false } = options;

  const ref = useRef<View>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [intersectionRatio, setIntersectionRatio] = useState(0);
  const hasTriggered = useRef(false);

  const checkIntersection = useCallback(() => {
    if (once && hasTriggered.current) {
      return;
    }

    if (!ref.current) {
      return;
    }

    const handle = findNodeHandle(ref.current);
    if (!handle) {
      return;
    }

    UIManager.measure(handle, (_x, _y, width, height, pageX, pageY) => {
      // 画面サイズを取得（仮）
      const windowHeight = 800; // Dimensions.get('window').height

      const visibleHeight = Math.max(
        0,
        Math.min(pageY + height, windowHeight) - Math.max(pageY, 0)
      );

      const ratio = visibleHeight / height;
      const intersecting = ratio >= threshold;

      setIntersectionRatio(ratio);
      setIsIntersecting(intersecting);

      if (intersecting) {
        hasTriggered.current = true;
      }

      onChange?.(intersecting, ratio);
    });
  }, [threshold, onChange, once]);

  useEffect(() => {
    checkIntersection();
  }, [checkIntersection]);

  return {
    ref,
    isIntersecting,
    intersectionRatio,
    checkIntersection,
  };
}
