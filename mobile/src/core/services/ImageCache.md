# ImageCacheService

画像キャッシュ管理サービス - expo-file-systemを使用した高速画像キャッシング

## 機能

- ✅ 自動画像ダウンロードとローカル保存
- ✅ LRU（Least Recently Used）アルゴリズムによるキャッシュサイズ管理
- ✅ キャッシュクリア機能（全削除、古いファイル削除）
- ✅ AsyncStorageによる永続的メタデータ管理
- ✅ シングルトンパターン
- ✅ TypeScript完全対応

## 基本的な使い方

### CachedImageコンポーネント（推奨）

最も簡単な方法は、`CachedImage`コンポーネントを使用することです。

```tsx
import { CachedImage } from '@/shared/components/CachedImage';

function MyComponent() {
  return (
    <CachedImage
      uri="https://example.com/image.jpg"
      style={{ width: 200, height: 200 }}
      fallbackSource={require('./assets/placeholder.png')}
    />
  );
}
```

### ImageCacheServiceを直接使用

より細かい制御が必要な場合は、サービスを直接使用できます。

```tsx
import { imageCacheService } from '@/core/services/ImageCacheService';
import { Image } from 'react-native';

function MyComponent() {
  const [localUri, setLocalUri] = useState<string | null>(null);

  useEffect(() => {
    const loadImage = async () => {
      const uri = await imageCacheService.getImage('https://example.com/image.jpg');
      setLocalUri(uri);
    };
    loadImage();
  }, []);

  return localUri ? <Image source={{ uri: localUri }} style={{ width: 200, height: 200 }} /> : null;
}
```

## API

### ImageCacheService

#### `getInstance(): ImageCacheService`

シングルトンインスタンスを取得します。

```typescript
import { ImageCacheService } from '@/core/services/ImageCacheService';

const service = ImageCacheService.getInstance();
```

#### `initialize(): Promise<void>`

サービスを初期化します（初回のみ必要）。

```typescript
await service.initialize();
```

#### `getImage(url: string): Promise<string>`

画像をキャッシュから取得、またはダウンロードします。

```typescript
const localPath = await imageCacheService.getImage('https://example.com/image.jpg');
// => "file:///cache/images/3f01d733.jpg"
```

#### `clearCache(): Promise<void>`

全てのキャッシュを削除します。

```typescript
await imageCacheService.clearCache();
```

#### `clearOldCache(daysOld: number = 30): Promise<void>`

指定日数より古いキャッシュを削除します。

```typescript
// 30日より古いキャッシュを削除
await imageCacheService.clearOldCache(30);
```

#### `getCacheStats(): CacheStats`

キャッシュ統計情報を取得します。

```typescript
const stats = imageCacheService.getCacheStats();
console.log(`Total images: ${stats.totalImages}`);
console.log(`Total size: ${stats.totalSize} bytes`);
console.log(`Usage: ${(stats.usageRatio * 100).toFixed(2)}%`);
```

**戻り値:**
```typescript
interface CacheStats {
  totalImages: number;      // キャッシュされた画像の総数
  totalSize: number;        // キャッシュの総サイズ（バイト）
  maxSize: number;          // 最大キャッシュサイズ（バイト）
  usageRatio: number;       // 使用率（0-1）
}
```

### CachedImage

#### Props

```typescript
interface CachedImageProps extends Omit<ImageProps, 'source'> {
  uri: string;                              // 画像URL
  fallbackSource?: ImageProps['source'];    // フォールバック画像（エラー時）
  loadingComponent?: React.ReactNode;       // ローディング中に表示するコンポーネント
  errorComponent?: React.ReactNode;         // エラー時に表示するコンポーネント
  style?: StyleProp<ImageStyle>;            // スタイル
  onLoadEnd?: () => void;                   // ローディング完了時のコールバック
  onError?: (error: Error) => void;         // エラー発生時のコールバック
}
```

#### 使用例

**基本的な使い方:**
```tsx
<CachedImage
  uri="https://example.com/image.jpg"
  style={{ width: 200, height: 200 }}
/>
```

**フォールバック画像を指定:**
```tsx
<CachedImage
  uri="https://example.com/image.jpg"
  fallbackSource={require('./assets/placeholder.png')}
  style={{ width: 200, height: 200 }}
/>
```

**カスタムローディング:**
```tsx
<CachedImage
  uri="https://example.com/image.jpg"
  loadingComponent={<MyCustomSpinner />}
  style={{ width: 200, height: 200 }}
/>
```

