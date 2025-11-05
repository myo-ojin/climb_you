# Pagination（ページネーション・無限スクロール）

FlatListでの遅延読み込みとページネーション機能

## 機能

- ✅ 自動ページネーション処理
- ✅ 無限スクロール対応
- ✅ Pull-to-Refresh対応
- ✅ ローディング状態管理
- ✅ エラーハンドリング
- ✅ 空状態表示
- ✅ 重複リクエスト防止
- ✅ TypeScript完全対応

## 基本的な使い方

### InfiniteScrollListコンポーネント（推奨）

最も簡単な方法は、`InfiniteScrollList`コンポーネントを使用することです。

```tsx
import { InfiniteScrollList } from '@/shared/components/InfiniteScrollList';
import { PaginatedResponse } from '@/shared/hooks/usePagination';

interface QuestLog {
  id: string;
  questTitle: string;
  completedAt: string;
}

function QuestHistoryScreen() {
  // APIからデータをフェッチする関数
  const fetchQuestLogs = async (
    page: number,
    pageSize: number
  ): Promise<PaginatedResponse<QuestLog>> => {
    const response = await api.getQuestLogs(page, pageSize);
    return {
      data: response.data,
      currentPage: page,
      pageSize,
      totalItems: response.total,
      totalPages: Math.ceil(response.total / pageSize),
      hasMore: page < Math.ceil(response.total / pageSize),
    };
  };

  return (
    <InfiniteScrollList
      fetchFunction={fetchQuestLogs}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={styles.item}>
          <Text>{item.questTitle}</Text>
          <Text>{item.completedAt}</Text>
        </View>
      )}
      emptyStateProps={{
        title: 'クエスト履歴がありません',
        description: 'クエストを完了すると、ここに表示されます',
      }}
    />
  );
}
```

### usePaginationフックを直接使用

より細かい制御が必要な場合は、フックを直接使用できます。

```tsx
import { usePagination } from '@/shared/hooks/usePagination';
import { FlatList } from 'react-native';

function CustomListScreen() {
  const {
    data,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    refresh,
  } = usePagination(fetchFunction, {
    initialPage: 1,
    pageSize: 20,
  });

  return (
    <FlatList
      data={data}
      renderItem={({ item }) => <ListItem item={item} />}
      onEndReached={loadMore}
      onEndReachedThreshold={0.5}
      onRefresh={refresh}
      refreshing={isRefreshing}
      ListFooterComponent={
        isLoadingMore ? <ActivityIndicator /> : null
      }
    />
  );
}
```

## API

### usePagination Hook

#### パラメータ

```typescript
usePagination<T>(
  fetchFunction: FetchFunction<T>,
  options?: PaginationOptions
): PaginationState<T>
```

**FetchFunction:**
```typescript
type FetchFunction<T> = (
  page: number,
  pageSize: number
) => Promise<PaginatedResponse<T>>;
```

**PaginationOptions:**
```typescript
interface PaginationOptions {
  initialPage?: number;       // 初期ページ番号（デフォルト: 1）
  pageSize?: number;           // 1ページあたりのアイテム数（デフォルト: 20）
  autoFetch?: boolean;         // 自動フェッチを有効にするか（デフォルト: true）
  deps?: readonly any[];       // 依存配列（変更時にリセット＆再フェッチ）
}
```

**PaginatedResponse:**
```typescript
interface PaginatedResponse<T> {
  data: T[];                   // データ配列
  currentPage: number;         // 現在のページ番号
  pageSize: number;            // 1ページあたりのアイテム数
  totalItems: number;          // 総アイテム数
  totalPages: number;          // 総ページ数
  hasMore: boolean;            // 次のページがあるか
}
```

#### 戻り値

