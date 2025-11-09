/**
 * BackgroundSync.test.ts
 * バックグラウンド同期機能のユニットテスト
 *
 * テスト対象:
 * - BackgroundSyncManager の初期化・登録解除
 * - BackgroundSyncTask の実行・ログ記録
 * - OfflineSyncQueueHandler のキュー管理
 * - ネットワーク状態の変更検知
 * - 低電力モードの処理
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { BackgroundSyncManager } from './BackgroundSyncManager';
import {
  registerBackgroundSyncTask,
  unregisterBackgroundSyncTask,
  getBackgroundSyncLogs,
  getLastBackgroundSyncTime,
  clearBackgroundSyncLogs,
} from './BackgroundSyncTask';
import {
  OfflineSyncQueueHandler,
  resetOfflineSyncQueueHandler,
} from './OfflineSyncQueueHandler';
import { SyncQueueItem } from '@/core/domain/entities/SyncQueue';

// モック
jest.mock('@react-native-async-storage/async-storage');
jest.mock('@react-native-community/netinfo');
jest.mock('expo-background-fetch', () => ({
  BackgroundFetchStatus: {
    Restricted: 1,
    Denied: 2,
    Available: 3,
  },
  BackgroundFetchResult: {
    NoData: 1,
    NewData: 2,
    Failed: 3,
  },
  getStatusAsync: jest.fn().mockResolvedValue(3), // Available
  setMinimumIntervalAsync: jest.fn().mockResolvedValue(undefined),
  registerTaskAsync: jest.fn().mockResolvedValue(undefined),
  unregisterTaskAsync: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('expo-task-manager', () => ({
  defineTask: jest.fn(),
  isTaskRegisteredAsync: jest.fn().mockResolvedValue(false),
  unregisterTaskAsync: jest.fn().mockResolvedValue(undefined),
  getRegisteredTasksAsync: jest.fn().mockResolvedValue([]),
}));
jest.mock('./SyncManager');

describe('BackgroundSyncManager', () => {
  let manager: BackgroundSyncManager;

  beforeEach(async () => {
    // シングルトンをリセチE��
    BackgroundSyncManager.resetInstance();
    manager = BackgroundSyncManager.getInstance();
  });

  afterEach(async () => {
    await manager.destroy();
  });

  describe('initialization', () => {
    it('初期化できる', async () => {
      await manager.initialize();
      const state = manager.getState();

      expect(state.isInitialized).toBe(true);
      expect(state.isRegistered).toBe(false);
      expect(state.isNetworkAvailable).toBe(true);
    });

    it('二重初期化はスキップされる', async () => {
      await manager.initialize();
      const firstState = manager.getState();

      await manager.initialize();
      const secondState = manager.getState();

      expect(firstState.isInitialized).toBe(true);
      expect(secondState.isInitialized).toBe(true);
    });

    it('初期化時に低電力モード状態を読み込む', async () => {
      jest.mocked(AsyncStorage.getItem).mockResolvedValueOnce('true');

      await manager.initialize();
      const state = manager.getState();

      expect(state.isLowPowerMode).toBe(true);
    });
  });

  describe('registerBackgroundSync', () => {
    it('バックグラウンド同期を登録できる', async () => {
      await manager.initialize();
      jest.mocked(BackgroundFetch.registerTaskAsync).mockResolvedValueOnce();

      await manager.registerBackgroundSync();
      const state = manager.getState();

      expect(state.isRegistered).toBe(true);
      expect(BackgroundFetch.registerTaskAsync).toHaveBeenCalled();
    });

    it('二重登録はスキップされる', async () => {
      await manager.initialize();
      jest.mocked(BackgroundFetch.registerTaskAsync).mockResolvedValueOnce();

      await manager.registerBackgroundSync();
      await manager.registerBackgroundSync();

      expect(BackgroundFetch.registerTaskAsync).toHaveBeenCalledTimes(1);
    });
  });

  describe('unregisterBackgroundSync', () => {
    it('バックグラウンド同期を登録解除できる', async () => {
      await manager.initialize();
      jest.mocked(BackgroundFetch.registerTaskAsync).mockResolvedValueOnce();
      jest.mocked(BackgroundFetch.unregisterTaskAsync).mockResolvedValueOnce();

      await manager.registerBackgroundSync();
      await manager.unregisterBackgroundSync();

      const state = manager.getState();
      expect(state.isRegistered).toBe(false);
    });
  });

  describe('setLowPowerMode', () => {
    it('低電力モードを有効にできる', async () => {
      await manager.initialize();
      jest.mocked(AsyncStorage.setItem).mockResolvedValueOnce();

      await manager.setLowPowerMode(true);
      const state = manager.getState();

      expect(state.isLowPowerMode).toBe(true);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('device:lowPowerMode', 'true');
    });

    it('低電力モードを無効にできる', async () => {
      await manager.initialize();
      jest.mocked(AsyncStorage.setItem).mockResolvedValueOnce();

      await manager.setLowPowerMode(false);
      const state = manager.getState();

      expect(state.isLowPowerMode).toBe(false);
    });

    it('低電力モード変更イベントが発火される', async (done) => {
      await manager.initialize();
      jest.mocked(AsyncStorage.setItem).mockResolvedValueOnce();

      manager.getLowPowerModeChanged$().subscribe((enabled) => {
        expect(enabled).toBe(true);
        done();
      });

      await manager.setLowPowerMode(true);
    });
  });

  describe('state observable', () => {
    it('状態ストリームを購読できる', async (done) => {
      await manager.initialize();

      manager.getState$().subscribe((state) => {
        expect(state.isInitialized).toBe(true);
        done();
      });
    });
  });

  describe('destroy', () => {
    it('マネージャーを破棄できる', async () => {
      await manager.initialize();
      jest.mocked(BackgroundFetch.unregisterTaskAsync).mockResolvedValueOnce();

      await manager.destroy();
      const state = manager.getState();

      expect(state.isInitialized).toBe(false);
    });
  });
});

describe('BackgroundSyncTask', () => {
  beforeEach(() => {
    jest.mocked(BackgroundFetch.registerTaskAsync).mockResolvedValueOnce();
    jest.mocked(TaskManager.defineTask).mockImplementation(() => {});
    jest.mocked(TaskManager.isTaskDefined).mockReturnValueOnce(false);
  });

  afterEach(async () => {
    await clearBackgroundSyncLogs();
  });

  describe('registerBackgroundSyncTask', () => {
    it('バックグラウンド同期タスクを登録できる', async () => {
      await registerBackgroundSyncTask();

      expect(TaskManager.defineTask).toHaveBeenCalled();
      expect(BackgroundFetch.registerTaskAsync).toHaveBeenCalled();
    });

    it('タスク設定に正しいパラメータが含まれる', async () => {
      await registerBackgroundSyncTask();

      const callArgs = jest.mocked(BackgroundFetch.registerTaskAsync).mock.calls[0];
      const options = callArgs[1];

      expect(options.minimumInterval).toBe(15 * 60); // 15刁E
      expect(options.stopOnTerminate).toBe(false);
      expect(options.startOnBoot).toBe(true);
    });
  });

  describe('unregisterBackgroundSyncTask', () => {
    it('バックグラウンド同期タスクを登録解除できる', async () => {
      jest.mocked(BackgroundFetch.unregisterTaskAsync).mockResolvedValueOnce();

      await unregisterBackgroundSyncTask();

      expect(BackgroundFetch.unregisterTaskAsync).toHaveBeenCalled();
    });
  });

  describe('getBackgroundSyncLogs', () => {
    it('ログを取得できる', async () => {
      // ログが空の場吁E
      jest.mocked(AsyncStorage.getItem).mockResolvedValueOnce(null);

      const logs = await getBackgroundSyncLogs();
      expect(logs).toEqual([]);
    });

    it('ログ数を制限できる', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          timestamp: 1000,
          status: 'success' as const,
          itemsSynced: 5,
        },
        {
          id: 'log-2',
          timestamp: 2000,
          status: 'success' as const,
          itemsSynced: 3,
        },
      ];

      jest.mocked(AsyncStorage.getItem).mockResolvedValueOnce(JSON.stringify(mockLogs));

      const logs = await getBackgroundSyncLogs(1);
      expect(logs.length).toBeLessThanOrEqual(1);
    });
  });

  describe('getLastBackgroundSyncTime', () => {
    it('最後の同期時刻を取得できる', async () => {
      const timestamp = Date.now();
      jest.mocked(AsyncStorage.getItem).mockResolvedValueOnce(String(timestamp));

      const lastSync = await getLastBackgroundSyncTime();
      expect(lastSync).toBe(timestamp);
    });

    it('同期時刻がない場合は null を返す', async () => {
      jest.mocked(AsyncStorage.getItem).mockResolvedValueOnce(null);

      const lastSync = await getLastBackgroundSyncTime();
      expect(lastSync).toBeNull();
    });
  });
});

describe('OfflineSyncQueueHandler', () => {
  let handler: OfflineSyncQueueHandler;

  beforeEach(async () => {
    resetOfflineSyncQueueHandler();
    handler = new OfflineSyncQueueHandler();
    jest.mocked(AsyncStorage.getItem).mockResolvedValueOnce(null);
    await handler.initialize();
  });

  afterEach(async () => {
    await handler.clearQueue();
  });

  describe('initialization', () => {
    it('初期化できる', async () => {
      expect(handler.getQueueSize()).toBe(0);
      expect(handler.isQueueEmpty()).toBe(true);
    });

    it('永続化されたキューを復允E��きる', async () => {
      const mockQueue = [
        {
          id: 'item-1',
          operation: 'create' as const,
          entityType: 'quest' as const,
          entityId: 'quest-1',
          payload: {},
          createdAt: new Date(),
          retryCount: 0,
          lastError: null,
          status: 'pending' as const,
        },
      ];

      jest.mocked(AsyncStorage.getItem).mockResolvedValueOnce(JSON.stringify(mockQueue));

      const newHandler = new OfflineSyncQueueHandler();
      await newHandler.initialize();

      expect(newHandler.getQueueSize()).toBe(1);
    });
  });

  describe('enqueue', () => {
    it('アイチE��をキューに追加できる', async () => {
      const item: SyncQueueItem = {
        id: 'item-1',
        operation: 'create',
        entityType: 'quest',
        entityId: 'quest-1',
        payload: { title: 'New Quest' },
        createdAt: new Date(),
        retryCount: 0,
        lastError: null,
        status: 'pending',
      };

      jest.mocked(AsyncStorage.setItem).mockResolvedValueOnce();

      const itemId = await handler.enqueue(item);
      expect(itemId).toBe('item-1');
      expect(handler.getQueueSize()).toBe(1);
    });

    it('褁E��のアイチE��をキューに追加できる', async () => {
      jest.mocked(AsyncStorage.setItem).mockResolvedValue();

      for (let i = 0; i < 5; i++) {
        const item: SyncQueueItem = {
          id: `item-${i}`,
          operation: 'create',
          entityType: 'quest',
          entityId: `quest-${i}`,
          payload: {},
          createdAt: new Date(),
          retryCount: 0,
          lastError: null,
          status: 'pending',
        };

        await handler.enqueue(item);
      }

      expect(handler.getQueueSize()).toBe(5);
    });

    it('キューが満杯の場合はエラーを発生させる', async () => {
      // キューサイズを制限（テスト用）
      for (let i = 0; i < 1000; i++) {
        const item: SyncQueueItem = {
          id: `item-${i}`,
          operation: 'create',
          entityType: 'quest',
          entityId: `quest-${i}`,
          payload: {},
          createdAt: new Date(),
          retryCount: 0,
          lastError: null,
          status: 'pending',
        };

        try {
          jest.mocked(AsyncStorage.setItem).mockResolvedValueOnce();
          await handler.enqueue(item);
        } catch (error) {
          // 予期されたエラー
          break;
        }
      }

      // キューが満杯状慁E
      expect(handler.isQueueFull()).toBe(true);
    });
  });

  describe('dequeue', () => {
    it('キューからアイチE��を削除できる', async () => {
      const item: SyncQueueItem = {
        id: 'item-1',
        operation: 'create',
        entityType: 'quest',
        entityId: 'quest-1',
        payload: {},
        createdAt: new Date(),
        retryCount: 0,
        lastError: null,
        status: 'pending',
      };

      jest.mocked(AsyncStorage.setItem).mockResolvedValue();

      await handler.enqueue(item);
      const dequeued = await handler.dequeue('item-1');

      expect(dequeued?.id).toBe('item-1');
      expect(handler.getQueueSize()).toBe(0);
    });

    it('存在しなぁE��イチE��を削除しよぁE��するとnullを返す', async () => {
      const dequeued = await handler.dequeue('nonexistent');
      expect(dequeued).toBeNull();
    });
  });

  describe('queue operations', () => {
    it('キューのすべてのアイチE��を取得できる', async () => {
      jest.mocked(AsyncStorage.setItem).mockResolvedValue();

      const item1: SyncQueueItem = {
        id: 'item-1',
        operation: 'create',
        entityType: 'quest',
        entityId: 'quest-1',
        payload: {},
        createdAt: new Date(),
        retryCount: 0,
        lastError: null,
        status: 'pending',
      };

      const item2: SyncQueueItem = {
        id: 'item-2',
        operation: 'update',
        entityType: 'goal',
        entityId: 'goal-1',
        payload: {},
        createdAt: new Date(),
        retryCount: 0,
        lastError: null,
        status: 'pending',
      };

      await handler.enqueue(item1);
      await handler.enqueue(item2);

      const items = await handler.getAllQueuedItems();
      expect(items.length).toBe(2);
    });

    it('キューの先頭アイチE��をピークできる', async () => {
      jest.mocked(AsyncStorage.setItem).mockResolvedValue();

      const item: SyncQueueItem = {
        id: 'item-1',
        operation: 'create',
        entityType: 'quest',
        entityId: 'quest-1',
        payload: {},
        createdAt: new Date(),
        retryCount: 0,
        lastError: null,
        status: 'pending',
      };

      await handler.enqueue(item);
      const peeked = await handler.peekQueuedItem();

      expect(peeked?.id).toBe('item-1');
      expect(handler.getQueueSize()).toBe(1); // 削除されてぁE��ぁE
    });

    it('エンチE��チE��タイプでフィルタリングできる', async () => {
      jest.mocked(AsyncStorage.setItem).mockResolvedValue();

      const questItem: SyncQueueItem = {
        id: 'item-1',
        operation: 'create',
        entityType: 'quest',
        entityId: 'quest-1',
        payload: {},
        createdAt: new Date(),
        retryCount: 0,
        lastError: null,
        status: 'pending',
      };

      const goalItem: SyncQueueItem = {
        id: 'item-2',
        operation: 'create',
        entityType: 'goal',
        entityId: 'goal-1',
        payload: {},
        createdAt: new Date(),
        retryCount: 0,
        lastError: null,
        status: 'pending',
      };

      await handler.enqueue(questItem);
      await handler.enqueue(goalItem);

      const questItems = await handler.getItemsByEntityType('quest');
      expect(questItems.length).toBe(1);
      expect(questItems[0].id).toBe('item-1');
    });

    it('特定エンチE��チE��の操作を取得できる', async () => {
      jest.mocked(AsyncStorage.setItem).mockResolvedValue();

      const item1: SyncQueueItem = {
        id: 'item-1',
        operation: 'create',
        entityType: 'quest',
        entityId: 'quest-1',
        payload: {},
        createdAt: new Date(),
        retryCount: 0,
        lastError: null,
        status: 'pending',
      };

      const item2: SyncQueueItem = {
        id: 'item-2',
        operation: 'update',
        entityType: 'quest',
        entityId: 'quest-1',
        payload: {},
        createdAt: new Date(),
        retryCount: 0,
        lastError: null,
        status: 'pending',
      };

      const item3: SyncQueueItem = {
        id: 'item-3',
        operation: 'create',
        entityType: 'quest',
        entityId: 'quest-2',
        payload: {},
        createdAt: new Date(),
        retryCount: 0,
        lastError: null,
        status: 'pending',
      };

      await handler.enqueue(item1);
      await handler.enqueue(item2);
      await handler.enqueue(item3);

      const quest1Items = await handler.getItemsByEntity('quest', 'quest-1');
      expect(quest1Items.length).toBe(2);
    });
  });

  describe('queue statistics', () => {
    it('キューの統計を取得できる', async () => {
      jest.mocked(AsyncStorage.setItem).mockResolvedValue();

      const item: SyncQueueItem = {
        id: 'item-1',
        operation: 'create',
        entityType: 'quest',
        entityId: 'quest-1',
        payload: {},
        createdAt: new Date(),
        retryCount: 0,
        lastError: null,
        status: 'pending',
      };

      await handler.enqueue(item);

      const stats = await handler.getQueueStats();
      expect(stats.totalItems).toBe(1);
      expect(stats.pendingItems).toBe(1);
      expect(stats.failedItems).toBe(0);
    });
  });

  describe('queue clearing', () => {
    it('キューをクリアできる', async () => {
      jest.mocked(AsyncStorage.setItem).mockResolvedValue();
      jest.mocked(AsyncStorage.removeItem).mockResolvedValueOnce();

      const item: SyncQueueItem = {
        id: 'item-1',
        operation: 'create',
        entityType: 'quest',
        entityId: 'quest-1',
        payload: {},
        createdAt: new Date(),
        retryCount: 0,
        lastError: null,
        status: 'pending',
      };

      await handler.enqueue(item);
      expect(handler.getQueueSize()).toBe(1);

      await handler.clearQueue();
      expect(handler.getQueueSize()).toBe(0);
    });

    it('失敗したアイチE��をクリアできる', async () => {
      jest.mocked(AsyncStorage.setItem).mockResolvedValue();

      const pendingItem: SyncQueueItem = {
        id: 'pending-1',
        operation: 'create',
        entityType: 'quest',
        entityId: 'quest-1',
        payload: {},
        createdAt: new Date(),
        retryCount: 0,
        lastError: null,
        status: 'pending',
      };

      const failedItem: SyncQueueItem = {
        id: 'failed-1',
        operation: 'create',
        entityType: 'quest',
        entityId: 'quest-2',
        payload: {},
        createdAt: new Date(),
        retryCount: 3,
        lastError: 'Sync failed',
        status: 'failed',
      };

      await handler.enqueue(pendingItem);
      await handler.enqueue(failedItem);

      expect(handler.getQueueSize()).toBe(2);

      await handler.clearFailedItems();
      expect(handler.getQueueSize()).toBe(1);
    });
  });
});

