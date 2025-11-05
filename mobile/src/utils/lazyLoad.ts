/**
 * Lazy Loading Utilities
 * コンポーネントの遅延ロードをサポート
 *
 * 機能:
 * - React.lazy()のラッパー
 * - 遅延ロード時のエラーハンドリング
 * - リトライ機能
 * - プリロード機能
 */

import { lazy, ComponentType } from 'react';

interface LazyOptions {
  /**
   * ロード失敗時のリトライ回数
   */
  retries?: number;

  /**
   * リトライ間隔（ミリ秒）
   */
  retryDelay?: number;
}

/**
 * コンポーネントを遅延ロード（リトライ機能付き）
 *
 * @example
 * ```tsx
 * const QuestDetailScreen = lazyLoad(() => import('../screens/QuestDetailScreen'), {
 *   retries: 3,
 *   retryDelay: 1000,
 * });
 * ```
 */
export function lazyLoad<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyOptions = {}
): React.LazyExoticComponent<T> {
  const { retries = 3, retryDelay = 1000 } = options;

  const retryImport = async (attemptNumber: number = 0): Promise<{ default: T }> => {
    try {
      return await importFn();
    } catch (error) {
      if (attemptNumber < retries) {
        console.warn(
          `[lazyLoad] Import failed, retrying... (${attemptNumber + 1}/${retries})`,
          error
        );

        // 遅延後にリトライ
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        return retryImport(attemptNumber + 1);
      }

      console.error('[lazyLoad] Import failed after all retries', error);
      throw error;
    }
  };

  return lazy(() => retryImport());
}

/**
 * コンポーネントをプリロード
 *
 * @example
 * ```tsx
 * const QuestDetailScreen = lazyLoad(() => import('../screens/QuestDetailScreen'));
 *
 * // 画面遷移前にプリロード
 * preloadComponent(() => import('../screens/QuestDetailScreen'));
 * navigation.navigate('QuestDetail');
 * ```
 */
export async function preloadComponent(importFn: () => Promise<any>): Promise<void> {
  try {
    await importFn();
    console.log('[preloadComponent] Component preloaded successfully');
  } catch (error) {
    console.error('[preloadComponent] Failed to preload component', error);
  }
}

/**
 * 複数のコンポーネントを並行してプリロード
 *
 * @example
 * ```tsx
 * preloadComponents([
 *   () => import('../screens/QuestDetailScreen'),
 *   () => import('../screens/ProgressScreen'),
 *   () => import('../screens/RankingScreen'),
 * ]);
 * ```
 */
export async function preloadComponents(importFns: Array<() => Promise<any>>): Promise<void> {
  try {
    await Promise.all(importFns.map((fn) => preloadComponent(fn)));
    console.log('[preloadComponents] All components preloaded successfully');
  } catch (error) {
    console.error('[preloadComponents] Failed to preload some components', error);
  }
}

/**
 * 画面のプリロードを条件付きで実行
 *
 * @example
 * ```tsx
 * // WiFi接続時のみプリロード
 * conditionalPreload(
 *   () => import('../screens/QuestDetailScreen'),
 *   () => netInfo.type === 'wifi'
 * );
 * ```
 */
export async function conditionalPreload(
  importFn: () => Promise<any>,
  condition: () => boolean
): Promise<void> {
  if (condition()) {
    await preloadComponent(importFn);
  } else {
    console.log('[conditionalPreload] Condition not met, skipping preload');
  }
}
