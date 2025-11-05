/**
 * LazyList Component
 * 遅延読み込みと最適化を備えたFlatListラッパー
 *
 * 機能:
 * - 画面外のアイテムは読み込まない
 * - スクロール位置に応じた動的ロード
 * - メモリ効率の良いレンダリング
 * - プルツーリフレッシュ
 * - 無限スクロール（ページネーション）
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  FlatListProps,
  RefreshControl,
  ActivityIndicator,
  View,
  Text,
  StyleSheet,
} from 'react-native';

export interface LazyListProps<ItemT> extends Omit<FlatListProps<ItemT>, 'renderItem'> {
  /**
   * データ配列
   */
  data: ItemT[];

  /**
   * アイテムレンダリング関数
   */
  renderItem: (item: ItemT, index: number) => React.ReactElement | null;

  /**
   * アイテムの高さ（固定の場合）
   */
  itemHeight?: number;

  /**
   * プルツーリフレッシュのコールバック
   */
  onRefresh?: () => Promise<void>;

  /**
   * 次のページを読み込むコールバック（無限スクロール）
   */
  onLoadMore?: () => Promise<void>;

  /**
   * 読み込み中かどうか
   */
  loading?: boolean;

  /**
   * 次のページがあるかどうか
   */
  hasMore?: boolean;

  /**
   * 空データ時のコンポーネント
   */
  emptyComponent?: React.ReactElement;

  /**
   * フッターコンポーネント
   */
  footerComponent?: React.ReactElement;

  /**
   * エラー時のコンポーネント
   */
  errorComponent?: React.ReactElement;

  /**
   * エラー状態
   */
  error?: Error | null;
}

/**
 * LazyList Component
 *
 * @example
 * ```tsx
 * <LazyList
 *   data={quests}
 *   renderItem={(quest, index) => <QuestCard quest={quest} />}
 *   keyExtractor={(quest) => quest.id}
 *   itemHeight={120}
 *   onRefresh={handleRefresh}
 *   onLoadMore={loadNextPage}
 *   hasMore={hasNextPage}
 * />
 * ```
 */
export function LazyList<ItemT>({
  data,
  renderItem,
  itemHeight,
  onRefresh,
  onLoadMore,
  loading = false,
  hasMore = false,
  emptyComponent,
  footerComponent,
  errorComponent,
  error = null,
  keyExtractor,
  ...flatListProps
}: LazyListProps<ItemT>) {
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  /**
   * プルツーリフレッシュ
   */
  const handleRefresh = useCallback(async () => {
    if (!onRefresh || refreshing) return;

    setRefreshing(true);
    try {
      await onRefresh();
    } catch (error) {
      console.error('[LazyList] Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh, refreshing]);

  /**
   * 次のページを読み込み
   */
  const handleLoadMore = useCallback(async () => {
    if (!onLoadMore || loadingMore || !hasMore || loading) return;

    setLoadingMore(true);
    try {
      await onLoadMore();
    } catch (error) {
      console.error('[LazyList] Load more failed:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [onLoadMore, loadingMore, hasMore, loading]);

  /**
   * アイテムレイアウト（固定高さの場合）
   */
  const getItemLayout = useMemo(() => {
    if (!itemHeight) return undefined;

    return (_data: any, index: number) => ({
      length: itemHeight,
      offset: itemHeight * index,
      index,
    });
  }, [itemHeight]);

  /**
   * リストフッター（読み込み中インジケーター）
   */
  const renderFooter = useCallback(() => {
    if (footerComponent) {
      return footerComponent;
    }

    if (loadingMore && hasMore) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color="#3C507D" />
          <Text style={styles.footerText}>読み込み中...</Text>
        </View>
      );
    }

    if (!hasMore && data.length > 0) {
      return (
        <View style={styles.footerEnd}>
          <Text style={styles.footerEndText}>これ以上のデータはありません</Text>
        </View>
      );
    }

    return null;
  }, [footerComponent, loadingMore, hasMore, data.length]);

  /**
   * 空データ時の表示
   */
  const renderEmpty = useCallback(() => {
    if (loading) {
      return (
        <View style={styles.emptyLoader}>
          <ActivityIndicator size="large" color="#3C507D" />
          <Text style={styles.emptyText}>読み込み中...</Text>
        </View>
      );
    }

    if (error && errorComponent) {
      return errorComponent;
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>エラーが発生しました</Text>
          <Text style={styles.errorMessage}>{error.message}</Text>
        </View>
      );
    }

    if (emptyComponent) {
      return emptyComponent;
    }

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>データがありません</Text>
      </View>
    );
  }, [loading, error, errorComponent, emptyComponent]);

  /**
   * FlatListのrenderItem
   */
  const flatListRenderItem = useCallback(
    ({ item, index }: { item: ItemT; index: number }) => {
      return renderItem(item, index);
    },
    [renderItem]
  );

  return (
    <FlatList
      data={data}
      renderItem={flatListRenderItem}
      keyExtractor={keyExtractor}
      getItemLayout={getItemLayout}
      // パフォーマンス最適化
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      updateCellsBatchingPeriod={50}
      initialNumToRender={10}
      windowSize={10}
      // プルツーリフレッシュ
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#3C507D']} />
        ) : undefined
      }
      // 無限スクロール
      onEndReached={onLoadMore ? handleLoadMore : undefined}
      onEndReachedThreshold={0.5}
      // フッター
      ListFooterComponent={renderFooter}
      // 空データ時
      ListEmptyComponent={renderEmpty}
      {...flatListProps}
    />
  );
}

const styles = StyleSheet.create({
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  footerText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  footerEnd: {
    padding: 16,
    alignItems: 'center',
  },
  footerEndText: {
    fontSize: 12,
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyLoader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D32F2F',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
