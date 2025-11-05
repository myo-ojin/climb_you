/**
 * ImageCache Service
 * 画像のダウンロード、キャッシュ、管理を行うサービス
 *
 * 機能:
 * - 画像のダウンロードとローカルキャッシュ
 * - キャッシュされた画像の取得
 * - キャッシュサイズの管理
 * - 古いキャッシュの自動削除
 * - プリロード機能
 */

import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CacheMetadata {
  uri: string;
  localUri: string;
  size: number;
  timestamp: number;
  expiresAt?: number;
}

interface ImageCacheConfig {
  /**
   * キャッシュディレクトリ名
   */
  cacheDirectory?: string;

  /**
   * 最大キャッシュサイズ（MB）
   */
  maxCacheSize?: number;

  /**
   * キャッシュの有効期限（ミリ秒）
   */
  maxAge?: number;

  /**
   * キャッシュクリーンアップの閾値（キャッシュサイズがこの値を超えたらクリーンアップ）
   */
  cleanupThreshold?: number;
}

const DEFAULT_CONFIG: Required<ImageCacheConfig> = {
  cacheDirectory: 'image-cache',
  maxCacheSize: 100, // 100MB
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7日間
  cleanupThreshold: 0.8, // 80%
};

class ImageCacheService {
  private config: Required<ImageCacheConfig>;
  private cacheDir: string;
  private metadataKey = '@image-cache-metadata';
  private metadata: Map<string, CacheMetadata> = new Map();
  private initialized: boolean = false;

  constructor(config: ImageCacheConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.cacheDir = `${FileSystem.cacheDirectory}${this.config.cacheDirectory}/`;
  }

  /**
   * 初期化
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // キャッシュディレクトリを作成
      const dirInfo = await FileSystem.getInfoAsync(this.cacheDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.cacheDir, { intermediates: true });
      }

      // メタデータを読み込み
      await this.loadMetadata();

      // 期限切れのキャッシュを削除
      await this.cleanupExpiredCache();

      this.initialized = true;
      console.log('[ImageCache] Initialized');
    } catch (error) {
      console.error('[ImageCache] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * 画像を取得（キャッシュがあれば返す、なければダウンロードしてキャッシュ）
   */
  async get(uri: string): Promise<string> {
    await this.ensureInitialized();

    // キャッシュを確認
    const cached = this.metadata.get(uri);
    if (cached) {
      const fileInfo = await FileSystem.getInfoAsync(cached.localUri);
      if (fileInfo.exists) {
        console.log('[ImageCache] Cache hit:', uri);
        return cached.localUri;
      } else {
        // ファイルが存在しない場合はメタデータから削除
        this.metadata.delete(uri);
        await this.saveMetadata();
      }
    }

    // キャッシュがない場合はダウンロード
    console.log('[ImageCache] Cache miss, downloading:', uri);
    return await this.download(uri);
  }

  /**
   * 画像をダウンロードしてキャッシュ
   */
  async download(uri: string): Promise<string> {
    await this.ensureInitialized();

    try {
      // ファイル名を生成（URIのハッシュ）
      const fileName = this.generateFileName(uri);
      const localUri = `${this.cacheDir}${fileName}`;

      // ダウンロード
      const downloadResult = await FileSystem.downloadAsync(uri, localUri);

      if (downloadResult.status !== 200) {
        throw new Error(`Download failed with status ${downloadResult.status}`);
      }

      // ファイルサイズを取得
      const fileInfo = await FileSystem.getInfoAsync(localUri);
      const size = fileInfo.exists && 'size' in fileInfo ? fileInfo.size : 0;

      // メタデータに追加
      const metadata: CacheMetadata = {
        uri,
        localUri,
        size,
        timestamp: Date.now(),
        expiresAt: Date.now() + this.config.maxAge,
      };

      this.metadata.set(uri, metadata);
      await this.saveMetadata();

      // キャッシュサイズをチェック
      await this.checkCacheSizeAndCleanup();

      console.log('[ImageCache] Downloaded and cached:', uri);
      return localUri;
    } catch (error) {
      console.error('[ImageCache] Failed to download:', uri, error);
      throw error;
    }
  }

  /**
   * 複数の画像をプリロード
   */
  async preload(uris: string[]): Promise<void> {
    await this.ensureInitialized();

    console.log(`[ImageCache] Preloading ${uris.length} images...`);

    await Promise.all(
      uris.map(async (uri) => {
        try {
          await this.get(uri);
        } catch (error) {
          console.warn('[ImageCache] Failed to preload:', uri, error);
        }
      })
    );

    console.log('[ImageCache] Preloading completed');
  }

  /**
   * キャッシュをクリア
   */
  async clear(): Promise<void> {
    await this.ensureInitialized();

    try {
      // ディレクトリを削除して再作成
      await FileSystem.deleteAsync(this.cacheDir, { idempotent: true });
      await FileSystem.makeDirectoryAsync(this.cacheDir, { intermediates: true });

      // メタデータをクリア
      this.metadata.clear();
      await this.saveMetadata();

      console.log('[ImageCache] Cache cleared');
    } catch (error) {
      console.error('[ImageCache] Failed to clear cache:', error);
      throw error;
    }
  }

