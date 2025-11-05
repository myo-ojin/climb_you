/**
 * OfflineMode.test.ts
 * オフラインモード機�EのユニットテスチE
 *
 * チE��ト対象:
 * - OfflineDataProvider のネットワーク状態検知
 * - ローカルチE�Eタの取征E
 * - OfflineSyncQueueManager のキュー管琁E
 * - オフラインモード変更イベンチE
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import {
  OfflineDataProvider,
  OfflineDataProvider as OfflineDataProviderClass,
} from './OfflineDataProvider';
import {
  OfflineSyncQueueManager,
  OfflineSyncQueueManager as OfflineSyncQueueManagerClass,
} from './OfflineSyncQueueManager';
import { SyncQueueItem } from '@/core/domain/entities/SyncQueue';

// モチE��
jest.mock('@react-native-async-storage/async-storage');
jest.mock('@react-native-community/netinfo');
jest.mock('@/core/data/datasources/LocalDataSource');

describe('OfflineDataProvider', () => {
  let provider: OfflineDataProvider;

  beforeEach(async () => {
    OfflineDataProviderClass.resetInstance();
    provider = OfflineDataProvider.getInstance();
    jest.mocked(NetInfo.fetch).mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
      type: 'wifi',
    } as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('初期化できる', async () => {
      await provider.initialize();
      const state = provider.getState();

      expect(state.isChecking).toBe(false);
      expect(state.isOnline).toBe(true);
    });

    it('初期状態�Eオンライン', async () => {
      jest.mocked(NetInfo.fetch).mockResolvedValueOnce({
        isConnected: true,
        isInternetReachable: true,
        type: 'wifi',
      } as any);

      await provider.initialize();

      expect(provider.isOnline()).toBe(true);
    });

    it('ネットワーク接続なし�E場合�Eオフライン', async () => {
      jest.mocked(NetInfo.fetch).mockResolvedValueOnce({
        isConnected: false,
        isInternetReachable: false,
        type: 'none',
      } as any);

      await provider.initialize();

      expect(provider.isOnline()).toBe(false);
    });
  });

  describe('network state changes', () => {
    it('オンラインからオフラインに変更されめE, async (done) => {
      await provider.initialize();

      provider.getOfflineModeChanged$().subscribe((state) => {
        if (!state.isOnline) {
          expect(state.isOnline).toBe(false);
          expect(state.offlineReason).toBeTruthy();
          done();
        }
      });

      // オフラインに変更
      jest.mocked(NetInfo.addEventListener).mock.calls[0][0]({
        isConnected: false,
        isInternetReachable: false,
        type: 'none',
      } as any);
    });

    it('オフラインからオンラインに変更されめE, async (done) => {
      jest.mocked(NetInfo.fetch).mockResolvedValueOnce({
        isConnected: false,
        isInternetReachable: false,
        type: 'none',
      } as any);

      await provider.initialize();

      let changeCount = 0;
      provider.getOfflineModeChanged$().subscribe((state) => {
        changeCount++;
        if (changeCount === 2 && state.isOnline) {
          // 2回目の変更がオンラインになったとぁE
          expect(state.isOnline).toBe(true);
          expect(state.lastOnlineAt).toBeTruthy();
          done();
        }
      });

      // オンラインに変更
      jest.mocked(NetInfo.addEventListener).mock.calls[0][0]({
        isConnected: true,
        isInternetReachable: true,
        type: 'wifi',
      } as any);
    });
  });

  describe('offline features', () => {
    it('オフラインで利用可能な機�Eを確認できる', async () => {
      await provider.initialize();

      // 閲覧機�Eは利用可能
      expect(provider.isFeatureAvailableOffline('viewGoals')).toBe(true);
      expect(provider.isFeatureAvailableOffline('viewQuests')).toBe(true);
      expect(provider.isFeatureAvailableOffline('recordQuestCompletion')).toBe(true);

      // ファイルアチE�Eロード�E利用不可
      expect(provider.isFeatureAvailableOffline('uploadEvidence')).toBe(false);
    });
  });

  describe('event subscriptions', () => {
    it('オフラインになったイベントを購読できる', async (done) => {
      await provider.initialize();

      provider.getGoingOffline$().subscribe(() => {
        expect(true).toBe(true);
        done();
      });

      // オフラインに変更
      jest.mocked(NetInfo.addEventListener).mock.calls[0][0]({
        isConnected: false,
        isInternetReachable: false,
        type: 'none',
      } as any);
    });

    it('オンラインになったイベントを購読できる', async (done) => {
      jest.mocked(NetInfo.fetch).mockResolvedValueOnce({
        isConnected: false,
        isInternetReachable: false,
        type: 'none',
      } as any);

      await provider.initialize();

      provider.getGoingOnline$().subscribe(() => {
        expect(true).toBe(true);
        done();
      });

      // オンラインに変更
      jest.mocked(NetInfo.addEventListener).mock.calls[0][0]({
        isConnected: true,
        isInternetReachable: true,
        type: 'wifi',
      } as any);
    });
  });
});

describe('OfflineSyncQueueManager', () => {
  let manager: OfflineSyncQueueManager;

  beforeEach(async () => {
    OfflineSyncQueueManagerClass.resetInstance();
    manager = OfflineSyncQueueManager.getInstance();
    jest.mocked(AsyncStorage.getItem).mockResolvedValue(null);
    jest.mocked(AsyncStorage.setItem).mockResolvedValue();
    jest.mocked(AsyncStorage.removeItem).mockResolvedValue();
    await manager.initialize();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('queue operations', () => {
    it('操作をキューに追加できる', async () => {
      jest.mocked(AsyncStorage.setItem).mockResolvedValue();

      const itemId = await manager.queueOperationOffline(
        'complete_quest',
        'quest',
        'quest-1',
        { status: 'completed' }
      );

      expect(itemId).toBeTruthy();
      expect(manager.getQueueSize()).toBe(1);
    });

    it('褁E��の操作をキューに追加できる', async () => {
      jest.mocked(AsyncStorage.setItem).mockResolvedValue();

      await manager.queueOperationOffline(
        'complete_quest',
        'quest',
        'quest-1',
        { status: 'completed' }
      );

      await manager.queueOperationOffline(
        'update',
        'user_progress',
        'progress-1',
        { total_steps: 500 }
      );

      expect(manager.getQueueSize()).toBe(2);
    });

    it('キューが満杯の場合�Eエラーを発生させる', async () => {
      // キューをシミュレートで満杯にする
      const queueArray = Array.from({ length: 1000 }, (_, i) => ({
        id: `item-${i}`,
        operation: 'create' as const,
        entityType: 'quest' as const,
        entityId: `quest-${i}`,
        payload: {},
        createdAt: new Date(),
        retryCount: 0,
        lastError: null,
        status: 'pending' as const,
      }));

      jest.mocked(AsyncStorage.getItem).mockResolvedValueOnce(JSON.stringify(queueArray));

      const filledManager = OfflineSyncQueueManager.getInstance();
      await filledManager.initialize();

      await expect(
        filledManager.queueOperationOffline(
          'complete_quest',
          'quest',
          'quest-new',
          { status: 'completed' }
        )
      ).rejects.toThrow('full');
    });
  });

  describe('queue retrieval', () => {
    it('キューを取得できる', async () => {
      jest.mocked(AsyncStorage.setItem).mockResolvedValue();

      await manager.queueOperationOffline(
        'complete_quest',
        'quest',
        'quest-1',
        { status: 'completed' }
      );

      const queue = manager.getQueue();

      expect(queue.length).toBe(1);
      expect(queue[0].operation).toBe('complete_quest');
    });

    it('キューサイズを取得できる', async () => {
      jest.mocked(AsyncStorage.setItem).mockResolvedValue();

      await manager.queueOperationOffline(
        'complete_quest',
        'quest',
        'quest-1',
        {}
      );

      expect(manager.getQueueSize()).toBe(1);
    });

    it('ペンチE��ング操作数を取得できる', async () => {
      jest.mocked(AsyncStorage.setItem).mockResolvedValue();

      await manager.queueOperationOffline('complete_quest', 'quest', 'quest-1', {});
      await manager.queueOperationOffline('update', 'goal', 'goal-1', {});

      expect(manager.getPendingOperationsCount()).toBe(2);
    });
  });

  describe('queue state', () => {
    it('キューの状態を取得できる', async () => {
      jest.mocked(AsyncStorage.setItem).mockResolvedValue();

      await manager.queueOperationOffline('complete_quest', 'quest', 'quest-1', {});

      const state = manager.getQueueState();

      expect(state.isQueueing).toBe(true);
      expect(state.queueSize).toBe(1);
      expect(state.pendingOperations).toBe(1);
      expect(state.estimatedSyncTime).toBeGreaterThan(0);
    });
  });

  describe('queue removal', () => {
    it('キューからアイチE��を削除できる', async () => {
      jest.mocked(AsyncStorage.setItem).mockResolvedValue();

      const itemId = await manager.queueOperationOffline(
        'complete_quest',
        'quest',
        'quest-1',
        {}
      );

      expect(manager.getQueueSize()).toBe(1);

      await manager.removeQueuedItem(itemId);

      expect(manager.getQueueSize()).toBe(0);
    });

    it('存在しなぁE��イチE��を削除しよぁE��しても例外�E発生しなぁE, async () => {
      jest.mocked(AsyncStorage.setItem).mockResolvedValue();

      await expect(manager.removeQueuedItem('nonexistent')).resolves.not.toThrow();
    });
  });

  describe('queue statistics', () => {
    it('キューの統計を取得できる', async () => {
      jest.mocked(AsyncStorage.setItem).mockResolvedValue();

      await manager.queueOperationOffline('complete_quest', 'quest', 'quest-1', {});
      await manager.queueOperationOffline('update', 'goal', 'goal-1', {});

      const stats = manager.getQueueStatistics();

      expect(stats.totalItems).toBe(2);
      expect(stats.pendingItems).toBe(2);
      expect(stats.failedItems).toBe(0);
    });
  });

  describe('queue priority', () => {
    it('キューを�EリオリチE��でソートできる', async () => {
      jest.mocked(AsyncStorage.setItem).mockResolvedValue();

      // 操作をランダムな頁E��で追加
      await manager.queueOperationOffline('create', 'quest', 'quest-1', {});
      await manager.queueOperationOffline('delete', 'goal', 'goal-1', {});
      await manager.queueOperationOffline('update', 'quest', 'quest-2', {});

      // キューをフラチE��ュ準備�E�ソート実施�E�E
      const sortedQueue = await manager.prepareQueueForSync();

      // delete > update > create の優先度なので
      expect(sortedQueue[0].operation).toBe('delete');
      expect(sortedQueue[1].operation).toBe('update');
      expect(sortedQueue[2].operation).toBe('create');
    });
  });

  describe('queue clearing', () => {
    it('キューをクリアできる', async () => {
      jest.mocked(AsyncStorage.setItem).mockResolvedValue();
      jest.mocked(AsyncStorage.removeItem).mockResolvedValue();

      await manager.queueOperationOffline('complete_quest', 'quest', 'quest-1', {});
      expect(manager.getQueueSize()).toBe(1);

      await manager.clearQueue();

      expect(manager.getQueueSize()).toBe(0);
      expect(AsyncStorage.removeItem).toHaveBeenCalled();
    });
  });

  describe('queue events', () => {
    it('アイチE��キューイングイベントが発火されめE, async (done) => {
      jest.mocked(AsyncStorage.setItem).mockResolvedValue();

      manager.getItemQueued$().subscribe((item) => {
        expect(item.operation).toBe('complete_quest');
        done();
      });

      await manager.queueOperationOffline('complete_quest', 'quest', 'quest-1', {});
    });

    it('アイチE��削除イベントが発火されめE, async (done) => {
      jest.mocked(AsyncStorage.setItem).mockResolvedValue();

      const itemId = await manager.queueOperationOffline(
        'complete_quest',
        'quest',
        'quest-1',
        {}
      );

      manager.getItemRemoved$().subscribe((id) => {
        expect(id).toBe(itemId);
        done();
      });

      await manager.removeQueuedItem(itemId);
    });

    it('キューフラチE��ュ開始イベントが発火されめE, async (done) => {
      jest.mocked(AsyncStorage.setItem).mockResolvedValue();

      await manager.queueOperationOffline('complete_quest', 'quest', 'quest-1', {});

      manager.getQueueFlushStarted$().subscribe(() => {
        expect(true).toBe(true);
        done();
      });

      await manager.prepareQueueForSync();
    });

    it('キューフラチE��ュ完亁E��ベントが発火されめE, async (done) => {
      manager.getQueueFlushCompleted$().subscribe((count) => {
        expect(count).toBe(5);
        done();
      });

      await manager.completeQueueFlush(5);
    });
  });

  describe('queue persistence', () => {
    it('キューが永続化されめE, async () => {
      jest.mocked(AsyncStorage.setItem).mockResolvedValue();

      await manager.queueOperationOffline('complete_quest', 'quest', 'quest-1', {});

      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    it('キューが復允E��れる', async () => {
      const mockQueue = [
        {
          id: 'item-1',
          operation: 'complete_quest' as const,
          entityType: 'quest' as const,
          entityId: 'quest-1',
          payload: {},
          createdAt: new Date().toISOString(),
          retryCount: 0,
          lastError: null,
          status: 'pending' as const,
        },
      ];

      jest.mocked(AsyncStorage.getItem).mockResolvedValueOnce(JSON.stringify(mockQueue));

      const newManager = OfflineSyncQueueManager.getInstance();
      await newManager.initialize();

      expect(newManager.getQueueSize()).toBe(1);
    });
  });

  describe('failed items', () => {
    it('失敗したアイチE��を�Eークできる', async () => {
      jest.mocked(AsyncStorage.setItem).mockResolvedValue();

      const itemId = await manager.queueOperationOffline(
        'complete_quest',
        'quest',
        'quest-1',
        {}
      );

      await manager.markItemAsFailed(itemId, 'Network error');

      const queue = manager.getQueue();
      const item = queue.find((i) => i.id === itemId);

      expect(item?.status).toBe('failed');
      expect(item?.lastError).toBe('Network error');
    });
  });
});

