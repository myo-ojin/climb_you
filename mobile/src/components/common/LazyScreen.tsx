/**
 * LazyScreen Component
 * React.lazy()でコンポーネントを遅延ロードするためのラッパー
 *
 * 機能:
 * - 画面コンポーネントの遅延ロード
 * - ローディング中のフォールバックUI
 * - エラーハンドリング
 * - パフォーマンス最適化
 */

import React, { Suspense, ComponentType, ReactNode } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';

interface LazyScreenProps {
  /**
   * 遅延ロードするコンポーネント
   */
  component: React.LazyExoticComponent<ComponentType<any>>;

  /**
   * ローディング中に表示するカスタムフォールバック
   */
  fallback?: ReactNode;

  /**
   * コンポーネントに渡すprops
   */
  [key: string]: any;
}

/**
 * デフォルトのローディングコンポーネント
 */
const DefaultFallback: React.FC = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#3C507D" />
    <Text style={styles.loadingText}>読み込み中...</Text>
  </View>
);

/**
 * LazyScreen Component
 *
 * @example
 * ```tsx
 * const LazyQuestDetailScreen = lazy(() => import('./QuestDetailScreen'));
 *
 * <LazyScreen
 *   component={LazyQuestDetailScreen}
 *   questId="123"
 * />
 * ```
 */
export const LazyScreen: React.FC<LazyScreenProps> = ({
  component: Component,
  fallback,
  ...props
}) => {
  const FallbackComponent = fallback || <DefaultFallback />;

  return (
    <Suspense fallback={FallbackComponent}>
      <Component {...props} />
    </Suspense>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});
