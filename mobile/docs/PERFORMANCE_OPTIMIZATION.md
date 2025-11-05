# パフォーマンス最適化ガイド

このドキュメントでは、climb-youモバイルアプリのパフォーマンスを最適化するためのベストプラクティスと実装ガイドを提供します。

## 目標

- **起動時間**: 3秒以内
- **メモリ使用量**: 150MB以下
- **フレームレート**: 60 FPS維持
- **バンドルサイズ**: できるだけ小さく

## 1. 起動時間の最適化

### 1.1 並列初期化

データベースと通知サービスを並列に初期化することで、起動時間を短縮します。

**実装例:**
```typescript
// App.tsx
await Promise.all([
  PerformanceMonitor.measureAsync('database-initialization', async () => {
    await dbManager.initialize();
  }),
  PerformanceMonitor.measureAsync('notification-initialization', async () => {
    await notificationService.initialize();
  }),
]);
```

**効果**: 2つのサービスを順次初期化する場合と比較して、最大50%の時間短縮

### 1.2 遅延初期化（Lazy Initialization）

非クリティカルなサービスは、UIが表示された後にバックグラウンドで初期化します。

**実装例:**
```typescript
// 遅延初期化するサービスを登録
LazyLoadManager.register(
  'sync-manager',
  async () => {
    const syncManager = SyncManager.getInstance();
    await syncManager.initialize();
  },
  'low' // 優先度: high, medium, low
);

// UIが表示された後、バックグラウンドで初期化
LazyLoadManager.initializeInBackground();
```

**対象サービス**:
- SyncManager（同期サービス）
- AnalyticsService（分析サービス）
- CacheCleanupService（キャッシュクリーンアップ）

### 1.3 パフォーマンス計測

`PerformanceMonitor`を使用して、起動時間とメモリ使用量を計測します。

**実装例:**
```typescript
PerformanceMonitor.start('app-initialization');

// 初期化処理...

PerformanceMonitor.end('app-initialization');
PerformanceMonitor.recordMemoryUsage();

// レポート出力（開発環境のみ）
if (__DEV__) {
  PerformanceMonitor.report();
}
```

**出力例:**
```
=== Performance Report ===
App Startup Time: 1245ms

Metrics:
  - database-initialization: 320ms
  - notification-initialization: 280ms
  - parallel-initialization: 350ms
  - app-initialization: 1245ms

Current Memory Usage: 85MB
==========================
```

## 2. コード分割（Code Splitting）

### 2.1 React.lazy()による画面の遅延ロード

画面コンポーネントを遅延ロードすることで、初期バンドルサイズを削減します。

**実装例:**
```typescript
import { lazyLoad } from '@/utils/lazyLoad';

// 画面を遅延ロード（リトライ機能付き）
const QuestDetailScreen = lazyLoad(
  () => import('../screens/QuestDetailScreen'),
  { retries: 3, retryDelay: 1000 }
);

const ProgressScreen = lazyLoad(
  () => import('../screens/ProgressScreen')
);

const RankingScreen = lazyLoad(
  () => import('../screens/RankingScreen')
);
```

### 2.2 LazyScreenコンポーネント

`LazyScreen`コンポーネントを使用して、遅延ロードされた画面をラップします。

**実装例:**
```tsx
import { LazyScreen } from '@/components/common/LazyScreen';

<Stack.Screen name="QuestDetail">
  {(props) => (
    <LazyScreen
      component={QuestDetailScreen}
      {...props.route.params}
    />
  )}
</Stack.Screen>
```

### 2.3 プリロード

画面遷移前にコンポーネントをプリロードすることで、体感速度を向上させます。

**実装例:**
```typescript
import { preloadComponent, preloadComponents } from '@/utils/lazyLoad';

// 単一コンポーネントのプリロード
const handleQuestPress = (questId: string) => {
  // 画面遷移前にプリロード
  preloadComponent(() => import('../screens/QuestDetailScreen'));
  navigation.navigate('QuestDetail', { questId });
};

// 複数コンポーネントの並行プリロード
preloadComponents([
  () => import('../screens/ProgressScreen'),
  () => import('../screens/RankingScreen'),
  () => import('../screens/MilestoneScreen'),
]);
```

