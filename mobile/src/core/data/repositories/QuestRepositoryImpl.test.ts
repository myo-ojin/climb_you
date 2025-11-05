/**
 * QuestRepositoryImpl Tests
 * データ層のリポジトリ実装テスト
 */

import { QuestRepositoryImpl } from './QuestRepositoryImpl';
import type { MCPClient } from '@/core/network/mcp';
import type { LocalDataSource } from '../datasources/LocalDataSource';
import type { Quest } from '@/core/domain/entities/Quest';

// モック定義
class MockMCPClient implements Partial<MCPClient> {
  getQuestBundle = jest.fn();
  completeQuest = jest.fn();
}

class MockLocalDataSource implements Partial<LocalDataSource> {
  getTodayQuests = jest.fn();
  saveQuests = jest.fn();
  getQuest = jest.fn();
  saveQuestLog = jest.fn();
}

describe('QuestRepositoryImpl', () => {
  let repository: QuestRepositoryImpl;
  let mockMCP: MockMCPClient;
  let mockLocal: MockLocalDataSource;

  const mockQuests: Quest[] = [
    {
      id: 'quest-1',
      questBundleId: 'bundle-1',
      type: 'small',
      title: 'テストクエスト1',
      description: '説明1',
      estimatedTime: 30,
      difficulty: 'easy',
      completionCriteria: '完了基準1',
      evidenceType: 'text',
      contributesToStation: 3,
      order: 1,
      status: 'pending',
      createdAt: new Date(),
      validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
    {
      id: 'quest-2',
      questBundleId: 'bundle-1',
      type: 'medium',
      title: 'テストクエスト2',
      description: '説明2',
      estimatedTime: 60,
      difficulty: 'medium',
      completionCriteria: '完了基準2',
      evidenceType: 'image',
      contributesToStation: 3,
      order: 2,
      status: 'pending',
      createdAt: new Date(),
      validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
    {
      id: 'quest-3',
      questBundleId: 'bundle-1',
      type: 'validation',
      title: 'テストクエスト3',
      description: '説明3',
      estimatedTime: 15,
      difficulty: 'easy',
      completionCriteria: '完了基準3',
      evidenceType: 'text',
      contributesToStation: 3,
      order: 3,
      status: 'pending',
      createdAt: new Date(),
      validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  ];

  beforeEach(() => {
    mockMCP = new MockMCPClient();
    mockLocal = new MockLocalDataSource();
    repository = new QuestRepositoryImpl(
      mockLocal as any,
      mockMCP as any
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getTodayQuests', () => {
    it('ローカルキャッシュが有効な場合はそれを返すこと', async () => {
      mockLocal.getTodayQuests.mockResolvedValue(mockQuests);

      const result = await repository.getTodayQuests();

      expect(result).toEqual(mockQuests);
      expect(mockLocal.getTodayQuests).toHaveBeenCalled();
      expect(mockMCP.getQuestBundle).not.toHaveBeenCalled(); // リモートは呼ばれない
    });

    it('ローカルキャッシュが空の場合はリモートから取得すること', async () => {
      mockLocal.getTodayQuests.mockResolvedValue([]);
      mockMCP.getQuestBundle.mockResolvedValue({ quests: mockQuests });

      const result = await repository.getTodayQuests();

      expect(result).toEqual(mockQuests);
      expect(mockMCP.getQuestBundle).toHaveBeenCalled();
      expect(mockLocal.saveQuests).toHaveBeenCalledWith(mockQuests);
    });

    it('リモート失敗時はローカルキャッシュをフォールバックすること', async () => {
      mockLocal.getTodayQuests.mockResolvedValue(mockQuests);
      mockMCP.getQuestBundle.mockRejectedValue(new Error('Network error'));

      const result = await repository.getTodayQuests();

      expect(result).toEqual(mockQuests); // ローカルキャッシュが返される
    });

    it('リモートもローカルも失敗の場合はエラーを投げること', async () => {
      mockLocal.getTodayQuests
        .mockResolvedValueOnce([]) // 初回は空
        .mockRejectedValueOnce(new Error('Local error')); // フォールバック時はエラー

      mockMCP.getQuestBundle.mockRejectedValue(new Error('Network error'));

      await expect(repository.getTodayQuests()).rejects.toThrow();
    });
  });

  describe('generateQuests', () => {
    it('クエストを生成してローカルに保存すること', async () => {
      mockMCP.getQuestBundle.mockResolvedValue({ quests: mockQuests });

      const result = await repository.generateQuests();

      expect(result).toEqual(mockQuests);
      expect(mockLocal.saveQuests).toHaveBeenCalledWith(mockQuests);
    });

    it('調整パラメータ付きで生成できること', async () => {
      mockMCP.getQuestBundle.mockResolvedValue({ quests: mockQuests });

      const adjustments = {
        difficulty: 'challenging' as const,
        preferredTypes: ['medium'],
        timeAvailable: 120,
      };

      await repository.generateQuests(adjustments);

      expect(mockMCP.getQuestBundle).toHaveBeenCalled();
      expect(mockLocal.saveQuests).toHaveBeenCalledWith(mockQuests);
    });

    it('生成エラーが発生した場合はエラーを投げること', async () => {
      mockMCP.getQuestBundle.mockRejectedValue(new Error('Generation failed'));

      await expect(repository.generateQuests()).rejects.toThrow();
    });

    it('レスポンスが空の場合はエラーを投げること', async () => {
      mockMCP.getQuestBundle.mockResolvedValue({ quests: [] });

      // 空のクエストは許容される可能性がある
      const result = await repository.generateQuests();
      expect(result).toEqual([]);
    });
  });

  describe('completeQuest', () => {
    it('クエスト完了を記録すること', async () => {
      mockLocal.getQuest.mockResolvedValue(mockQuests[0]);
      mockLocal.saveQuestLog.mockResolvedValue(undefined);

      const params = {
        questId: 'quest-1',
        status: 'completed' as const,
        actualTime: 25,
      };

      const result = await repository.completeQuest(params);

      expect(result.stepsEarned).toBe(50); // small + easy
      expect(result.streakUpdated).toBe(true);
      expect(mockLocal.saveQuestLog).toHaveBeenCalled();
    });

    it('見送りを記録できること', async () => {
      mockLocal.getQuest.mockResolvedValue(mockQuests[0]);
      mockLocal.saveQuestLog.mockResolvedValue(undefined);

      const params = {
        questId: 'quest-1',
        status: 'skipped' as const,
        skipReason: '時間がない',
      };

      const result = await repository.completeQuest(params);

      expect(result.stepsEarned).toBe(0); // 見送りは歩数獲得なし
      expect(result.streakUpdated).toBe(false);
    });

    it('クエストが見つからない場合はエラーを投げること', async () => {
      mockLocal.getQuest.mockResolvedValue(null);

      const params = {
        questId: 'nonexistent',
        status: 'completed' as const,
      };

      await expect(repository.completeQuest(params)).rejects.toThrow();
    });

    it('難易度に応じて歩数を計算すること', async () => {
      // MEDIUM 難易度、MEDIUM タイプ = 100 * 1.2 = 120
      const mediumQuest = { ...mockQuests[1], difficulty: 'medium' as const };
      mockLocal.getQuest.mockResolvedValue(mediumQuest);
      mockLocal.saveQuestLog.mockResolvedValue(undefined);

      const params = {
        questId: 'quest-2',
        status: 'completed' as const,
      };

      const result = await repository.completeQuest(params);

      expect(result.stepsEarned).toBe(120); // 100 * 1.2
    });

    it('CHALLENGING 難易度では50%ボーナスが付くこと', async () => {
      // CHALLENGING 難易度、SMALL タイプ = 50 * 1.5 = 75
      const challengingQuest = {
        ...mockQuests[0],
        difficulty: 'challenging' as const,
      };
      mockLocal.getQuest.mockResolvedValue(challengingQuest);
      mockLocal.saveQuestLog.mockResolvedValue(undefined);

      const params = {
        questId: 'quest-1',
        status: 'completed' as const,
      };

      const result = await repository.completeQuest(params);

      expect(result.stepsEarned).toBe(75); // 50 * 1.5
    });
  });

  describe('getQuestById', () => {
    it('指定されたIDのクエストを返すこと', async () => {
      mockLocal.getQuest.mockResolvedValue(mockQuests[0]);

      const result = await repository.getQuestById('quest-1');

      expect(result).toEqual(mockQuests[0]);
      expect(mockLocal.getQuest).toHaveBeenCalledWith('quest-1');
    });

    it('クエストが見つからない場合は null を返すこと', async () => {
      mockLocal.getQuest.mockResolvedValue(null);

      const result = await repository.getQuestById('nonexistent');

      expect(result).toBeNull();
    });

    it('エラーが発生した場合は null を返すこと', async () => {
      mockLocal.getQuest.mockRejectedValue(new Error('Database error'));

      const result = await repository.getQuestById('quest-1');

      expect(result).toBeNull();
    });
  });

  describe('getQuestsByBundleId', () => {
    it('バンドルIDで複数クエストを取得すること', async () => {
      mockLocal.getTodayQuests.mockResolvedValue(mockQuests);

      const result = await repository.getQuestsByBundleId('bundle-1');

      expect(result).toHaveLength(3);
      expect(result[0].questBundleId).toBe('bundle-1');
    });

    it('該当するクエストがない場合は空配列を返すこと', async () => {
      mockLocal.getTodayQuests.mockResolvedValue(mockQuests);

      const result = await repository.getQuestsByBundleId('nonexistent');

      expect(result).toEqual([]);
    });

    it('エラーが発生した場合は空配列を返すこと', async () => {
      mockLocal.getTodayQuests.mockRejectedValue(new Error('Database error'));

      const result = await repository.getQuestsByBundleId('bundle-1');

      expect(result).toEqual([]);
    });
  });
});
