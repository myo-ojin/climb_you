/**
 * ConflictResolver
 * データ競合の検出と解決を管理するサービス
 *
 * 責務:
 * - データ競合の検出（updated_atタイムスタンプ比較）
 * - サーバー優先の競合解決
 * - 競合ログの記録
 * - ローカルデータのバックアップ
 * - 競合の分析とレポート
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  SyncConflict,
  EntityType,
} from '@/core/domain/entities/SyncQueue';

/**
 * データ競合の詳細情報
 */
export interface ConflictDetails {
  id: string;
  timestamp: number;
  entityType: EntityType;
  entityId: string;
  localVersion: Record<string, any>;
  remoteVersion: Record<string, any>;
  localUpdatedAt: Date;
  remoteUpdatedAt: Date;
  resolutionStrategy: 'server_priority' | 'local_priority' | 'manual';
  resolution: 'resolved' | 'unresolved' | 'manual_required';
  resolvedAt?: number;
  resolvedData?: Record<string, any>;
  backupId?: string;
  isImportant: boolean;
  importanceReason?: string;
}

/**
 * 競合のバックアップ
 */
export interface ConflictBackup {
  id: string;
  conflictId: string;
  entityType: EntityType;
  entityId: string;
  localData: Record<string, any>;
  timestamp: number;
  expiresAt: number; // 7日間後
}

/**
 * 競合統計
 */
export interface ConflictStatistics {
  totalConflicts: number;
  resolvedConflicts: number;
  unresolvedConflicts: number;
  manualResolutionRequiredCount: number;
  serverPriorityCount: number;
  localPriorityCount: number;
  byEntityType: Record<EntityType, number>;
  resolutionRate: number; // パーセンテージ
}

/**
 * ConflictResolver クラス
 */
export class ConflictResolver {
  // ストレージキー
  private readonly CONFLICTS_STORAGE_KEY = 'sync:conflicts';
  private readonly BACKUPS_STORAGE_KEY = 'sync:conflictBackups';
  private readonly CONFLICT_LOGS_STORAGE_KEY = 'sync:conflictLogs';
  private readonly BACKUP_RETENTION_DAYS = 7;
  private readonly CONFLICT_RETENTION_DAYS = 30;

  /**
   * 初期化
   */
  async initialize(): Promise<void> {
    try {
      // 古いバックアップを削除
      await this.cleanupExpiredBackups();

      // 古いログを削除
      await this.cleanupExpiredLogs();

      console.log('[ConflictResolver] Initialized');
    } catch (error) {
      console.error('[ConflictResolver] Initialization failed:', error);
    }
  }