### 2.4 条件付きプリロード

WiFi接続時のみプリロードするなど、条件に応じてプリロードを制御します。

**実装例:**
```typescript
import NetInfo from '@react-native-community/netinfo';
import { conditionalPreload } from '@/utils/lazyLoad';

// WiFi接続時のみプリロード
NetInfo.fetch().then((state) => {
  conditionalPreload(
    () => import('../screens/HeavyScreen'),
    () => state.type === 'wifi'
  );
});
```

## 3. メモリ最適化

### 3.1 React.memoによるコンポーネントのメモ化

**基本的なメモ化:**
```typescript
import { memo } from 'react';

const QuestCard = memo<QuestCardProps>((props) => {
  return (
    <View>
      <Text>{props.title}</Text>
    </View>
  );
});
```

**深い比較によるメモ化:**
```typescript
import { memoDeep } from '@/utils/memoryOptimization';

const QuestCard = memoDeep<QuestCardProps>((props) => {
  return (
    <View>
      <Text>{props.quest.title}</Text>
    </View>
  );
});
```

**配列propsの比較:**
```typescript
import { memoArray } from '@/utils/memoryOptimization';

const QuestList = memoArray<QuestListProps>(
  (props) => (
    <FlatList
      data={props.quests}
      renderItem={({ item }) => <QuestCard quest={item} />}
    />
  ),
  ['quests'] // 比較する配列props
);
```

### 3.2 useCallbackによるコールバックのメモ化

**基本的なメモ化:**
```typescript
import { useCallback } from 'react';

const handlePress = useCallback(() => {
  console.log('Quest pressed');
}, []); // 依存配列が空なので、関数は一度だけ作成される
```

**依存配列あり:**
```typescript
const handleComplete = useCallback((questId: string) => {
  completeQuest(questId);
}, [completeQuest]); // completeQuestが変更されたときのみ再作成
```

**安全なラッパー:**
```typescript
import { useSafeCallback } from '@/utils/memoryOptimization';

const handlePress = useSafeCallback(() => {
  console.log(value); // valueが依存配列に含まれていない場合、開発環境で警告
}, [value]);
```

### 3.3 useMemoによる計算結果のメモ化

**基本的なメモ化:**
```typescript
import { useMemo } from 'react';

const filteredQuests = useMemo(() => {
  return quests.filter(q => q.status === 'active');
}, [quests]); // questsが変更されたときのみ再計算
```

**複雑な計算:**
```typescript
const statistics = useMemo(() => {
  return {
    total: quests.length,
    completed: quests.filter(q => q.status === 'completed').length,
    progress: quests.filter(q => q.status === 'in_progress').length,
  };
}, [quests]);
```

**安全なラッパー:**
```typescript
import { useSafeMemo } from '@/utils/memoryOptimization';

const sortedQuests = useSafeMemo(() => {
  return [...quests].sort((a, b) => a.priority - b.priority);
}, [quests]);
```

### 3.4 メモリリーク検出

**useMemoryLeakDetection:**
```typescript
import { useMemoryLeakDetection } from '@/utils/memoryOptimization';

function QuestDetailScreen() {
  const leak = useMemoryLeakDetection('QuestDetailScreen');

  useEffect(() => {
    const timerId = setTimeout(() => {
      console.log('Delayed action');
    }, 5000);

    leak.trackTimer(timerId);

    return () => {
      clearTimeout(timerId);
      leak.untrackTimer(timerId);
    };
  }, []);

  return <View>...</View>;
}
```

**useWhyDidYouUpdate:**
```typescript
import { useWhyDidYouUpdate } from '@/utils/memoryOptimization';

function QuestCard(props: QuestCardProps) {
  useWhyDidYouUpdate('QuestCard', props);
  // 再レンダリングの原因がコンソールに出力される
  return <View>...</View>;
}
```

**useRenderCount:**
```typescript
import { useRenderCount } from '@/utils/memoryOptimization';

function QuestCard() {
  const renderCount = useRenderCount('QuestCard');
  console.log(`Rendered ${renderCount} times`);
  return <View>...</View>;
}
```

## 4. 不要なモジュールのインポート削減

### 4.1 名前付きインポートを使用

