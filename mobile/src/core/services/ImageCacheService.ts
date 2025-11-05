/**
 * ImageCacheService
 * 画像キャッシュ管理サービス
 *
 * 機能:
 * - expo-file-systemを使用した画像のダウンロードとローカル保存
 * - MD5ハッシュによるファイル名生成
 * - LRUアルゴリズムによるキャッシュサイズ制限
 * - キャッシュクリア機能
 * - AsyncStorageによるメタデータ管理
 */

import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/**
 * キャッシュメタデータ
 */
interface CacheMetadata {
  /**
   * 元のURL
   */
  url: string;

  /**
   * ローカルファイルパス
   */
  localPath: string;

  /**
   * ファイルサイズ（バイト）
   */
  size: number;

  /**
   * 最終アクセス時刻
   */
  lastAccessed: number;

  /**
   * キャッシュ作成時刻
   */
  createdAt: number;
}

/**
 * キャッシュ統計情報
 */
export interface CacheStats {
  /**
   * キャッシュされた画像の総数
   */
  totalImages: number;

  /**
   * キャッシュの総サイズ（バイト）
   */
  totalSize: number;

  /**
   * 最大キャッシュサイズ（バイト）
   */
  maxSize: number;

  /**
   * 使用率（0-1）
   */
  usageRatio: number;
}

/**
 * ImageCacheService
 * シングルトンパターン
 */
export class ImageCacheService {
  private static instance: ImageCacheService;

  /**
   * キャッシュディレクトリパス
   */
  private readonly cacheDir: string;

  /**
   * 最大キャッシュサイズ（バイト）
   * デフォルト: 100MB
   */
  private readonly maxCacheSize: number = 100 * 1024 * 1024;

  /**
   * AsyncStorageキー
   */
  private readonly STORAGE_KEY = '@climb-you:image-cache-metadata';

  /**
   * メタデータキャッシュ（メモリ）
   */
  private metadataCache: Map<string, CacheMetadata> = new Map();

  /**
   * 初期化済みフラグ
   */
  private initialized: boolean = false;

  /**
   * コンストラクタ（プライベート）
   */
  private constructor() {
    this.cacheDir = `${FileSystem.cacheDirectory}images/`;
  }

  /**
   * シングルトンインスタンスを取得
   */
  public static getInstance(): ImageCacheService {
    if (!ImageCacheService.instance) {
      ImageCacheService.instance = new ImageCacheService();
    }
    return ImageCacheService.instance;
  }

