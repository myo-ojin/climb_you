/**
 * RemoteDataSource.test.ts
 * RemoteDataSourceのユニットテスト
 */

import { RemoteDataSource } from '../RemoteDataSource';
import { MCPClient } from '@/core/network/mcp/MCPClient';

// MCPClientをモック
jest.mock('@/core/network/mcp/MCPClient');

describe('RemoteDataSource', () => {
  let remoteDataSource: RemoteDataSource;

  beforeEach(() => {
    // シングルトンをリセット
    RemoteDataSource.resetInstance();

    // RemoteDataSourceインスタンスを作成
    remoteDataSource = RemoteDataSource.getInstance({
      baseURL: 'http://localhost:3000',
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
    });

    // MCPClientのモックメソッドを設定
    const mockMCPClient = MCPClient as jest.MockedClass<typeof MCPClient>;
    mockMCPClient.prototype.healthCheck = jest.fn().mockResolvedValue({
      status: 'ok',
      version: '1.0.0',
    });
  });

  afterEach(() => {
    RemoteDataSource.resetInstance();
  });

  describe('getInstance', () => {
    it('シングルトンインスタンスを取得できる', () => {
      const instance1 = RemoteDataSource.getInstance({
        baseURL: 'http://localhost:3000',
      });
      const instance2 = RemoteDataSource.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('初回呼び出し時に設定が必要', () => {
      RemoteDataSource.resetInstance();

      expect(() => {
        RemoteDataSource.getInstance();
      }).toThrow('config is required');
    });
  });

  describe('initialize', () => {
    it('初期化できる', async () => {
      await expect(remoteDataSource.initialize()).resolves.not.toThrow();
    });

    it('二重初期化はスキップされる', async () => {
      await remoteDataSource.initialize();
      await expect(remoteDataSource.initialize()).resolves.not.toThrow();
    });
  });

  describe('upsertEntity', () => {
    it('エンティティを作成/更新できる', async () => {
      const result = await remoteDataSource.upsertEntity(
        'goal',
        'goal-123',
        { title: 'Test Goal' }
      );

      expect(result.success).toBe(true);
      expect(result.itemId).toBe('goal-123');
    });

    it('エラー時は失敗結果を返す', async () => {
      // モックでエラーを発生させる
      jest.spyOn(remoteDataSource as any, 'callEntityAPI').mockRejectedValue(
        new Error('Network error')
      );

      const result = await remoteDataSource.upsertEntity(
        'goal',
        'goal-123',
        { title: 'Test Goal' }
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });

  describe('deleteEntity', () => {
    it('エンティティを削除できる', async () => {
      const result = await remoteDataSource.deleteEntity('goal', 'goal-123');

      expect(result.success).toBe(true);
      expect(result.itemId).toBe('goal-123');
    });
  });

  describe('submitQuestStatus', () => {
    it('クエストステータスを送信できる', async () => {
      const mockMCPClient = MCPClient as jest.MockedClass<typeof MCPClient>;
      mockMCPClient.prototype.completeQuest = jest.fn().mockResolvedValue({
        log_id: 'log-123',
        status: 'completed',
        steps_earned: 100,
        streak_updated: true,
        current_streak: 5,
      });

      const result = await remoteDataSource.submitQuestStatus(
        'quest-123',
        'complete_quest',
        { userId: 'user-123' }
      );

      expect(result.success).toBe(true);
      expect(result.itemId).toBe('quest-123');
    });
  });

  describe('getChangedData', () => {
    it('リモート変更を取得できる', async () => {
      const changedData = await remoteDataSource.getChangedData(new Date());

      expect(changedData).toBeDefined();
      expect(changedData.goals).toBeDefined();
      expect(changedData.milestones).toBeDefined();
    });
  });

  describe('callTool', () => {
    it('目標分析ツールを呼び出せる', async () => {
      const mockMCPClient = MCPClient as jest.MockedClass<typeof MCPClient>;
      mockMCPClient.prototype.analyzeGoal = jest.fn().mockResolvedValue({
        goal_id: 'goal-123',
        smart_analysis: {},
        woop_analysis: {},
        difficulty_level: 'medium',
        estimated_duration_days: 90,
      });

      const result = await remoteDataSource.callTool('analyze_goal', {
        goalText: 'Test goal',
      });

      expect(result).toBeDefined();
      expect(result.goal_id).toBe('goal-123');
    });

    it('未知のツールはエラーを発生させる', async () => {
      await expect(
        remoteDataSource.callTool('unknown_tool', {})
      ).rejects.toThrow('Unknown tool');
    });
  });

  describe('clearCache', () => {
    it('キャッシュをクリアできる', () => {
      expect(() => remoteDataSource.clearCache()).not.toThrow();
    });
  });
});