  /**
   * データ競合を検出
   * updated_atタイムスタンプで比較
   */
  async detectConflict(
    entityType: EntityType,
    entityId: string,
    localData: Record<string, any>,
    remoteData: Record<string, any>
  ): Promise<ConflictDetails | null> {
    try {
      const localUpdatedAt = localData.updated_at
        ? new Date(localData.updated_at)
        : new Date(0);
      const remoteUpdatedAt = remoteData.updated_at
        ? new Date(remoteData.updated_at)
        : new Date(0);

      // タイムスタンプが同じ場合は競合ではない
      if (localUpdatedAt.getTime() === remoteUpdatedAt.getTime()) {
        return null;
      }

      // データが異なる場合は競合
      const isDataDifferent = JSON.stringify(localData) !== JSON.stringify(remoteData);
      if (!isDataDifferent) {
        return null;
      }

      // 競合を検出
      const conflictId = `conflict-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const isImportant = this.isImportantConflict(entityType, localData, remoteData);
      const importanceReason = isImportant
        ? this.getImportanceReason(entityType, localData, remoteData)
        : undefined;

      const conflict: ConflictDetails = {
        id: conflictId,
        timestamp: Date.now(),
        entityType,
        entityId,
        localVersion: localData,
        remoteVersion: remoteData,
        localUpdatedAt,
        remoteUpdatedAt,
        resolutionStrategy: 'server_priority',
        resolution: 'unresolved',
        isImportant,
        importanceReason,
      };

      console.log(
        `[ConflictResolver] Conflict detected: ${entityType}/${entityId} (${conflictId})`
      );

      return conflict;
    } catch (error) {
      console.error('[ConflictResolver] Conflict detection failed:', error);
      return null;
    }
  }

  /**
   * 競合を解決（サーバー優先）
   */
  async resolveConflict(
    conflict: ConflictDetails,
    strategy: 'server_priority' | 'local_priority' = 'server_priority'
  ): Promise<Record<string, any>> {
    try {
      // バックアップを作成
      const backup = await this.createBackup(conflict);
      conflict.backupId = backup.id;

      // 解決戦略に基づいて解決
      let resolvedData: Record<string, any>;

      if (strategy === 'server_priority') {
        // サーバーのデータを優先
        resolvedData = conflict.remoteVersion;
      } else {
        // ローカルのデータを優先
        resolvedData = conflict.localVersion;
      }

      // 競合を解決済みにマーク
      conflict.resolution = 'resolved';
      conflict.resolutionStrategy = strategy;
      conflict.resolvedAt = Date.now();
      conflict.resolvedData = resolvedData;

      // ログに記録
      await this.logConflict(conflict);

      console.log(
        `[ConflictResolver] Conflict resolved: ${conflict.id} (strategy: ${strategy})`
      );

      return resolvedData;
    } catch (error) {
      console.error('[ConflictResolver] Conflict resolution failed:', error);
      throw error;
    }
  }

  /**
   * 手動解決が必要な競合をマーク
   */
  async markAsManualResolutionRequired(
    conflict: ConflictDetails,
    reason: string
  ): Promise<void> {
    try {
      conflict.resolution = 'manual_required';
      conflict.importanceReason = reason;

      // ログに記録
      await this.logConflict(conflict);

      console.log(
        `[ConflictResolver] Manual resolution required: ${conflict.id} (${reason})`
      );
    } catch (error) {
      console.error('[ConflictResolver] Failed to mark as manual resolution:', error);
    }
  }

  /**
   * 全競合を取得
   */
  async getAllConflicts(): Promise<ConflictDetails[]> {
    try {
      const conflictsJson = await AsyncStorage.getItem(this.CONFLICTS_STORAGE_KEY);
      if (!conflictsJson) {
        return [];
      }

      const conflicts: ConflictDetails[] = JSON.parse(conflictsJson);
      return conflicts.map((c) => ({
        ...c,
        localUpdatedAt: new Date(c.localUpdatedAt),
        remoteUpdatedAt: new Date(c.remoteUpdatedAt),
      }));
    } catch (error) {
      console.error('[ConflictResolver] Failed to get all conflicts:', error);
      return [];
    }
  }

  /**
   * 未解決の競合を取得
   */
  async getUnresolvedConflicts(): Promise<ConflictDetails[]> {
    try {
      const conflicts = await this.getAllConflicts();
      return conflicts.filter((c) => c.resolution === 'unresolved');
    } catch (error) {
      console.error('[ConflictResolver] Failed to get unresolved conflicts:', error);
      return [];
    }
  }

  /**
   * エンティティタイプごとの競合を取得
   */
  async getConflictsByEntityType(entityType: EntityType): Promise<ConflictDetails[]> {
    try {
      const conflicts = await this.getAllConflicts();
      return conflicts.filter((c) => c.entityType === entityType);
    } catch (error) {
      console.error(
        '[ConflictResolver] Failed to get conflicts by entity type:',
        error
      );
      return [];
    }
  }

  /**
   * 重要な競合を取得
   */
  async getImportantConflicts(): Promise<ConflictDetails[]> {
    try {
      const conflicts = await this.getAllConflicts();
      return conflicts.filter((c) => c.isImportant);
    } catch (error) {
      console.error('[ConflictResolver] Failed to get important conflicts:', error);
      return [];
    }
  }

  /**
   * 競合のバックアップを取得
   */
  async getBackup(backupId: string): Promise<ConflictBackup | null> {
    try {
      const backupsJson = await AsyncStorage.getItem(this.BACKUPS_STORAGE_KEY);
      if (!backupsJson) {
        return null;
      }

      const backups: ConflictBackup[] = JSON.parse(backupsJson);
      return backups.find((b) => b.id === backupId) || null;
    } catch (error) {
      console.error('[ConflictResolver] Failed to get backup:', error);
      return null;
    }
  }

  /**
   * 競合統計を取得
   */
  async getConflictStatistics(): Promise<ConflictStatistics> {
    try {
      const conflicts = await this.getAllConflicts();

      const totalConflicts = conflicts.length;
      const resolvedConflicts = conflicts.filter((c) => c.resolution === 'resolved')
        .length;
      const unresolvedConflicts = conflicts.filter((c) => c.resolution === 'unresolved')
        .length;
      const manualResolutionRequiredCount = conflicts.filter(
        (c) => c.resolution === 'manual_required'
      ).length;

      const serverPriorityCount = conflicts.filter(
        (c) => c.resolutionStrategy === 'server_priority'
      ).length;
      const localPriorityCount = conflicts.filter(
        (c) => c.resolutionStrategy === 'local_priority'
      ).length;

      // エンティティタイプごとの競合数
      const byEntityType: Record<EntityType, number> = {
        goal: 0,
        milestone: 0,
        quest: 0,
        quest_log: 0,
        user_progress: 0,
        streak: 0,
      };

      for (const conflict of conflicts) {
        byEntityType[conflict.entityType]++;
      }

      const resolutionRate =
        totalConflicts > 0 ? (resolvedConflicts / totalConflicts) * 100 : 0;

      return {
        totalConflicts,
        resolvedConflicts,
        unresolvedConflicts,
        manualResolutionRequiredCount,
        serverPriorityCount,
        localPriorityCount,
        byEntityType,
        resolutionRate,
      };
    } catch (error) {
      console.error('[ConflictResolver] Failed to get statistics:', error);
      return {
        totalConflicts: 0,
        resolvedConflicts: 0,
        unresolvedConflicts: 0,
        manualResolutionRequiredCount: 0,
        serverPriorityCount: 0,
        localPriorityCount: 0,
        byEntityType: {
          goal: 0,
          milestone: 0,
          quest: 0,
          quest_log: 0,
          user_progress: 0,
          streak: 0,
        },
        resolutionRate: 0,
      };
    }
  }

  /**
   * 競合をクリア
   */
  async clearConflicts(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.CONFLICTS_STORAGE_KEY);
      console.log('[ConflictResolver] Conflicts cleared');
    } catch (error) {
      console.error('[ConflictResolver] Failed to clear conflicts:', error);
    }
  }

  /**
   * バックアップをクリア
   */
  async clearBackups(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.BACKUPS_STORAGE_KEY);
      console.log('[ConflictResolver] Backups cleared');
    } catch (error) {
      console.error('[ConflictResolver] Failed to clear backups:', error);
    }
  }

  /**
   * ログをクリア
   */
  async clearLogs(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.CONFLICT_LOGS_STORAGE_KEY);
      console.log('[ConflictResolver] Logs cleared');
    } catch (error) {
      console.error('[ConflictResolver] Failed to clear logs:', error);
    }
  }

  /**
   * バックアップを作成
   */
  private async createBackup(conflict: ConflictDetails): Promise<ConflictBackup> {
    try {
      const backupId = `backup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const now = Date.now();
      const expiresAt = now + this.BACKUP_RETENTION_DAYS * 24 * 60 * 60 * 1000;

      const backup: ConflictBackup = {
        id: backupId,
        conflictId: conflict.id,
        entityType: conflict.entityType,
        entityId: conflict.entityId,
        localData: conflict.localVersion,
        timestamp: now,
        expiresAt,
      };

      // バックアップを保存
      const backupsJson = await AsyncStorage.getItem(this.BACKUPS_STORAGE_KEY);
      const backups: ConflictBackup[] = backupsJson ? JSON.parse(backupsJson) : [];
      backups.push(backup);

      await AsyncStorage.setItem(this.BACKUPS_STORAGE_KEY, JSON.stringify(backups));

      console.log(`[ConflictResolver] Backup created: ${backupId}`);

      return backup;
    } catch (error) {
      console.error('[ConflictResolver] Failed to create backup:', error);
      throw error;
    }
  }