  /**
   * 初期化
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // キャッシュディレクトリを作成
      const dirInfo = await FileSystem.getInfoAsync(this.cacheDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.cacheDir, {
          intermediates: true,
        });
      }

      // メタデータを読み込み
      await this.loadMetadata();

      this.initialized = true;
    } catch (error) {
      console.error('ImageCacheService initialization failed:', error);
      throw error;
    }
  }

  /**
   * 画像を取得（キャッシュから、または新規ダウンロード）
   */
  public async getImage(url: string): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }

    // キャッシュを確認
    const cacheKey = this.getCacheKey(url);
    const metadata = this.metadataCache.get(cacheKey);

    if (metadata) {
      // キャッシュヒット - ファイルが存在するか確認
      const fileInfo = await FileSystem.getInfoAsync(metadata.localPath);
      if (fileInfo.exists) {
        // 最終アクセス時刻を更新
        await this.updateAccessTime(cacheKey);
        return metadata.localPath;
      } else {
        // ファイルが存在しない - メタデータから削除
        await this.removeMetadata(cacheKey);
      }
    }

    // キャッシュミス - ダウンロード
    return await this.downloadAndCache(url);
  }

  /**
   * 画像をダウンロードしてキャッシュ
   */
  private async downloadAndCache(url: string): Promise<string> {
    const cacheKey = this.getCacheKey(url);
    const localPath = `${this.cacheDir}${cacheKey}`;

    try {
      // ダウンロード
      const downloadResult = await FileSystem.downloadAsync(url, localPath);

      if (downloadResult.status !== 200) {
        throw new Error(`Download failed with status ${downloadResult.status}`);
      }

      // ファイルサイズを取得
      const fileInfo = await FileSystem.getInfoAsync(localPath);
      const fileSize = fileInfo.size || 0;

      // メタデータを保存
      const metadata: CacheMetadata = {
        url,
        localPath,
        size: fileSize,
        lastAccessed: Date.now(),
        createdAt: Date.now(),
      };

      this.metadataCache.set(cacheKey, metadata);
      await this.saveMetadata();

      // キャッシュサイズをチェック
      await this.enforceMaxSize();

      return localPath;
    } catch (error) {
      console.error('Image download failed:', error);
      throw error;
    }
  }

  /**
   * キャッシュキーを生成（MD5ハッシュ）
   */
  private getCacheKey(url: string): string {
    // 簡易的なハッシュ関数（本番ではcrypto使用を推奨）
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
      const char = url.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }

    // ファイル拡張子を維持
    const ext = url.split('.').pop()?.split('?')[0] || 'jpg';
    return `${Math.abs(hash).toString(16)}.${ext}`;
  }

  /**
   * 最終アクセス時刻を更新
   */
  private async updateAccessTime(cacheKey: string): Promise<void> {
    const metadata = this.metadataCache.get(cacheKey);
    if (metadata) {
      metadata.lastAccessed = Date.now();
      this.metadataCache.set(cacheKey, metadata);
      await this.saveMetadata();
    }
  }

  /**
   * 最大サイズを超えた場合、古いキャッシュを削除（LRU）
   */
  private async enforceMaxSize(): Promise<void> {
    const totalSize = this.getTotalCacheSize();

    if (totalSize <= this.maxCacheSize) {
      return;
    }

    // lastAccessedでソート（昇順）
    const sortedEntries = Array.from(this.metadataCache.entries()).sort(
      (a, b) => a[1].lastAccessed - b[1].lastAccessed
    );

    let currentSize = totalSize;

    // 最大サイズの90%まで削除
    const targetSize = this.maxCacheSize * 0.9;

    for (const [cacheKey, metadata] of sortedEntries) {
      if (currentSize <= targetSize) {
        break;
      }

      try {
        await FileSystem.deleteAsync(metadata.localPath, { idempotent: true });
        currentSize -= metadata.size;
        this.metadataCache.delete(cacheKey);
      } catch (error) {
        console.error('Failed to delete cached file:', error);
      }
    }

    await this.saveMetadata();
  }

  /**
   * キャッシュの総サイズを取得
   */
  private getTotalCacheSize(): number {
    let totalSize = 0;
    for (const metadata of this.metadataCache.values()) {
      totalSize += metadata.size;
    }
    return totalSize;
  }

  /**
   * キャッシュをクリア
   */
  public async clearCache(): Promise<void> {
    try {
      // 全てのキャッシュファイルを削除
      for (const metadata of this.metadataCache.values()) {
        await FileSystem.deleteAsync(metadata.localPath, { idempotent: true });
      }

      // メタデータをクリア
      this.metadataCache.clear();
      await AsyncStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear cache:', error);
      throw error;
    }
  }

  /**
   * 古いキャッシュを削除（指定日数より古いもの）
   */
  public async clearOldCache(daysOld: number = 30): Promise<void> {
    const cutoffTime = Date.now() - daysOld * 24 * 60 * 60 * 1000;

    try {
      for (const [cacheKey, metadata] of this.metadataCache.entries()) {
        if (metadata.createdAt < cutoffTime) {
          await FileSystem.deleteAsync(metadata.localPath, { idempotent: true });
          this.metadataCache.delete(cacheKey);
        }
      }

      await this.saveMetadata();
    } catch (error) {
      console.error('Failed to clear old cache:', error);
      throw error;
    }
  }

  /**
   * キャッシュ統計を取得
   */
  public getCacheStats(): CacheStats {
    const totalSize = this.getTotalCacheSize();

    return {
      totalImages: this.metadataCache.size,
      totalSize,
      maxSize: this.maxCacheSize,
      usageRatio: totalSize / this.maxCacheSize,
    };
  }

  /**
   * メタデータを読み込み
   */
  private async loadMetadata(): Promise<void> {
    try {
      const json = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (json) {
        const entries: [string, CacheMetadata][] = JSON.parse(json);
        this.metadataCache = new Map(entries);
      }
    } catch (error) {
      console.error('Failed to load metadata:', error);
      this.metadataCache.clear();
    }
  }

  /**
   * メタデータを保存
   */
  private async saveMetadata(): Promise<void> {
    try {
      const entries = Array.from(this.metadataCache.entries());
      const json = JSON.stringify(entries);
      await AsyncStorage.setItem(this.STORAGE_KEY, json);
    } catch (error) {
      console.error('Failed to save metadata:', error);
    }
  }

  /**
   * メタデータを削除
   */
  private async removeMetadata(cacheKey: string): Promise<void> {
    this.metadataCache.delete(cacheKey);
    await this.saveMetadata();
  }
}

/**
 * シングルトンインスタンスをエクスポート
 */
export const imageCacheService = ImageCacheService.getInstance();