**カスタムエラー表示:**
```tsx
<CachedImage
  uri="https://example.com/image.jpg"
  errorComponent={<Text>画像を読み込めません</Text>}
  style={{ width: 200, height: 200 }}
/>
```

**コールバックを使用:**
```tsx
<CachedImage
  uri="https://example.com/image.jpg"
  onLoadEnd={() => console.log('画像読み込み完了')}
  onError={(error) => console.error('エラー:', error)}
  style={{ width: 200, height: 200 }}
/>
```

## 設定

### キャッシュサイズ制限

デフォルトでは、最大キャッシュサイズは **100MB** です。

キャッシュサイズが上限に達すると、LRUアルゴリズムにより最もアクセスされていない画像から自動的に削除されます。

### キャッシュディレクトリ

画像は以下のディレクトリにキャッシュされます：

```
{FileSystem.cacheDirectory}/images/
```

iOS: `/Library/Caches/images/`
Android: `/cache/images/`

### メタデータ保存

キャッシュメタデータはAsyncStorageに保存され、アプリ再起動後も維持されます。

**AsyncStorageキー:**
```
@climb-you:image-cache-metadata
```

## 高度な使い方

### 設定画面でキャッシュ管理

```tsx
import { imageCacheService } from '@/core/services/ImageCacheService';
import { Button, Text } from 'react-native';

function SettingsScreen() {
  const [stats, setStats] = useState(imageCacheService.getCacheStats());

  const handleClearCache = async () => {
    await imageCacheService.clearCache();
    setStats(imageCacheService.getCacheStats());
  };

  const handleClearOldCache = async () => {
    await imageCacheService.clearOldCache(30);
    setStats(imageCacheService.getCacheStats());
  };

  return (
    <View>
      <Text>キャッシュ画像数: {stats.totalImages}</Text>
      <Text>キャッシュサイズ: {(stats.totalSize / 1024 / 1024).toFixed(2)} MB</Text>
      <Text>使用率: {(stats.usageRatio * 100).toFixed(2)}%</Text>

      <Button title="全てのキャッシュを削除" onPress={handleClearCache} />
      <Button title="古いキャッシュを削除（30日以上）" onPress={handleClearOldCache} />
    </View>
  );
}
```

### App起動時の初期化

```tsx
// App.tsx
import { imageCacheService } from '@/core/services/ImageCacheService';

function App() {
  useEffect(() => {
    const initCache = async () => {
      await imageCacheService.initialize();

      // オプション: 30日より古いキャッシュを自動削除
      await imageCacheService.clearOldCache(30);
    };

    initCache();
  }, []);

  return <NavigationContainer>{/* ... */}</NavigationContainer>;
}
```

## パフォーマンス

### キャッシュヒット率

キャッシュヒット時は、ネットワークリクエストが発生せず、即座にローカルファイルを表示します。

**測定例:**
- 初回ダウンロード: 2-5秒（ネットワーク速度に依存）
- キャッシュヒット: <100ms（即座）

### メモリ使用量

- メタデータはメモリにキャッシュされますが、サイズは非常に小さい（1000画像で約100KB）
- 画像本体はファイルシステムに保存され、必要時のみメモリに読み込まれる

### LRU削除ポリシー

キャッシュが最大サイズ（100MB）を超えると：
1. 最終アクセス時刻でソート
2. 最大サイズの90%（90MB）まで古いファイルから削除
3. メタデータも同期して削除

## テスト

```bash
npm test -- ImageCacheService.test.ts
```

**テストカバレッジ:**
- ✅ 初期化
- ✅ キャッシュヒット/ミス
- ✅ ダウンロード失敗時のエラーハンドリング
- ✅ キャッシュクリア
- ✅ 古いキャッシュ削除
- ✅ キャッシュ統計

## 制限事項

- **最大キャッシュサイズ**: 100MB（ハードコード）
- **ハッシュアルゴリズム**: 簡易的な文字列ハッシュ（本番ではMD5等を推奨）
- **同時ダウンロード**: 制限なし（必要に応じてキューイング実装を検討）

## トラブルシューティング

### キャッシュが保存されない

1. ディレクトリの書き込み権限を確認
2. AsyncStorageの容量制限を確認
3. `initialize()`が呼ばれているか確認

### 画像が表示されない

1. URLが正しいか確認
2. ネットワーク接続を確認
3. `onError`コールバックでエラー内容を確認
4. キャッシュをクリアして再試行

### メモリリーク

- `CachedImage`がunmount時に正しくクリーンアップされていることを確認
- 大量の画像を表示する場合は、`FlatList`の`removeClippedSubviews`を有効化

## ライセンス

MIT
