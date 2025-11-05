/**
 * InfiniteScrollList Component
 * 無限スクロール対応のFlatListラッパー
 *
 * 機能:
 * - usePaginationフックと連携
 * - 自動的に次のページを読み込み
 * - Pull-to-Refresh対応
 * - ローディングフッター表示
 * - 空状態表示
 * - エラーハンドリング
 */

import React from 'react';
import {
  FlatList,
  FlatListProps,
  RefreshControl,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { usePagination, FetchFunction, PaginationOptions } from '../hooks/usePagination';
import { LoadingFooter } from './LoadingFooter';
import { EmptyState, EmptyStateProps } from './EmptyState';

export interface InfiniteScrollListProps<T>
  extends Omit<
    FlatListProps<T>,
    'data' | 'onEndReached' | 'onRefresh' | 'refreshing' | 'ListFooterComponent' | 'ListEmptyComponent'
  > {
  /**
   * データフェッチ関数
   */
  fetchFunction: FetchFunction<T>;

  /**
   * ページネーションオプション
   */
  paginationOptions?: PaginationOptions;

  /**
   * 空状態のプロパティ
   */
  emptyStateProps?: EmptyStateProps;

  /**
   * カスタムローディングフッター
   */
  customLoadingFooter?: React.ReactNode;

  /**
   * カスタム空状態コンポーネント
   */
  customEmptyComponent?: React.ReactNode;

  /**
   * カスタムエラーコンポーネント
   */
  customErrorComponent?: (error: Error, retry: () => void) => React.ReactNode;

  /**
   * スクロール終端の閾値（0-1、デフォルト: 0.5）
   */
  onEndReachedThreshold?: number;
}

/**
 * InfiniteScrollList Component
 */
export function InfiniteScrollList<T>({
  fetchFunction,
  paginationOptions,
  emptyStateProps,
  customLoadingFooter,
  customEmptyComponent,
  customErrorComponent,
  onEndReachedThreshold = 0.5,
  ...flatListProps
}: InfiniteScrollListProps<T>) {
  const {
    data,
    isLoading,
    isLoadingMore,
    isRefreshing,
    error,
    hasMore,
    loadMore,
    refresh,
  } = usePagination<T>(fetchFunction, paginationOptions);

  /**
   * ローディングフッターをレンダリング
   */
  const renderFooter = () => {
    if (customLoadingFooter) {
      return isLoadingMore ? customLoadingFooter : null;
    }

    return <LoadingFooter isLoading={isLoadingMore} />;
  };

  /**
   * 空状態をレンダリング
   */
  const renderEmpty = () => {
    // ローディング中は何も表示しない
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3C507D" />
          <Text style={styles.loadingText}>読み込み中...</Text>
        </View>
      );
    }

    // エラーがある場合
    if (error) {
      if (customErrorComponent) {
        return <>{customErrorComponent(error, refresh)}</>;
      }

      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>エラーが発生しました</Text>
          <Text style={styles.errorMessage}>{error.message}</Text>
          <View style={styles.retryButton}>
            <Text style={styles.retryButtonText} onPress={refresh}>
              再試行
            </Text>
          </View>
        </View>
      );
    }

    // カスタム空状態コンポーネント
    if (customEmptyComponent) {
      return <>{customEmptyComponent}</>;
    }

    // デフォルトの空状態
    return (
      <EmptyState
        icon={emptyStateProps?.icon || '📭'}
        title={emptyStateProps?.title || 'データがありません'}
        description={emptyStateProps?.description}
        actionLabel={emptyStateProps?.actionLabel}
        onAction={emptyStateProps?.onAction}
      />
    );
  };

  /**
   * スクロール終端に到達したとき
   */
  const handleEndReached = () => {
    if (hasMore && !isLoadingMore && !isLoading) {
      loadMore();
    }
  };

  return (
    <FlatList
      {...flatListProps}
      data={data}
      onEndReached={handleEndReached}
      onEndReachedThreshold={onEndReachedThreshold}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={refresh}
          colors={['#3C507D']}
          tintColor="#3C507D"
        />
      }
      ListFooterComponent={renderFooter}
      ListEmptyComponent={renderEmpty}
    />
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorMessage: {
    color: '#999',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    textAlign: 'center',
  },
  errorTitle: {
    color: '#333',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 64,
  },
  loadingText: {
    color: '#666',
    fontSize: 14,
    marginTop: 12,
  },
  retryButton: {
    backgroundColor: '#3C507D',
    borderRadius: 8,
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
