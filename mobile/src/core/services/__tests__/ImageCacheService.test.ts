/**
 * ImageCacheService ユニットテスト
 */

// モックを先に定義
jest.mock('expo-file-system', () => ({
  cacheDirectory: 'file:///cache/',
  getInfoAsync: jest.fn(),
  makeDirectoryAsync: jest.fn(),
  downloadAsync: jest.fn(),
  deleteAsync: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'ios',
  select: jest.fn((obj) => obj.ios),
}));

import { ImageCacheService } from '../ImageCacheService';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

describe('ImageCacheService', () => {
  let service: ImageCacheService;

  const mockFileSystem = FileSystem as jest.Mocked<typeof FileSystem>;
  const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

  beforeEach(async () => {
    jest.clearAllMocks();

    // デフォルトのモック実装
    mockFileSystem.cacheDirectory = 'file:///cache/';
    mockFileSystem.getInfoAsync.mockResolvedValue({
      exists: true,
      isDirectory: true,
      uri: 'file:///cache/images/',
      size: 0,
      modificationTime: 0,
      md5: undefined,
    });
    mockFileSystem.makeDirectoryAsync.mockResolvedValue();
    mockFileSystem.downloadAsync.mockResolvedValue({
      uri: 'file:///cache/images/test.jpg',
      status: 200,
      headers: {},
      md5: undefined,
    });
    mockFileSystem.deleteAsync.mockResolvedValue();

    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue();
    mockAsyncStorage.removeItem.mockResolvedValue();

    // シングルトンインスタンスを取得
    service = ImageCacheService.getInstance();

    // プライベートフィールドをリセット（テスト用）
    (service as any).initialized = false;
    (service as any).metadataCache = new Map();
  });

  describe('initialize', () => {
    it('キャッシュディレクトリを作成する', async () => {
      // ディレクトリが存在しない場合
      mockFileSystem.getInfoAsync.mockResolvedValueOnce({
        exists: false,
        isDirectory: false,
        uri: '',
        size: 0,
        modificationTime: 0,
        md5: undefined,
      });

      await service.initialize();

      expect(mockFileSystem.getInfoAsync).toHaveBeenCalledWith(
        'file:///cache/images/'
      );
      expect(mockFileSystem.makeDirectoryAsync).toHaveBeenCalledWith(
        'file:///cache/images/',
        { intermediates: true }
      );
    });

    it('既存のキャッシュディレクトリがある場合は作成しない', async () => {
      await service.initialize();

      expect(mockFileSystem.makeDirectoryAsync).not.toHaveBeenCalled();
    });

    it('既存のメタデータを読み込む', async () => {
      const mockMetadata = JSON.stringify([
        [
          'abc123.jpg',
          {
            url: 'https://example.com/image.jpg',
            localPath: 'file:///cache/images/abc123.jpg',
            size: 1024,
            lastAccessed: Date.now(),
            createdAt: Date.now(),
          },
        ],
      ]);

      mockAsyncStorage.getItem.mockResolvedValueOnce(mockMetadata);

      await service.initialize();

      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith(
        '@climb-you:image-cache-metadata'
      );
    });
  });

  describe('getImage', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('キャッシュヒット時はローカルパスを返す', async () => {
      const url = 'https://example.com/image.jpg';
      const localPath = 'file:///cache/images/3f01d733.jpg';

      // 1回目: ダウンロード
      mockFileSystem.downloadAsync.mockResolvedValueOnce({
        uri: localPath,
        status: 200,
        headers: {},
        md5: undefined,
      });
      // ダウンロード後のファイルサイズ取得
      mockFileSystem.getInfoAsync.mockResolvedValueOnce({
        exists: true,
        isDirectory: false,
        uri: localPath,
        size: 1024,
        modificationTime: 0,
        md5: undefined,
      });

      const path1 = await service.getImage(url);

      // 2回目: キャッシュヒット
      mockFileSystem.getInfoAsync.mockResolvedValueOnce({
        exists: true,
        isDirectory: false,
        uri: localPath,
        size: 1024,
        modificationTime: 0,
        md5: undefined,
      });

      const path2 = await service.getImage(url);

      expect(path2).toBe(path1);
      expect(mockFileSystem.downloadAsync).toHaveBeenCalledTimes(1);
    });

    it('キャッシュミス時は画像をダウンロードする', async () => {
      const url = 'https://example.com/image.jpg';
      const localPath = 'file:///cache/images/3f01d733.jpg';

      mockFileSystem.downloadAsync.mockResolvedValueOnce({
        uri: localPath,
        status: 200,
        headers: {},
        md5: undefined,
      });
      mockFileSystem.getInfoAsync.mockResolvedValueOnce({
        exists: true,
        isDirectory: false,
        uri: localPath,
        size: 1024,
        modificationTime: 0,
        md5: undefined,
      });

      const path = await service.getImage(url);

      expect(mockFileSystem.downloadAsync).toHaveBeenCalledWith(
        url,
        expect.stringContaining('file:///cache/images/')
      );
      expect(path).toContain('file:///cache/images/');
    });

    it('ダウンロード失敗時はエラーをスローする', async () => {
      const url = 'https://example.com/image.jpg';

      mockFileSystem.downloadAsync.mockResolvedValueOnce({
        uri: '',
        status: 404,
        headers: {},
        md5: undefined,
      });

      await expect(service.getImage(url)).rejects.toThrow(
        'Download failed with status 404'
      );
    });
  });

  describe('clearCache', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('全てのキャッシュファイルを削除する', async () => {
      // キャッシュに画像を追加
      const url1 = 'https://example.com/image1.jpg';
      const url2 = 'https://example.com/image2.jpg';
      const localPath1 = 'file:///cache/images/path1.jpg';
      const localPath2 = 'file:///cache/images/path2.jpg';

      // 1枚目
      mockFileSystem.downloadAsync.mockResolvedValueOnce({
        uri: localPath1,
        status: 200,
        headers: {},
        md5: undefined,
      });
      mockFileSystem.getInfoAsync.mockResolvedValueOnce({
        exists: true,
        isDirectory: false,
        uri: localPath1,
        size: 1024,
        modificationTime: 0,
        md5: undefined,
      });

      // 2枚目
      mockFileSystem.downloadAsync.mockResolvedValueOnce({
        uri: localPath2,
        status: 200,
        headers: {},
        md5: undefined,
      });
      mockFileSystem.getInfoAsync.mockResolvedValueOnce({
        exists: true,
        isDirectory: false,
        uri: localPath2,
        size: 1024,
        modificationTime: 0,
        md5: undefined,
      });

      await service.getImage(url1);
      await service.getImage(url2);

      // キャッシュをクリア
      await service.clearCache();

      expect(mockFileSystem.deleteAsync).toHaveBeenCalledTimes(2);
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith(
        '@climb-you:image-cache-metadata'
      );
    });
  });

  describe('clearOldCache', () => {
    it('指定日数より古いキャッシュを削除する', async () => {
      const now = Date.now();
      const oldTime = now - 31 * 24 * 60 * 60 * 1000; // 31日前

      // 古いキャッシュを追加
      const mockMetadata = JSON.stringify([
        [
          'old.jpg',
          {
            url: 'https://example.com/old.jpg',
            localPath: 'file:///cache/images/old.jpg',
            size: 1024,
            lastAccessed: now,
            createdAt: oldTime,
          },
        ],
        [
          'new.jpg',
          {
            url: 'https://example.com/new.jpg',
            localPath: 'file:///cache/images/new.jpg',
            size: 1024,
            lastAccessed: now,
            createdAt: now,
          },
        ],
      ]);

      mockAsyncStorage.getItem.mockResolvedValueOnce(mockMetadata);

      // 初期化してメタデータを読み込む
      await service.initialize();

      // 30日より古いキャッシュを削除
      await service.clearOldCache(30);

      expect(mockFileSystem.deleteAsync).toHaveBeenCalledWith(
        'file:///cache/images/old.jpg',
        { idempotent: true }
      );
      expect(mockFileSystem.deleteAsync).toHaveBeenCalledTimes(1);
    });
  });

  describe('getCacheStats', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('キャッシュ統計を返す', async () => {
      const url1 = 'https://example.com/image1.jpg';
      const url2 = 'https://example.com/image2.jpg';
      const localPath1 = 'file:///cache/images/path1.jpg';
      const localPath2 = 'file:///cache/images/path2.jpg';

      // 1枚目
      mockFileSystem.downloadAsync.mockResolvedValueOnce({
        uri: localPath1,
        status: 200,
        headers: {},
        md5: undefined,
      });
      mockFileSystem.getInfoAsync.mockResolvedValueOnce({
        exists: true,
        isDirectory: false,
        uri: localPath1,
        size: 1024,
        modificationTime: 0,
        md5: undefined,
      });

      // 2枚目
      mockFileSystem.downloadAsync.mockResolvedValueOnce({
        uri: localPath2,
        status: 200,
        headers: {},
        md5: undefined,
      });
      mockFileSystem.getInfoAsync.mockResolvedValueOnce({
        exists: true,
        isDirectory: false,
        uri: localPath2,
        size: 1024,
        modificationTime: 0,
        md5: undefined,
      });

      await service.getImage(url1);
      await service.getImage(url2);

      const stats = service.getCacheStats();

      expect(stats.totalImages).toBe(2);
      expect(stats.totalSize).toBe(2048); // 1024 * 2
      expect(stats.maxSize).toBe(100 * 1024 * 1024); // 100MB
      expect(stats.usageRatio).toBeCloseTo(2048 / (100 * 1024 * 1024));
    });
  });
});