  /**
   * 競合をログに記録
   */
  private async logConflict(conflict: ConflictDetails): Promise<void> {
    try {
      const logsJson = await AsyncStorage.getItem(this.CONFLICT_LOGS_STORAGE_KEY);
      const logs: ConflictDetails[] = logsJson ? JSON.parse(logsJson) : [];

      logs.push(conflict);

      // 最新1000件のみ保持
      if (logs.length > 1000) {
        logs.splice(0, logs.length - 1000);
      }

      await AsyncStorage.setItem(this.CONFLICT_LOGS_STORAGE_KEY, JSON.stringify(logs));

      console.log(`[ConflictResolver] Conflict logged: ${conflict.id}`);
    } catch (error) {
      console.error('[ConflictResolver] Failed to log conflict:', error);
    }
  }

  /**
   * 重要な競合かどうかを判定
   */
  private isImportantConflict(
    entityType: EntityType,
    localData: Record<string, any>,
    remoteData: Record<string, any>
  ): boolean {
    // 以下のエンティティタイプの競合は重要
    if (entityType === 'goal' || entityType === 'milestone') {
      return true;
    }

    // quest_log の重要なフィールド（status など）の競合
    if (entityType === 'quest_log') {
      if (
        localData.status !== remoteData.status ||
        localData.steps_earned !== remoteData.steps_earned
      ) {
        return true;
      }
    }

    // streak 関連の競合は重要
    if (entityType === 'streak') {
      return true;
    }

    return false;
  }