```typescript
interface PaginationState<T> {
  data: T[];                   // 全データ（累積）
  isLoading: boolean;          // ローディング中か（初回のみ）
  isLoadingMore: boolean;      // さらに読み込み中か
  isRefreshing: boolean;       // リフレッシュ中か
  error: Error | null;         // エラー
  hasMore: boolean;            // 次のページがあるか
  currentPage: number;         // 現在のページ番号
  loadMore: () => void;        // さらに読み込む
  refresh: () => void;         // リフレッシュ（最初から再読み込み）
  reset: () => void;           // リセット
}
```

### InfiniteScrollList Component

#### Props

```typescript
interface InfiniteScrollListProps<T> extends Omit<FlatListProps<T>, ...> {
  fetchFunction: FetchFunction<T>;              // データフェッチ関数
  paginationOptions?: PaginationOptions;        // ページネーションオプション
  emptyStateProps?: EmptyStateProps;            // 空状態のプロパティ
  customLoadingFooter?: React.ReactNode;        // カスタムローディングフッター
  customEmptyComponent?: React.ReactNode;       // カスタム空状態コンポーネント
  customErrorComponent?: (error: Error, retry: () => void) => React.ReactNode; // カスタムエラーコンポーネント
  onEndReachedThreshold?: number;               // スクロール終端の閾値（0-1、デフォルト: 0.5）
}
```

### LoadingFooter Component

```typescript
interface LoadingFooterProps {
  isLoading: boolean;          // ローディング中か
  message?: string;            // 表示メッセージ（オプション）
  size?: 'small' | 'large';    // インジケーターのサイズ
  color?: string;              // インジケーターの色
}
```

### EmptyState Component

```typescript
interface EmptyStateProps {
  icon?: string;               // アイコン（絵文字またはテキスト）
  title: string;               // タイトル
  description?: string;        // 説明文（オプション）
  actionLabel?: string;        // アクションボタンのラベル（オプション）
  onAction?: () => void;       // アクションボタンのハンドラー（オプション）
}
```

## 使用例

### 基本的な無限スクロールリスト

```tsx
import { InfiniteScrollList } from '@/shared/components/InfiniteScrollList';

function UserListScreen() {
  const fetchUsers = async (page: number, pageSize: number) => {
    const response = await api.getUsers(page, pageSize);
    return {
      data: response.users,
      currentPage: page,
      pageSize,
      totalItems: response.total,
      totalPages: Math.ceil(response.total / pageSize),
      hasMore: page < Math.ceil(response.total / pageSize),
    };
  };

  return (
    <InfiniteScrollList
      fetchFunction={fetchUsers}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <UserCard user={item} />}
    />
  );
}
```

### カスタム空状態とエラー表示

```tsx
<InfiniteScrollList
  fetchFunction={fetchQuests}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => <QuestCard quest={item} />}
  emptyStateProps={{
    icon: '🎯',
    title: 'クエストがありません',
    description: '新しいクエストは毎日4:00 AMに生成されます',
    actionLabel: '手動で生成',
    onAction: () => generateQuests(),
  }}
  customErrorComponent={(error, retry) => (
    <View>
      <Text>エラー: {error.message}</Text>
      <Button title="再試行" onPress={retry} />
    </View>
  )}
/>
```

### ページサイズとカスタムローディング

```tsx
<InfiniteScrollList
  fetchFunction={fetchItems}
  paginationOptions={{
    pageSize: 10,
    initialPage: 1,
  }}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => <ItemCard item={item} />}
  customLoadingFooter={
    <View style={{ padding: 20 }}>
      <Text>さらに読み込み中...</Text>
    </View>
  }
/>
```

### 依存配列でフィルター対応

```tsx
function FilteredListScreen() {
  const [filter, setFilter] = useState('all');

  const fetchFilteredData = async (page: number, pageSize: number) => {
    const response = await api.getData(page, pageSize, filter);
    return { ... };
  };

  return (
    <>
      <FilterButtons onFilterChange={setFilter} />
      <InfiniteScrollList
        fetchFunction={fetchFilteredData}
        paginationOptions={{
          deps: [filter], // フィルター変更時に自動リセット＆再フェッチ
        }}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <DataCard data={item} />}
      />
    </>
  );
}
```

