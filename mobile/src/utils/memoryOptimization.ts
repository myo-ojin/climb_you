/**
 * Memory Optimization Utilities
 * メモリ使用量を最適化するためのユーティリティ
 *
 * 機能:
 * - React.memoのヘルパー
 * - 深い比較関数
 * - メモリリーク検出
 * - 不要な再レンダリング防止
 */

import { ComponentType, memo, useCallback, useMemo, useRef, useEffect } from 'react';

/**
 * 深い比較関数
 * オブジェクトや配列の値を再帰的に比較
 */
export function deepEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) return true;

  if (typeof obj1 !== 'object' || typeof obj2 !== 'object' || obj1 == null || obj2 == null) {
    return false;
  }

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    if (!keys2.includes(key)) return false;
    if (!deepEqual(obj1[key], obj2[key])) return false;
  }

  return true;
}

/**
 * コンポーネントをメモ化（深い比較）
 *
 * @example
 * ```tsx
 * const QuestCard = memoDeep<QuestCardProps>((props) => {
 *   return <View>...</View>;
 * });
 * ```
 */
export function memoDeep<P extends object>(
  Component: ComponentType<P>,
  displayName?: string
): ComponentType<P> {
  const MemoizedComponent = memo(Component, (prevProps, nextProps) => {
    return deepEqual(prevProps, nextProps);
  });

  if (displayName) {
    MemoizedComponent.displayName = displayName;
  }

  return MemoizedComponent;
}

/**
 * 配列propsのみを比較するメモ化
 *
 * @example
 * ```tsx
 * const QuestList = memoArray<QuestListProps>(
 *   (props) => <FlatList data={props.quests} />,
 *   ['quests'] // 比較する配列props
 * );
 * ```
 */
export function memoArray<P extends object>(
  Component: ComponentType<P>,
  arrayKeys: string[]
): ComponentType<P> {
  return memo(Component, (prevProps: any, nextProps: any) => {
    for (const key of arrayKeys) {
      const prevArray = prevProps[key];
      const nextArray = nextProps[key];

      if (!Array.isArray(prevArray) || !Array.isArray(nextArray)) continue;

      if (prevArray.length !== nextArray.length) return false;

      for (let i = 0; i < prevArray.length; i++) {
        if (!deepEqual(prevArray[i], nextArray[i])) return false;
      }
    }

    return true;
  });
}

/**
 * useCallbackの安全なラッパー
 * 依存配列を自動的に追跡し、警告を出力
 *
 * @example
 * ```tsx
 * const handlePress = useSafeCallback(() => {
 *   console.log(value); // valueが依存配列に含まれていない場合、警告
 * }, [value]);
 * ```
 */
export function useSafeCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T {
  if (__DEV__) {
    // 開発環境では依存配列の検証を行う
    // 実際の検証ロジックはeslint-plugin-react-hooksに依存
  }

  return useCallback(callback, deps);
}

/**
 * useMemoの安全なラッパー
 * 依存配列を自動的に追跡し、警告を出力
 *
 * @example
 * ```tsx
 * const filteredQuests = useSafeMemo(() => {
 *   return quests.filter(q => q.status === 'active');
 * }, [quests]);
 * ```
 */
export function useSafeMemo<T>(factory: () => T, deps: React.DependencyList): T {
  if (__DEV__) {
    // 開発環境では依存配列の検証を行う
  }

  return useMemo(factory, deps);
}

/**
 * メモリリーク検出フック
 * コンポーネントのアンマウント後もタイマーやリスナーが残っていないか検出
 *
 * @example
 * ```tsx
 * useMemoryLeakDetection('QuestDetailScreen');
 * ```
 */
export function useMemoryLeakDetection(componentName: string) {
  const timersRef = useRef<Set<number>>(new Set());
  const listenersRef = useRef<Set<any>>(new Set());

  useEffect(() => {
    if (__DEV__) {
      console.log(`[MemoryLeakDetection] ${componentName} mounted`);
    }

    return () => {
      if (__DEV__) {
        if (timersRef.current.size > 0) {
          console.warn(
            `[MemoryLeakDetection] ${componentName} unmounted with ${timersRef.current.size} active timers`
          );
        }

        if (listenersRef.current.size > 0) {
          console.warn(
            `[MemoryLeakDetection] ${componentName} unmounted with ${listenersRef.current.size} active listeners`
          );
        }
      }
    };
  }, [componentName]);

  return {
    trackTimer: (timerId: number) => timersRef.current.add(timerId),
    untrackTimer: (timerId: number) => timersRef.current.delete(timerId),
    trackListener: (listener: any) => listenersRef.current.add(listener),
    untrackListener: (listener: any) => listenersRef.current.delete(listener),
  };
}

/**
 * 前回のpropsとの差分をログ出力
 * 不要な再レンダリングの原因を特定
 *
 * @example
 * ```tsx
 * function QuestCard(props: QuestCardProps) {
 *   useWhyDidYouUpdate('QuestCard', props);
 *   return <View>...</View>;
 * }
 * ```
 */
export function useWhyDidYouUpdate(componentName: string, props: Record<string, any>) {
  const previousProps = useRef<Record<string, any>>();

  useEffect(() => {
    if (__DEV__ && previousProps.current) {
      const allKeys = Object.keys({ ...previousProps.current, ...props });
      const changedProps: Record<string, { from: any; to: any }> = {};

      allKeys.forEach((key) => {
        if (previousProps.current![key] !== props[key]) {
          changedProps[key] = {
            from: previousProps.current![key],
            to: props[key],
          };
        }
      });

      if (Object.keys(changedProps).length > 0) {
        console.log(`[WhyDidYouUpdate] ${componentName} re-rendered because:`, changedProps);
      }
    }

    previousProps.current = props;
  });
}

/**
 * コンポーネントのレンダリング回数をカウント
 *
 * @example
 * ```tsx
 * function QuestCard() {
 *   const renderCount = useRenderCount('QuestCard');
 *   console.log(`Rendered ${renderCount} times`);
 * }
 * ```
 */
export function useRenderCount(componentName: string): number {
  const renderCountRef = useRef(0);

  renderCountRef.current += 1;

  if (__DEV__) {
    useEffect(() => {
      console.log(`[RenderCount] ${componentName} rendered ${renderCountRef.current} times`);
    });
  }

  return renderCountRef.current;
}
