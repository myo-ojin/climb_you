/**
 * ImageCache ユニットテスト
 */

import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ImageCache } from '../ImageCache';

describe('ImageCache', () => {
  const mockUri = 'https://example.com/image.jpg';
  // 実際のハッシュ計算ロジックに合わせた値
  const generateFileName = (uri: string): string => {
    let hash = 0;
    for (let i = 0; i < uri.length; i++) {
      const char = uri.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    const extension = uri.split('.').pop()?.split('?')[0] || 'jpg';
    return `${Math.abs(hash)}.${extension}`;
  };
  const mockLocalUri = `${FileSystem.cacheDirectory}image-cache/${generateFileName(mockUri)}`;

  beforeEach(async () => {
    // モックをリセット
    jest.clearAllMocks();

    // FileSystemのモック設定
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
      exists: true,
      size: 1024,
    });

    (FileSystem.makeDirectoryAsync as jest.Mock).mockResolvedValue(undefined);
    (FileSystem.downloadAsync as jest.Mock).mockResolvedValue({
      status: 200,
      uri: mockLocalUri,
    });

    (FileSystem.deleteAsync as jest.Mock).mockResolvedValue(undefined);

    // AsyncStorageのモック設定
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

    // ImageCacheを初期化
    await ImageCache.clear();
  });

  describe('初期化', () => {
    it('initialize()でキャッシュディレクトリを作成', async () => {
      // ディレクトリが存在しない場合
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({
        exists: false,
      });

      await ImageCache.initialize();

      expect(FileSystem.makeDirectoryAsync).toHaveBeenCalledWith(
        expect.stringContaining('image-cache'),
        { intermediates: true }
      );
    });
  });

  describe('画像取得', () => {
    it('get()でキャッシュがある場合、ローカルURIを返す', async () => {
      await ImageCache.initialize();

      // 最初にダウンロード
      await ImageCache.download(mockUri);

      // 2回目は キャッシュから取得
      const localUri = await ImageCache.get(mockUri);

      expect(localUri).toBe(mockLocalUri);
      // downloadAsyncは1回のみ呼ばれる（キャッシュヒット）
      expect(FileSystem.downloadAsync).toHaveBeenCalledTimes(1);
    });

    it('get()でキャッシュがない場合、ダウンロードして返す', async () => {
      await ImageCache.initialize();

      const localUri = await ImageCache.get(mockUri);

      expect(localUri).toBe(mockLocalUri);
      expect(FileSystem.downloadAsync).toHaveBeenCalledWith(
        mockUri,
        expect.stringContaining('.jpg')
      );
    });
  });

  describe('画像ダウンロード', () => {
    it('download()で画像をダウンロードしてキャッシュ', async () => {
      await ImageCache.initialize();

      const localUri = await ImageCache.download(mockUri);

      expect(localUri).toBe(mockLocalUri);
      expect(FileSystem.downloadAsync).toHaveBeenCalledWith(
        mockUri,
        expect.stringContaining('.jpg')
      );
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    it('download()でダウンロード失敗時、エラーをスロー', async () => {
      await ImageCache.initialize();

      (FileSystem.downloadAsync as jest.Mock).mockResolvedValueOnce({
        status: 404,
      });

      await expect(ImageCache.download(mockUri)).rejects.toThrow('Download failed with status 404');
    });
  });

  describe('プリロード', () => {
    it('preload()で複数の画像を並行してダウンロード', async () => {
      await ImageCache.initialize();

      const uris = [
        'https://example.com/image1.jpg',
        'https://example.com/image2.jpg',
        'https://example.com/image3.jpg',
      ];

      await ImageCache.preload(uris);

      expect(FileSystem.downloadAsync).toHaveBeenCalledTimes(3);
    });

    it('preload()で一部失敗しても継続', async () => {
      await ImageCache.initialize();

      // 2番目のダウンロードが失敗
      (FileSystem.downloadAsync as jest.Mock)
        .mockResolvedValueOnce({ status: 200, uri: mockLocalUri })
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ status: 200, uri: mockLocalUri });

      const uris = [
        'https://example.com/image1.jpg',
        'https://example.com/image2.jpg',
        'https://example.com/image3.jpg',
      ];

      await ImageCache.preload(uris);

      // 3回試行される（1つ失敗しても継続）
      expect(FileSystem.downloadAsync).toHaveBeenCalledTimes(3);
    });
  });

  describe('キャッシュクリア', () => {
    it('clear()でキャッシュディレクトリを削除して再作成', async () => {
      await ImageCache.initialize();

      await ImageCache.clear();

      expect(FileSystem.deleteAsync).toHaveBeenCalledWith(
        expect.stringContaining('image-cache'),
        { idempotent: true }
      );
      expect(FileSystem.makeDirectoryAsync).toHaveBeenCalled();
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@image-cache-metadata', '[]');
    });

    it('remove()で特定の画像を削除', async () => {
      await ImageCache.initialize();

      await ImageCache.download(mockUri);

      // clear()で呼ばれたdeleteAsyncをリセット
      jest.clearAllMocks();

      await ImageCache.remove(mockUri);

      expect(FileSystem.deleteAsync).toHaveBeenCalledWith(mockLocalUri, { idempotent: true });
    });
  });

  describe('キャッシュサイズ', () => {
    it('getCacheSize()でキャッシュサイズを取得（MB単位）', async () => {
      await ImageCache.initialize();

      // 1024バイトの画像を3つダウンロード
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: true,
        size: 1024,
      });

      await ImageCache.download('https://example.com/image1.jpg');
      await ImageCache.download('https://example.com/image2.jpg');
      await ImageCache.download('https://example.com/image3.jpg');

      const cacheSize = await ImageCache.getCacheSize();

      // 3072バイト = 0.003MB
      expect(cacheSize).toBeCloseTo(0.003, 3);
    });

    it('getCacheInfo()でキャッシュ情報を取得', async () => {
      await ImageCache.initialize();

      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: true,
        size: 1024,
      });

      await ImageCache.download(mockUri);

      const info = await ImageCache.getCacheInfo();

      expect(info).toMatchObject({
        totalSize: expect.any(Number),
        itemCount: 1,
        maxCacheSize: 100,
        usagePercentage: expect.any(Number),
      });
    });
  });
});
