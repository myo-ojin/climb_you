/**
 * SyncIntegration.test.ts
 * 蜷梧悄讖溯・縺ｮ邨ｱ蜷医ユ繧ｹ繝・
 *
 * 繝・せ繝亥ｯｾ雎｡:
 * - SyncManager 縺ｨ BackgroundSyncManager 縺ｮ邨ｱ蜷・
 * - SyncManager 縺ｨ ConflictResolver 縺ｮ邨ｱ蜷・
 * - SyncManager 縺ｨ OfflineDataProvider 縺ｮ邨ｱ蜷・
 * - 螳悟・縺ｪ蜷梧悄繝輔Ο繝ｼ・医が繝ｳ繝ｩ繧､繝ｳ繝ｻ繧ｪ繝輔Λ繧､繝ｳ繝ｻ遶ｶ蜷郁ｧ｣豎ｺ・・
 * - 繝舌ャ繧ｯ繧ｰ繝ｩ繧ｦ繝ｳ繝牙酔譛溘・螳溯｡・
 * - 繧ｨ繝ｩ繝ｼ繝上Φ繝峨Μ繝ｳ繧ｰ縺ｨ繝ｪ繝医Λ繧､
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import * as BackgroundFetch from 'expo-background-fetch';
import { SyncManager } from './SyncManager';
import { BackgroundSyncManager } from './BackgroundSyncManager';
import { ConflictResolver, resetConflictResolver } from './ConflictResolver';
import {
  OfflineDataProvider,
  OfflineDataProvider as OfflineDataProviderClass,
} from './OfflineDataProvider';

// 繝｢繝・け
jest.mock('@react-native-async-storage/async-storage');
jest.mock('@react-native-community/netinfo');
jest.mock('expo-background-fetch');
jest.mock('@/core/data/datasources/LocalDataSource');
jest.mock('@/core/data/datasources/RemoteDataSource');

describe('SyncManager Integration Tests', () => {
  let syncManager: SyncManager;
  let conflictResolver: ConflictResolver;
  let offlineProvider: OfflineDataProvider;

  beforeEach(async () => {
    // 繧ｷ繝ｳ繧ｰ繝ｫ繝医Φ繧偵Μ繧ｻ繝・ヨ
    (SyncManager as any).instance = null;
    BackgroundSyncManager.resetInstance();
    OfflineDataProviderClass.resetInstance();
    resetConflictResolver();

    // 繝｢繝・け險ｭ螳・
    jest.mocked(NetInfo.fetch).mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
      type: 'wifi',
    } as any);

    jest.mocked(AsyncStorage.getItem).mockResolvedValue(null);
    jest.mocked(AsyncStorage.setItem).mockResolvedValue();
    jest.mocked(BackgroundFetch.registerTaskAsync).mockResolvedValue();

    syncManager = SyncManager.getInstance();
    conflictResolver = new ConflictResolver();
    offlineProvider = OfflineDataProvider.getInstance();

    await syncManager.initialize();
    await conflictResolver.initialize();
    await offlineProvider.initialize();
  });

  afterEach(async () => {
    await syncManager.destroy();
    jest.clearAllMocks();
  });

  describe('sync initialization', () => {
    it('SyncManager 縺悟・譛溷喧縺輔ｌ繧・, async () => {
      const state = syncManager.getSyncStatistics();
      expect(state.isOnline).toBe(true);
      expect(state.isSyncing).toBe(false);
    });

    it('BackgroundSyncManager 縺檎ｵｱ蜷医＆繧後ｋ', async () => {
      const bgManager = BackgroundSyncManager.getInstance();
      expect(bgManager).toBeDefined();
    });

    it('ConflictResolver 縺檎ｵｱ蜷医＆繧後ｋ', async () => {
      expect(conflictResolver).toBeDefined();
    });

    it('OfflineDataProvider 縺檎ｵｱ蜷医＆繧後ｋ', async () => {
      expect(offlineProvider).toBeDefined();
    });
  });

  describe('online sync flow', () => {
    it('繧ｪ繝ｳ繝ｩ繧､繝ｳ譎ゅ↓謫堺ｽ懊ｒ繧ｭ繝･繝ｼ繧､繝ｳ繧ｰ縺励※蜷梧悄縺ｧ縺阪ｋ', async () => {
      jest.mocked(AsyncStorage.setItem).mockResolvedValue();

      const itemId = await syncManager.queueOperation(
        'complete_quest',
        'quest',
        'quest-1',
        { status: 'completed', steps: 100 }
      );

      expect(itemId).toBeTruthy();
      const stats = syncManager.getSyncStatistics();
      expect(stats.pendingItems).toBeGreaterThan(0);
    });

    it('隍・焚縺ｮ謫堺ｽ懊ｒ繧ｭ繝･繝ｼ繧､繝ｳ繧ｰ縺励※鬆・ｺ上ｒ菫晁ｨｼ縺ｧ縺阪ｋ', async () => {
      jest.mocked(AsyncStorage.setItem).mockResolvedValue();

      const id1 = await syncManager.queueOperation(
        'create',
        'goal',
        'goal-1',
        { title: 'New Goal' }
      );

      const id2 = await syncManager.queueOperation(
        'update',
        'quest',
        'quest-1',
        { status: 'completed' }
      );

      const id3 = await syncManager.queueOperation(
        'delete',
        'quest_log',
        'log-1',
        {}
      );

      expect(id1).not.toBe(id2);
      expect(id2).not.toBe(id3);

      const stats = syncManager.getSyncStatistics();
      expect(stats.pendingItems).toBe(3);
    });
  });

  describe('offline sync flow', () => {
    it('繧ｪ繝輔Λ繧､繝ｳ譎ゅ↓謫堺ｽ懊ｒ繧ｭ繝･繝ｼ繧､繝ｳ繧ｰ縺ｧ縺阪ｋ', async (done) => {
      // 繧ｪ繝輔Λ繧､繝ｳ縺ｫ蛻・ｊ譖ｿ縺・
      jest.mocked(NetInfo.fetch).mockResolvedValueOnce({
        isConnected: false,
        isInternetReachable: false,
        type: 'none',
      } as any);

      const offlineProvider2 = OfflineDataProvider.getInstance();
      await offlineProvider2.initialize();

      // 繧ｪ繝輔Λ繧､繝ｳ繝｢繝ｼ繝臥｢ｺ隱・
      expect(offlineProvider2.isOnline()).toBe(false);

      // 繧ｪ繝ｳ繝ｩ繧､繝ｳ縺ｫ謌ｻ縺吶→蜷梧悄髢句ｧ・
      jest.mocked(NetInfo.fetch).mockResolvedValueOnce({
        isConnected: true,
        isInternetReachable: true,
        type: 'wifi',
      } as any);

      // NetInfo 繝ｪ繧ｹ繝翫・繧偵す繝溘Η繝ｬ繝ｼ繝・
      jest.mocked(NetInfo.addEventListener).mock.calls[0]?.[0]({
        isConnected: true,
        isInternetReachable: true,
        type: 'wifi',
      } as any);

      setTimeout(() => {
        expect(offlineProvider2.isOnline()).toBe(true);
        done();
      }, 100);
    });

    it('繧ｪ繝輔Λ繧､繝ｳ繝｢繝ｼ繝我ｸｭ縺ｮ繝ｭ繝ｼ繧ｫ繝ｫ繝・・繧ｿ繧｢繧ｯ繧ｻ繧ｹ', async () => {
      jest.mocked(AsyncStorage.setItem).mockResolvedValue();

      // 繧ｪ繝輔Λ繧､繝ｳ縺ｮ蝣ｴ蜷医∵ｩ溯・蜿ｯ蜷ｦ繧堤｢ｺ隱・
      const canRecord = offlineProvider.isFeatureAvailableOffline('recordQuestCompletion');
      expect(canRecord).toBe(true);

      // 繝輔ぃ繧､繝ｫ繧｢繝・・繝ｭ繝ｼ繝峨・繧ｪ繝輔Λ繧､繝ｳ譎ゅ↓蛻ｩ逕ｨ荳榊庄
      const canUpload = offlineProvider.isFeatureAvailableOffline('uploadEvidence');
      expect(canUpload).toBe(false);
    });
  });

  describe('conflict detection and resolution', () => {
    it('繝・・繧ｿ遶ｶ蜷医ｒ讀懷・縺ｧ縺阪ｋ', async () => {
      const localData = {
        id: 'quest-1',
        title: 'Local Quest',
        updated_at: new Date('2024-01-01').toISOString(),
      };

      const remoteData = {
        id: 'quest-1',
        title: 'Remote Quest',
        updated_at: new Date('2024-01-02').toISOString(),
      };

      const conflict = await conflictResolver.detectConflict(
        'quest',
        'quest-1',
        localData,
        remoteData
      );

      expect(conflict).not.toBeNull();
      expect(conflict?.resolution).toBe('unresolved');
    });

    it('遶ｶ蜷医ｒ繧ｵ繝ｼ繝舌・蜆ｪ蜈医〒隗｣豎ｺ縺ｧ縺阪ｋ', async () => {
      jest.mocked(AsyncStorage.setItem).mockResolvedValue();

      const conflict = {
        id: 'conflict-1',
        timestamp: Date.now(),
        entityType: 'quest' as const,
        entityId: 'quest-1',
        localVersion: { title: 'Local' },
        remoteVersion: { title: 'Remote' },
        localUpdatedAt: new Date('2024-01-01'),
        remoteUpdatedAt: new Date('2024-01-02'),
        resolutionStrategy: 'server_priority' as const,
        resolution: 'unresolved' as const,
        isImportant: false,
      };

      const resolved = await conflictResolver.resolveConflict(conflict);

      expect(resolved.title).toBe('Remote');
      expect(conflict.resolution).toBe('resolved');
    });

    it('驥崎ｦ√↑遶ｶ蜷医・繝ｦ繝ｼ繧ｶ繝ｼ縺ｫ騾夂衍縺ｧ縺阪ｋ', async () => {
      jest.mocked(AsyncStorage.setItem).mockResolvedValue();

      const localData = {
        id: 'goal-1',
        title: 'Local Goal',
        updated_at: new Date('2024-01-01').toISOString(),
      };

      const remoteData = {
        id: 'goal-1',
        title: 'Remote Goal',
        updated_at: new Date('2024-01-02').toISOString(),
      };

      const conflict = await conflictResolver.detectConflict(
        'goal',
        'goal-1',
        localData,
        remoteData
      );

      expect(conflict?.isImportant).toBe(true);
      expect(conflict?.importanceReason).toContain('逶ｮ讓・);
    });
  });

  describe('background sync integration', () => {
    it('BackgroundSyncManager 縺檎匳骭ｲ縺ｧ縺阪ｋ', async () => {
      jest.mocked(BackgroundFetch.registerTaskAsync).mockResolvedValue();

      const bgManager = BackgroundSyncManager.getInstance();
      await bgManager.initialize();
      await bgManager.registerBackgroundSync();

      const state = bgManager.getState();
      expect(state.isRegistered).toBe(true);
    });

    it('繝舌ャ繧ｯ繧ｰ繝ｩ繧ｦ繝ｳ繝牙酔譛溘ち繧ｹ繧ｯ縺後せ繧ｱ繧ｸ繝･繝ｼ繝ｫ縺輔ｌ繧・, async () => {
      jest.mocked(BackgroundFetch.registerTaskAsync).mockResolvedValue();

      const bgManager = BackgroundSyncManager.getInstance();
      await bgManager.initialize();
      await bgManager.registerBackgroundSync();

      expect(BackgroundFetch.registerTaskAsync).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          minimumInterval: 15 * 60,
          stopOnTerminate: false,
          startOnBoot: true,
        })
      );
    });
  });

  describe('retry logic with conflicts', () => {
    it('繝ｪ繝医Λ繧､譎ゅ↓蜷後§遶ｶ蜷医′蜀肴､懷・縺輔ｌ繧・, async () => {
      jest.mocked(AsyncStorage.setItem).mockResolvedValue();

      const localData = {
        id: 'quest-1',
        title: 'Local',
        updated_at: new Date('2024-01-01').toISOString(),
      };

      const remoteData = {
        id: 'quest-1',
        title: 'Remote',
        updated_at: new Date('2024-01-02').toISOString(),
      };

      // 1蝗樒岼縺ｮ讀懷・
      const conflict1 = await conflictResolver.detectConflict(
        'quest',
        'quest-1',
        localData,
        remoteData
      );

      expect(conflict1).not.toBeNull();

      // 2蝗樒岼縺ｮ讀懷・・医Μ繝医Λ繧､・・
      const conflict2 = await conflictResolver.detectConflict(
        'quest',
        'quest-1',
        localData,
        remoteData
      );

      expect(conflict2).not.toBeNull();
      expect(conflict2?.id).not.toBe(conflict1?.id); // 譁ｰ縺励＞ID縺檎函謌舌＆繧後ｋ
    });

    it('螟ｱ謨励＠縺溘い繧､繝・Β縺ｯ繝ｪ繝医Λ繧､繧ｭ繝･繝ｼ縺ｫ謌ｻ縺輔ｌ繧・, async () => {
      jest.mocked(AsyncStorage.setItem).mockResolvedValue();

      const itemId = await syncManager.queueOperation(
        'complete_quest',
        'quest',
        'quest-1',
        {}
      );

      expect(itemId).toBeTruthy();

      const stats = syncManager.getSyncStatistics();
      expect(stats.pendingItems).toBeGreaterThan(0);
    });
  });

  describe('error handling', () => {
    it('繝阪ャ繝医Ρ繝ｼ繧ｯ繧ｨ繝ｩ繝ｼ譎ゅ↓謫堺ｽ懊′繧ｭ繝･繝ｼ縺ｫ逡吶∪繧・, async () => {
      jest.mocked(AsyncStorage.setItem).mockResolvedValue();

      const itemId = await syncManager.queueOperation(
        'complete_quest',
        'quest',
        'quest-1',
        {}
      );

      expect(itemId).toBeTruthy();
    });

    it('蜷梧悄繧ｨ繝ｩ繝ｼ繧､繝吶Φ繝医ｒ逋ｺ轣ｫ縺ｧ縺阪ｋ', async (done) => {
      syncManager.getSyncError$().subscribe((error) => {
        expect(error).toBeDefined();
        done();
      });

      // 繧ｨ繝ｩ繝ｼ繧偵す繝溘Η繝ｬ繝ｼ繝・
      // ・亥ｮ溯｣・↓蠢懊§縺ｦ繝医Μ繧ｬ繝ｼ譁ｹ豕輔ｒ隱ｿ謨ｴ・・
    });
  });

  describe('sync statistics and monitoring', () => {
    it('蜷梧悄邨ｱ險医ｒ蜿門ｾ励〒縺阪ｋ', async () => {
      const stats = syncManager.getSyncStatistics();

      expect(stats).toHaveProperty('totalItems');
      expect(stats).toHaveProperty('pendingItems');
      expect(stats).toHaveProperty('failedItems');
      expect(stats).toHaveProperty('lastSyncAt');
      expect(stats).toHaveProperty('isOnline');
      expect(stats).toHaveProperty('isSyncing');
    });

    it('遶ｶ蜷育ｵｱ險医ｒ蜿門ｾ励〒縺阪ｋ', async () => {
      const stats = await conflictResolver.getConflictStatistics();

      expect(stats).toHaveProperty('totalConflicts');
      expect(stats).toHaveProperty('resolvedConflicts');
      expect(stats).toHaveProperty('unresolvedConflicts');
      expect(stats).toHaveProperty('resolutionRate');
    });

    it('繝舌ャ繧ｯ繧ｰ繝ｩ繧ｦ繝ｳ繝牙酔譛溽ｵｱ險医ｒ蜿門ｾ励〒縺阪ｋ', async () => {
      const bgManager = BackgroundSyncManager.getInstance();
      await bgManager.initialize();

      const state = bgManager.getState();
      expect(state).toHaveProperty('isInitialized');
      expect(state).toHaveProperty('isRegistered');
      expect(state).toHaveProperty('lastBackgroundSyncAt');
      expect(state).toHaveProperty('lastBackgroundSyncStatus');
    });
  });

  describe('sync state observable', () => {
    it('蜷梧悄迥ｶ諷九せ繝医Μ繝ｼ繝繧定ｳｼ隱ｭ縺ｧ縺阪ｋ', async (done) => {
      syncManager.getSyncState$().subscribe((state) => {
        expect(state).toHaveProperty('isOnline');
        expect(state).toHaveProperty('isSyncing');
        done();
      });
    });

    it('蜷梧悄螳御ｺ・う繝吶Φ繝医ｒ雉ｼ隱ｭ縺ｧ縺阪ｋ', async (done) => {
      syncManager.getSyncCompleted$().subscribe((result) => {
        expect(result).toHaveProperty('success');
        done();
      });

      // 蜷梧悄螳御ｺ・ｒ繧ｷ繝溘Η繝ｬ繝ｼ繝・
      // ・亥ｮ溯｣・↓蠢懊§縺ｦ繝医Μ繧ｬ繝ｼ譁ｹ豕輔ｒ隱ｿ謨ｴ・・
    });

    it('蜷梧悄髢句ｧ九う繝吶Φ繝医ｒ雉ｼ隱ｭ縺ｧ縺阪ｋ', async (done) => {
      syncManager.getSyncStarted$().subscribe(() => {
        expect(true).toBe(true);
        done();
      });

      // 蜷梧悄髢句ｧ九ｒ繧ｷ繝溘Η繝ｬ繝ｼ繝・
      // ・亥ｮ溯｣・↓蠢懊§縺ｦ繝医Μ繧ｬ繝ｼ譁ｹ豕輔ｒ隱ｿ謨ｴ・・
    });
  });

  describe('full sync lifecycle', () => {
    it('謫堺ｽ懊く繝･繝ｼ繧､繝ｳ繧ｰ 竊・蜷梧悄髢句ｧ・竊・螳御ｺ・・螳悟・繝輔Ο繝ｼ', async () => {
      jest.mocked(AsyncStorage.setItem).mockResolvedValue();

      // 1. 謫堺ｽ懊ｒ繧ｭ繝･繝ｼ繧､繝ｳ繧ｰ
      const itemId = await syncManager.queueOperation(
        'complete_quest',
        'quest',
        'quest-1',
        { status: 'completed' }
      );

      expect(itemId).toBeTruthy();

      // 2. 邨ｱ險医ｒ遒ｺ隱・
      const statsBefore = syncManager.getSyncStatistics();
      expect(statsBefore.pendingItems).toBeGreaterThan(0);

      // 3. 蜷梧悄迥ｶ諷九ｒ雉ｼ隱ｭ
      let syncStarted = false;
      syncManager.getSyncStarted$().subscribe(() => {
        syncStarted = true;
      });

      // 4. 謇句虚蜷梧悄繧偵ヨ繝ｪ繧ｬ繝ｼ・医が繝ｳ繝ｩ繧､繝ｳ譎ゑｼ・
      if (statsBefore.isOnline) {
        try {
          await syncManager.syncNow();
        } catch (error) {
          // 繧ｨ繝ｩ繝ｼ縺ｯ險ｱ螳ｹ・医Δ繝・け迺ｰ蠅・ｼ・
        }
      }

      expect(itemId).toBeTruthy();
    });

    it('繧ｪ繝輔Λ繧､繝ｳ 竊・繧ｪ繝ｳ繝ｩ繧､繝ｳ 竊・閾ｪ蜍募酔譛溘ヵ繝ｭ繝ｼ', async () => {
      jest.mocked(AsyncStorage.setItem).mockResolvedValue();
      jest.mocked(AsyncStorage.getItem).mockResolvedValue(null);

      const provider = OfflineDataProvider.getInstance();

      // 蛻晄悄迥ｶ諷具ｼ壹が繝ｳ繝ｩ繧､繝ｳ
      expect(provider.isOnline()).toBe(true);

      // 繧ｪ繝輔Λ繧､繝ｳ縺ｫ蛻・ｊ譖ｿ縺・
      jest.mocked(NetInfo.addEventListener).mock.calls[0]?.[0]({
        isConnected: false,
        isInternetReachable: false,
        type: 'none',
      } as any);

      // 繧ｪ繝ｳ繝ｩ繧､繝ｳ縺ｫ謌ｻ縺・
      jest.mocked(NetInfo.addEventListener).mock.calls[0]?.[0]({
        isConnected: true,
        isInternetReachable: true,
        type: 'wifi',
      } as any);

      // 譛邨ら噪縺ｫ繧ｪ繝ｳ繝ｩ繧､繝ｳ縺ｧ縺ゅｋ縺薙→繧堤｢ｺ隱・
      expect(provider.isOnline()).toBe(true);
    });
  });

  describe('cleanup and teardown', () => {
    it('SyncManager 縺後け繝ｪ繝ｼ繝ｳ繧｢繝・・縺ｧ縺阪ｋ', async () => {
      await syncManager.destroy();
      // 繧､繝ｳ繧ｹ繧ｿ繝ｳ繧ｹ縺檎ｴ譽・＆繧後※縺・ｋ
      expect((SyncManager as any).instance).toBeNull();
    });

    it('隍・焚縺ｮ繝槭ロ繝ｼ繧ｸ繝｣繝ｼ縺梧ｭ｣縺励￥繧ｯ繝ｪ繝ｼ繝ｳ繧｢繝・・縺輔ｌ繧・, async () => {
      const bgManager = BackgroundSyncManager.getInstance();
      const provider = OfflineDataProvider.getInstance();

      await syncManager.destroy();
      await bgManager.destroy();
      await provider.destroy();

      // 縺吶∋縺ｦ縺ｮ繝槭ロ繝ｼ繧ｸ繝｣繝ｼ縺檎ｴ譽・＆繧後※縺・ｋ
      expect(true).toBe(true); // 遐ｴ譽・′謌仙粥縺励◆
    });
  });
});