  /**
   * 重要度の理由を取得
   */
  private getImportanceReason(
    entityType: EntityType,
    localData: Record<string, any>,
    remoteData: Record<string, any>
  ): string {
    if (entityType === 'goal') {
      return '目標の競合 - ユーザーの長期目標に関わる重要なデータです';
    }

    if (entityType === 'milestone') {
      return '合目の競合 - マイルストーン達成に関わる重要なデータです';
    }

    if (entityType === 'quest_log') {
      if (localData.status !== remoteData.status) {
        return 'クエストステータスの競合 - 完了記録に矛盾があります';
      }
      if (localData.steps_earned !== remoteData.steps_earned) {
        return '獲得歩数の競合 - ポイント計算に矛盾があります';
      }
    }

    if (entityType === 'streak') {
      return 'ストリークの競合 - ユーザーの継続記録に関わる重要なデータです';
    }

    return '重要な競合が検出されました';
  }

  /**
   * 期限切れのバックアップを削除
   */
  private async cleanupExpiredBackups(): Promise<void> {
    try {
      const backupsJson = await AsyncStorage.getItem(this.BACKUPS_STORAGE_KEY);
      if (!backupsJson) {
        return;
      }

      const backups: ConflictBackup[] = JSON.parse(backupsJson);
      const now = Date.now();
      const activeBackups = backups.filter((b) => b.expiresAt > now);

      if (activeBackups.length < backups.length) {
        const removedCount = backups.length - activeBackups.length;
        await AsyncStorage.setItem(
          this.BACKUPS_STORAGE_KEY,
          JSON.stringify(activeBackups)
        );
        console.log(`[ConflictResolver] ${removedCount} expired backups cleaned up`);
      }
    } catch (error) {
      console.error('[ConflictResolver] Failed to cleanup expired backups:', error);
    }
  }

  /**
   * 期限切れのログを削除
   */
  private async cleanupExpiredLogs(): Promise<void> {
    try {
      const logsJson = await AsyncStorage.getItem(this.CONFLICT_LOGS_STORAGE_KEY);
      if (!logsJson) {
        return;
      }

      const logs: ConflictDetails[] = JSON.parse(logsJson);
      const now = Date.now();
      const retentionMs = this.CONFLICT_RETENTION_DAYS * 24 * 60 * 60 * 1000;

      const activeLogs = logs.filter((log) => now - log.timestamp < retentionMs);

      if (activeLogs.length < logs.length) {
        const removedCount = logs.length - activeLogs.length;
        await AsyncStorage.setItem(this.CONFLICT_LOGS_STORAGE_KEY, JSON.stringify(activeLogs));
        console.log(`[ConflictResolver] ${removedCount} expired logs cleaned up`);
      }
    } catch (error) {
      console.error('[ConflictResolver] Failed to cleanup expired logs:', error);
    }
  }
}

/**
 * グローバル ConflictResolver インスタンス
 */
let globalConflictResolver: ConflictResolver | null = null;

/**
 * グローバル ConflictResolver インスタンス取得
 */
export async function getConflictResolver(): Promise<ConflictResolver> {
  if (!globalConflictResolver) {
    globalConflictResolver = new ConflictResolver();
    await globalConflictResolver.initialize();
  }
  return globalConflictResolver;
}

/**
 * グローバル ConflictResolver インスタンスリセット（テスト用）
 */
export function resetConflictResolver(): void {
  globalConflictResolver = null;
}