**悪い例:**
```typescript
import * as _ from 'lodash'; // 全体をインポート（大きなバンドルサイズ）
```

**良い例:**
```typescript
import debounce from 'lodash/debounce'; // 必要な関数のみインポート
import throttle from 'lodash/throttle';
```

### 4.2 tree-shakingを有効化

**babel.config.js:**
```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // 未使用のコードを削除
      ['transform-remove-console', { exclude: ['error', 'warn'] }],
    ],
  };
};
```

## 5. バンドルサイズの分析

### 5.1 metro-bundlerの分析

**コマンド:**
```bash
npx react-native bundle \
  --platform android \
  --dev false \
  --entry-file index.js \
  --bundle-output android/app/build/index.android.bundle \
  --assets-dest android/app/build \
  --sourcemap-output android/app/build/index.android.bundle.map
```

### 5.2 source-map-explorerで分析

**インストール:**
```bash
npm install --save-dev source-map-explorer
```

**使用:**
```bash
source-map-explorer android/app/build/index.android.bundle android/app/build/index.android.bundle.map
```

## 6. ベストプラクティス

### 6.1 FlatListの最適化

```typescript
<FlatList
  data={quests}
  renderItem={({ item }) => <QuestCard quest={item} />}
  keyExtractor={(item) => item.id}
  // パフォーマンス最適化
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  updateCellsBatchingPeriod={50}
  initialNumToRender={10}
  windowSize={10}
  // メモ化
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
/>
```

### 6.2 画像の最適化

```typescript
import { Image } from 'react-native';

// 適切なサイズの画像を使用
<Image
  source={{ uri: imageUrl }}
  style={{ width: 100, height: 100 }}
  resizeMode="cover"
  // キャッシュを有効化（iOS）
  cache="only-if-cached"
/>
```

### 6.3 アニメーションの最適化

```typescript
import { useNativeDriver } from 'react-native';

Animated.timing(animatedValue, {
  toValue: 1,
  duration: 300,
  useNativeDriver: true, // ネイティブドライバーを使用
}).start();
```

## 7. チェックリスト

起動時間とメモリ最適化のチェックリスト:

- [ ] 並列初期化を実装
- [ ] 非クリティカルなサービスを遅延初期化
- [ ] React.lazy()でコード分割
- [ ] 画面のプリロード実装
- [ ] React.memoでコンポーネントをメモ化
- [ ] useCallback/useMemoで不要な再レンダリング防止
- [ ] メモリリーク検出フックを使用
- [ ] 不要なモジュールのインポート削減
- [ ] バンドルサイズを分析
- [ ] FlatListを最適化
- [ ] 画像を最適化
- [ ] アニメーションでuseNativeDriverを使用
- [ ] PerformanceMonitorで計測
- [ ] 起動時間3秒以内を確認
- [ ] メモリ使用量150MB以下を確認

## 8. トラブルシューティング

### 8.1 起動時間が遅い

**原因:**
- 同期的な初期化処理が多い
- 大きなバンドルサイズ
- 重いコンポーネントの初期ロード

**解決策:**
- 並列初期化を実装
- 遅延初期化を実装
- React.lazy()でコード分割
- バンドルサイズを削減

### 8.2 メモリ使用量が多い

**原因:**
- メモリリーク
- 不要な再レンダリング
- 大きな画像のキャッシュ

**解決策:**
- useMemoryLeakDetectionでリークを検出
- React.memo/useCallback/useMemoでメモ化
- 画像のサイズを最適化
- キャッシュサイズを制限

### 8.3 フレームレートが低い

**原因:**
- JavaScriptスレッドのブロック
- 重いレンダリング処理
- アニメーションの最適化不足

**解決策:**
- useNativeDriverを使用
- 重い計算をバックグラウンドスレッドに移動
- FlatListを最適化
- 不要な再レンダリングを削減

## 9. 参考リソース

- [React Native Performance](https://reactnative.dev/docs/performance)
- [React.memo](https://react.dev/reference/react/memo)
- [React.lazy](https://react.dev/reference/react/lazy)
- [useCallback](https://react.dev/reference/react/useCallback)
- [useMemo](https://react.dev/reference/react/useMemo)
- [Metro Bundler](https://metrobundler.dev/)