### usePaginationフックを使ったカスタム実装

```tsx
import { usePagination } from '@/shared/hooks/usePagination';
import { FlatList, RefreshControl } from 'react-native';
import { LoadingFooter } from '@/shared/components/LoadingFooter';

function CustomPaginationScreen() {
  const {
    data,
    isLoading,
    isLoadingMore,
    isRefreshing,
    hasMore,
    loadMore,
    refresh,
  } = usePagination(fetchFunction, {
    pageSize: 15,
  });

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <CustomCard item={item} />}
      onEndReached={() => {
        if (hasMore && !isLoadingMore) {
          loadMore();
        }
      }}
      onEndReachedThreshold={0.5}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={refresh}
        />
      }
      ListFooterComponent={<LoadingFooter isLoading={isLoadingMore} />}
    />
  );
}
```

### 手動フェッチ（autoFetch=false）

```tsx
function ManualFetchScreen() {
  const {
    data,
    loadMore,
    isLoading,
  } = usePagination(fetchFunction, {
    autoFetch: false, // 自動フェッチしない
  });

  const handleButtonPress = () => {
    loadMore(); // 手動で読み込み
  };

  return (
    <View>
      {data.map(item => <ItemCard key={item.id} item={item} />)}
      <Button title="さらに読み込む" onPress={handleButtonPress} />
    </View>
  );
}
```

## パフォーマンス最適化

### FlatList最適化プロパティ

```tsx
<InfiniteScrollList
  fetchFunction={fetchFunction}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => <MemoizedCard item={item} />}
  // パフォーマンス最適化
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  updateCellsBatchingPeriod={50}
  initialNumToRender={10}
  windowSize={5}
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
/>
```

### メモ化されたコンポーネント

```tsx
const MemoizedCard = React.memo(({ item }) => {
  return <Card item={item} />;
}, (prevProps, nextProps) => {
  return prevProps.item.id === nextProps.item.id;
});
```

### 重複リクエスト防止

usePaginationフックは自動的に重複リクエストを防止します：
- ローディング中に`loadMore()`を呼んでも、新しいリクエストは送信されません
- `hasMore=false`の場合、`loadMore()`は何もしません

## トラブルシューティング

### ページが自動的に読み込まれない

**原因**: `onEndReachedThreshold`が適切でない

**解決策**: 閾値を調整する

```tsx
<InfiniteScrollList
  onEndReachedThreshold={0.8} // より早めに読み込む
  // ...
/>
```

### Pull-to-Refreshが動作しない

**原因**: `refreshControl`が上書きされている

**解決策**: `InfiniteScrollList`はデフォルトでRefreshControlを提供します。カスタマイズが必要な場合は`usePagination`を直接使用してください。

### データが重複して表示される

**原因**: `keyExtractor`が適切でない

**解決策**: 一意のキーを返すようにする

```tsx
<InfiniteScrollList
  keyExtractor={(item, index) => `${item.id}-${index}`} // 一意性を保証
  // ...
/>
```

### メモリリーク

**原因**: コンポーネントがアンマウントされた後もフェッチが続いている

**解決策**: usePaginationは自動的にクリーンアップしますが、カスタムフェッチ関数内でAbortControllerを使用することを推奨します。

```tsx
const fetchFunction = async (page: number, pageSize: number) => {
  const controller = new AbortController();

  try {
    const response = await fetch(url, { signal: controller.signal });
    return response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      // リクエストがキャンセルされた
      return;
    }
    throw error;
  }
};
```

## テスト

```bash
npm test -- usePagination.test.ts
```

**テストカバレッジ:**
- ✅ 初期化（autoFetch、初期ページ、ページサイズ）
- ✅ データフェッチ（成功、失敗）
- ✅ loadMore（次のページ読み込み、hasMore判定、重複防止）
- ✅ refresh（リフレッシュ、データリセット）
- ✅ reset（状態リセット）
- ✅ 依存配列変更時の再フェッチ

## ライセンス

MIT