  /**
   * 特定の画像をキャッシュから削除
   */
  async remove(uri: string): Promise<void> {
    await this.ensureInitialized();

    const cached = this.metadata.get(uri);
    if (cached) {
      try {
        await FileSystem.deleteAsync(cached.localUri, { idempotent: true });
        this.metadata.delete(uri);
        await this.saveMetadata();
        console.log('[ImageCache] Removed from cache:', uri);
      } catch (error) {
        console.error('[ImageCache] Failed to remove from cache:', uri, error);
      }
    }
  }

  /**
   * キャッシュサイズを取得（MB）
   */
  async getCacheSize(): Promise<number> {
    await this.ensureInitialized();

    let totalSize = 0;
    for (const metadata of this.metadata.values()) {
      totalSize += metadata.size;
    }

    return totalSize / (1024 * 1024); // バイトからMBに変換
  }

  /**
   * キャッシュ情報を取得
   */
  async getCacheInfo(): Promise<{
    totalSize: number;
    itemCount: number;
    maxCacheSize: number;
    usagePercentage: number;
  }> {
    const totalSize = await this.getCacheSize();
    const itemCount = this.metadata.size;
    const maxCacheSize = this.config.maxCacheSize;
    const usagePercentage = (totalSize / maxCacheSize) * 100;

    return {
      totalSize,
      itemCount,
      maxCacheSize,
      usagePercentage,
    };
  }

  /**
   * メタデータを読み込み
   */
  private async loadMetadata(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(this.metadataKey);
      if (data) {
        const metadataArray: CacheMetadata[] = JSON.parse(data);
        this.metadata = new Map(metadataArray.map((m) => [m.uri, m]));
        console.log(`[ImageCache] Loaded ${this.metadata.size} metadata entries`);
      }
    } catch (error) {
      console.error('[ImageCache] Failed to load metadata:', error);
      this.metadata = new Map();
    }
  }

  /**
   * メタデータを保存
   */
  private async saveMetadata(): Promise<void> {
    try {
      const metadataArray = Array.from(this.metadata.values());
      await AsyncStorage.setItem(this.metadataKey, JSON.stringify(metadataArray));
    } catch (error) {
      console.error('[ImageCache] Failed to save metadata:', error);
    }
  }

  /**
   * 期限切れのキャッシュを削除
   */
  private async cleanupExpiredCache(): Promise<void> {
    const now = Date.now();
    const expiredUris: string[] = [];

    for (const [uri, metadata] of this.metadata.entries()) {
      if (metadata.expiresAt && metadata.expiresAt < now) {
        expiredUris.push(uri);
      }
    }

    if (expiredUris.length > 0) {
      console.log(`[ImageCache] Cleaning up ${expiredUris.length} expired cache entries`);

      for (const uri of expiredUris) {
        await this.remove(uri);
      }
    }
  }

  /**
   * キャッシュサイズをチェックし、必要に応じてクリーンアップ
   */
  private async checkCacheSizeAndCleanup(): Promise<void> {
    const cacheSize = await this.getCacheSize();
    const threshold = this.config.maxCacheSize * this.config.cleanupThreshold;

    if (cacheSize > threshold) {
      console.log(
        `[ImageCache] Cache size (${cacheSize.toFixed(2)}MB) exceeds threshold (${threshold.toFixed(2)}MB), cleaning up...`
      );
      await this.cleanupOldestCache();
    }
  }

  /**
   * 古いキャッシュから順に削除
   */
  private async cleanupOldestCache(): Promise<void> {
    // タイムスタンプ順にソート
    const sortedMetadata = Array.from(this.metadata.entries()).sort(
      ([, a], [, b]) => a.timestamp - b.timestamp
    );

    // キャッシュサイズが閾値以下になるまで削除
    let currentSize = await this.getCacheSize();
    const targetSize = this.config.maxCacheSize * 0.7; // 70%まで削減

    for (const [uri] of sortedMetadata) {
      if (currentSize <= targetSize) {
        break;
      }

      const metadata = this.metadata.get(uri);
      if (metadata) {
        await this.remove(uri);
        currentSize -= metadata.size / (1024 * 1024);
      }
    }

    console.log(`[ImageCache] Cleanup completed, cache size: ${currentSize.toFixed(2)}MB`);
  }

  /**
   * ファイル名を生成（URIのハッシュ）
   */
  private generateFileName(uri: string): string {
    // シンプルなハッシュ関数（本番環境ではCryptoを使用推奨）
    let hash = 0;
    for (let i = 0; i < uri.length; i++) {
      const char = uri.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }

    const extension = uri.split('.').pop()?.split('?')[0] || 'jpg';
    return `${Math.abs(hash)}.${extension}`;
  }

  /**
   * 初期化を確認
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }
}

// シングルトンインスタンス
export const ImageCache = new ImageCacheService();
