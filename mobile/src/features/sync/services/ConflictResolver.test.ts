/**
 * ConflictResolver.test.ts
 * 競合解決機能のユニットテスト
 *
 * テスト対象:
 * - 競合の検出
 * - サーバー優先の競合解決
 * - ローカルデータのバックアップ
 * - 重要な競合の判定
 * - 競合統計の計算
 * - ログの記録と削除
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ConflictResolver,
  ConflictDetails,
  resetConflictResolver,
} from './ConflictResolver';

// モック
jest.mock('@react-native-async-storage/async-storage');

describe('ConflictResolver', () => {
  let resolver: ConflictResolver;

  beforeEach(async () => {
    resetConflictResolver();
    resolver = new ConflictResolver();
    vi.mocked(AsyncStorage.getItem).mockResolvedValue(null);
    vi.mocked(AsyncStorage.setItem).mockResolvedValue();
    vi.mocked(AsyncStorage.removeItem).mockResolvedValue();
    await resolver.initialize();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('detectConflict', () => {
    it('同じタイムスタンプの場合は競合を返さない', async () => {
      const now = new Date();
      const localData = {
        id: 'quest-1',
        title: 'Test Quest',
        updated_at: now.toISOString(),
      };
      const remoteData = {
        id: 'quest-1',
        title: 'Test Quest',
        updated_at: now.toISOString(),
      };

      const conflict = await resolver.detectConflict(
        'quest',
        'quest-1',
        localData,
        remoteData
      );

      expect(conflict).toBeNull();
    });

    it('データが異なる場合は競合を検出', async () => {
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

      const conflict = await resolver.detectConflict(
        'quest',
        'quest-1',
        localData,
        remoteData
      );

      expect(conflict).not.toBeNull();
      expect(conflict?.id).toBeTruthy();
      expect(conflict?.entityType).toBe('quest');
      expect(conflict?.resolution).toBe('unresolved');
    });

    it('目標の競合は重要とマークされる', async () => {
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

      const conflict = await resolver.detectConflict(
        'goal',
        'goal-1',
        localData,
        remoteData
      );

      expect(conflict?.isImportant).toBe(true);
      expect(conflict?.importanceReason).toContain('目標');
    });

    it('合目の競合は重要とマークされる', async () => {
      const localData = {
        id: 'milestone-1',
        station: 5,
        updated_at: new Date('2024-01-01').toISOString(),
      };
      const remoteData = {
        id: 'milestone-1',
        station: 6,
        updated_at: new Date('2024-01-02').toISOString(),
      };

      const conflict = await resolver.detectConflict(
        'milestone',
        'milestone-1',
        localData,
        remoteData
      );

      expect(conflict?.isImportant).toBe(true);
      expect(conflict?.importanceReason).toContain('合目');
    });

    it('ストリークの競合は重要とマークされる', async () => {
      const localData = {
        id: 'streak-1',
        count: 10,
        updated_at: new Date('2024-01-01').toISOString(),
      };
      const remoteData = {
        id: 'streak-1',
        count: 8,
        updated_at: new Date('2024-01-02').toISOString(),
      };

      const conflict = await resolver.detectConflict(
        'streak',
        'streak-1',
        localData,
        remoteData
      );

      expect(conflict?.isImportant).toBe(true);
    });

    it('quest_logのステータス競合は重要とマークされる', async () => {
      const localData = {
        id: 'log-1',
        status: 'completed',
        steps_earned: 100,
        updated_at: new Date('2024-01-01').toISOString(),
      };
      const remoteData = {
        id: 'log-1',
        status: 'skipped',
        steps_earned: 0,
        updated_at: new Date('2024-01-02').toISOString(),
      };

      const conflict = await resolver.detectConflict(
        'quest_log',
        'log-1',
        localData,
        remoteData
      );

      expect(conflict?.isImportant).toBe(true);
      expect(conflict?.importanceReason).toContain('ステータス');
    });
  });

  describe('resolveConflict', () => {
    it('サーバー優先でリモートデータを返す', async () => {
      const conflict: ConflictDetails = {
        id: 'conflict-1',
        timestamp: Date.now(),
        entityType: 'quest',
        entityId: 'quest-1',
        localVersion: { title: 'Local Quest' },
        remoteVersion: { title: 'Remote Quest' },
        localUpdatedAt: new Date('2024-01-01'),
        remoteUpdatedAt: new Date('2024-01-02'),
        resolutionStrategy: 'server_priority',
        resolution: 'unresolved',
        isImportant: false,
      };

      vi.mocked(AsyncStorage.setItem).mockResolvedValue();

      const resolved = await resolver.resolveConflict(conflict, 'server_priority');

      expect(resolved.title).toBe('Remote Quest');
      expect(conflict.resolution).toBe('resolved');
      expect(conflict.resolvedAt).toBeTruthy();
      expect(conflict.backupId).toBeTruthy();
    });

    it('ローカル優先でローカルデータを返す', async () => {
      const conflict: ConflictDetails = {
        id: 'conflict-1',
        timestamp: Date.now(),
        entityType: 'quest',
        entityId: 'quest-1',
        localVersion: { title: 'Local Quest' },
        remoteVersion: { title: 'Remote Quest' },
        localUpdatedAt: new Date('2024-01-01'),
        remoteUpdatedAt: new Date('2024-01-02'),
        resolutionStrategy: 'local_priority',
        resolution: 'unresolved',
        isImportant: false,
      };

      vi.mocked(AsyncStorage.setItem).mockResolvedValue();

      const resolved = await resolver.resolveConflict(conflict, 'local_priority');

      expect(resolved.title).toBe('Local Quest');
      expect(conflict.resolution).toBe('resolved');
    });
  });

  describe('markAsManualResolutionRequired', () => {
    it('手動解決が必要とマークできる', async () => {
      const conflict: ConflictDetails = {
        id: 'conflict-1',
        timestamp: Date.now(),
        entityType: 'goal',
        entityId: 'goal-1',
        localVersion: { title: 'Local Goal' },
        remoteVersion: { title: 'Remote Goal' },
        localUpdatedAt: new Date('2024-01-01'),
        remoteUpdatedAt: new Date('2024-01-02'),
        resolutionStrategy: 'server_priority',
        resolution: 'unresolved',
        isImportant: true,
      };

      vi.mocked(AsyncStorage.setItem).mockResolvedValue();

      await resolver.markAsManualResolutionRequired(
        conflict,
        '目標の本質が異なる'
      );

      expect(conflict.resolution).toBe('manual_required');
      expect(conflict.importanceReason).toBe('目標の本質が異なる');
    });
  });

  describe('conflict queries', () => {
    it('全競合を取得できる', async () => {
      const mockConflicts = [
        {
          id: 'conflict-1',
          timestamp: Date.now(),
          entityType: 'quest' as const,
          entityId: 'quest-1',
          localVersion: {},
          remoteVersion: {},
          localUpdatedAt: new Date(),
          remoteUpdatedAt: new Date(),
          resolutionStrategy: 'server_priority' as const,
          resolution: 'unresolved' as const,
          isImportant: false,
        },
        {
          id: 'conflict-2',
          timestamp: Date.now(),
          entityType: 'goal' as const,
          entityId: 'goal-1',
          localVersion: {},
          remoteVersion: {},
          localUpdatedAt: new Date(),
          remoteUpdatedAt: new Date(),
          resolutionStrategy: 'server_priority' as const,
          resolution: 'resolved' as const,
          isImportant: true,
        },
      ];

      vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(
        JSON.stringify(mockConflicts)
      );

      const conflicts = await resolver.getAllConflicts();
      expect(conflicts.length).toBe(2);
    });

    it('未解決の競合を取得できる', async () => {
      const mockConflicts = [
        {
          id: 'conflict-1',
          timestamp: Date.now(),
          entityType: 'quest' as const,
          entityId: 'quest-1',
          localVersion: {},
          remoteVersion: {},
          localUpdatedAt: new Date(),
          remoteUpdatedAt: new Date(),
          resolutionStrategy: 'server_priority' as const,
          resolution: 'unresolved' as const,
          isImportant: false,
        },
        {
          id: 'conflict-2',
          timestamp: Date.now(),
          entityType: 'goal' as const,
          entityId: 'goal-1',
          localVersion: {},
          remoteVersion: {},
          localUpdatedAt: new Date(),
          remoteUpdatedAt: new Date(),
          resolutionStrategy: 'server_priority' as const,
          resolution: 'resolved' as const,
          isImportant: false,
        },
      ];

      vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(
        JSON.stringify(mockConflicts)
      );

      const conflicts = await resolver.getUnresolvedConflicts();
      expect(conflicts.length).toBe(1);
      expect(conflicts[0].id).toBe('conflict-1');
    });

    it('エンティティタイプごとに競合を取得できる', async () => {
      const mockConflicts = [
        {
          id: 'conflict-1',
          timestamp: Date.now(),
          entityType: 'quest' as const,
          entityId: 'quest-1',
          localVersion: {},
          remoteVersion: {},
          localUpdatedAt: new Date(),
          remoteUpdatedAt: new Date(),
          resolutionStrategy: 'server_priority' as const,
          resolution: 'unresolved' as const,
          isImportant: false,
        },
        {
          id: 'conflict-2',
          timestamp: Date.now(),
          entityType: 'quest' as const,
          entityId: 'quest-2',
          localVersion: {},
          remoteVersion: {},
          localUpdatedAt: new Date(),
          remoteUpdatedAt: new Date(),
          resolutionStrategy: 'server_priority' as const,
          resolution: 'unresolved' as const,
          isImportant: false,
        },
        {
          id: 'conflict-3',
          timestamp: Date.now(),
          entityType: 'goal' as const,
          entityId: 'goal-1',
          localVersion: {},
          remoteVersion: {},
          localUpdatedAt: new Date(),
          remoteUpdatedAt: new Date(),
          resolutionStrategy: 'server_priority' as const,
          resolution: 'unresolved' as const,
          isImportant: false,
        },
      ];

      vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(
        JSON.stringify(mockConflicts)
      );

      const questConflicts = await resolver.getConflictsByEntityType('quest');
      expect(questConflicts.length).toBe(2);
    });

    it('重要な競合を取得できる', async () => {
      const mockConflicts = [
        {
          id: 'conflict-1',
          timestamp: Date.now(),
          entityType: 'quest' as const,
          entityId: 'quest-1',
          localVersion: {},
          remoteVersion: {},
          localUpdatedAt: new Date(),
          remoteUpdatedAt: new Date(),
          resolutionStrategy: 'server_priority' as const,
          resolution: 'unresolved' as const,
          isImportant: false,
        },
        {
          id: 'conflict-2',
          timestamp: Date.now(),
          entityType: 'goal' as const,
          entityId: 'goal-1',
          localVersion: {},
          remoteVersion: {},
          localUpdatedAt: new Date(),
          remoteUpdatedAt: new Date(),
          resolutionStrategy: 'server_priority' as const,
          resolution: 'unresolved' as const,
          isImportant: true,
        },
      ];

      vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(
        JSON.stringify(mockConflicts)
      );

      const importantConflicts = await resolver.getImportantConflicts();
      expect(importantConflicts.length).toBe(1);
      expect(importantConflicts[0].isImportant).toBe(true);
    });
  });

  describe('conflict statistics', () => {
    it('競合統計を計算できる', async () => {
      const mockConflicts = [
        {
          id: 'conflict-1',
          timestamp: Date.now(),
          entityType: 'quest' as const,
          entityId: 'quest-1',
          localVersion: {},
          remoteVersion: {},
          localUpdatedAt: new Date(),
          remoteUpdatedAt: new Date(),
          resolutionStrategy: 'server_priority' as const,
          resolution: 'resolved' as const,
          isImportant: false,
        },
        {
          id: 'conflict-2',
          timestamp: Date.now(),
          entityType: 'goal' as const,
          entityId: 'goal-1',
          localVersion: {},
          remoteVersion: {},
          localUpdatedAt: new Date(),
          remoteUpdatedAt: new Date(),
          resolutionStrategy: 'server_priority' as const,
          resolution: 'unresolved' as const,
          isImportant: false,
        },
      ];

      vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(
        JSON.stringify(mockConflicts)
      );

      const stats = await resolver.getConflictStatistics();

      expect(stats.totalConflicts).toBe(2);
      expect(stats.resolvedConflicts).toBe(1);
      expect(stats.unresolvedConflicts).toBe(1);
      expect(stats.resolutionRate).toBe(50);
      expect(stats.byEntityType.quest).toBe(1);
      expect(stats.byEntityType.goal).toBe(1);
    });
  });

  describe('clearing conflicts', () => {
    it('競合をクリアできる', async () => {
      vi.mocked(AsyncStorage.removeItem).mockResolvedValueOnce();

      await resolver.clearConflicts();

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(
        expect.stringContaining('conflicts')
      );
    });

    it('バックアップをクリアできる', async () => {
      vi.mocked(AsyncStorage.removeItem).mockResolvedValueOnce();

      await resolver.clearBackups();

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(
        expect.stringContaining('Backups')
      );
    });

    it('ログをクリアできる', async () => {
      vi.mocked(AsyncStorage.removeItem).mockResolvedValueOnce();

      await resolver.clearLogs();

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(
        expect.stringContaining('Logs')
      );
    });
  });

  describe('backup management', () => {
    it('バックアップを取得できる', async () => {
      const mockBackups = [
        {
          id: 'backup-1',
          conflictId: 'conflict-1',
          entityType: 'quest' as const,
          entityId: 'quest-1',
          localData: { title: 'Local Quest' },
          timestamp: Date.now(),
          expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
        },
      ];

      vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(
        JSON.stringify(mockBackups)
      );

      const backup = await resolver.getBackup('backup-1');

      expect(backup).not.toBeNull();
      expect(backup?.localData.title).toBe('Local Quest');
    });

    it('存在しないバックアップはnullを返す', async () => {
      vi.mocked(AsyncStorage.getItem).mockResolvedValueOnce(null);

      const backup = await resolver.getBackup('nonexistent');

      expect(backup).toBeNull();
    });
  });
});
