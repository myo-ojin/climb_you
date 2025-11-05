/**
 * QuestUseCase Tests
 * ビジネスロジック層のユニットテスト
 */

import { QuestUseCase } from './QuestUseCase';
import type { QuestRepository } from '../repositories/QuestRepository';
import type { Quest } from '../entities/Quest';

// QuestRepository のモック
class MockQuestRepository implements QuestRepository {
  getTodayQuests = jest.fn();
  generateQuests = jest.fn();
  completeQuest = jest.fn();
  getQuestById = jest.fn();
  getQuestsByBundleId = jest.fn();
}

describe('QuestUseCase', () => {
  let useCase: QuestUseCase;
  let mockRepository: MockQuestRepository;

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
    mockRepository = new MockQuestRepository();
    useCase = new QuestUseCase(mockRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getTodayQuests', () => {
    it('リポジトリから取得したクエストを返すこと', async () => {
      mockRepository.getTodayQuests.mockResolvedValue(mockQuests);

      const result = await useCase.getTodayQuests();

      expect(result).toHaveLength(3);
      expect(result[0].id).toBe('quest-1');
      expect(result[1].id).toBe('quest-2');
      expect(result[2].id).toBe('quest-3');
      expect(mockRepository.getTodayQuests).toHaveBeenCalled();
    });

    it('order でソートされたクエストを返すこと', async () => {
      // order がバラバラのクエスト
      const unsortedQuests: Quest[] = [
        { ...mockQuests[2], order: 3 },
        { ...mockQuests[0], order: 1 },
        { ...mockQuests[1], order: 2 },
      ];

      mockRepository.getTodayQuests.mockResolvedValue(unsortedQuests);

      const result = await useCase.getTodayQuests();

      expect(result[0].order).toBe(1);
      expect(result[1].order).toBe(2);
      expect(result[2].order).toBe(3);
    });

    it('クエストが0件の場合は空配列を返すこと', async () => {
      mockRepository.getTodayQuests.mockResolvedValue([]);

      const result = await useCase.getTodayQuests();

      expect(result).toEqual([]);
    });

    it('エラーが発生した場合はエラーを投げること', async () => {
      const error = new Error('Network error');
      mockRepository.getTodayQuests.mockRejectedValue(error);

      await expect(useCase.getTodayQuests()).rejects.toThrow('Network error');
    });
  });

  describe('generateQuests', () => {
    it('調整パラメータなしでクエストを生成すること', async () => {
      mockRepository.generateQuests.mockResolvedValue(mockQuests);

      const result = await useCase.generateQuests();

      expect(result).toHaveLength(3);
      expect(mockRepository.generateQuests).toHaveBeenCalledWith(undefined);
    });

    it('調整パラメータ付きでクエストを生成すること', async () => {
      mockRepository.generateQuests.mockResolvedValue(mockQuests);

      const adjustments = {
        difficulty: 'hard' as any,
        preferredTypes: ['medium'],
        timeAvailable: 120,
      };

      await useCase.generateQuests(adjustments);

      expect(mockRepository.generateQuests).toHaveBeenCalledWith(adjustments);
    });

    it('生成エラーが発生した場合はエラーを投げること', async () => {
      const error = new Error('Generation failed');
      mockRepository.generateQuests.mockRejectedValue(error);

      await expect(useCase.generateQuests()).rejects.toThrow('Generation failed');
    });
  });

  describe('completeQuest', () => {
    it('クエスト完了パラメータでクエストを完了記録すること', async () => {
      const mockResult = {
        questLog: {
          id: 'log-1',
          questId: 'quest-1',
          userId: 'user-1',
          status: 'completed' as const,
          actualTime: 25,
          stepsEarned: 50,
          createdAt: new Date(),
          isSynced: false,
        },
        stepsEarned: 50,
        streakUpdated: true,
        achievements: [],
      };

      mockRepository.completeQuest.mockResolvedValue(mockResult);

      const params = {
        questId: 'quest-1',
        status: 'completed' as const,
        actualTime: 25,
      };

      const result = await useCase.completeQuest(params);

      expect(result.stepsEarned).toBe(50);
      expect(result.streakUpdated).toBe(true);
      expect(mockRepository.completeQuest).toHaveBeenCalledWith(params);
    });

    it('見送り記録ができること', async () => {
      const mockResult = {
        questLog: {
          id: 'log-1',
          questId: 'quest-1',
          userId: 'user-1',
          status: 'skipped' as const,
          skipReason: '時間がない',
          stepsEarned: 0,
          createdAt: new Date(),
          isSynced: false,
        },
        stepsEarned: 0,
        streakUpdated: false,
      };

      mockRepository.completeQuest.mockResolvedValue(mockResult);

      const params = {
        questId: 'quest-1',
        status: 'skipped' as const,
        skipReason: '時間がない',
      };

      await useCase.completeQuest(params);

      expect(mockRepository.completeQuest).toHaveBeenCalledWith(params);
    });

    it('完了エラーが発生した場合はエラーを投げること', async () => {
      const error = new Error('Complete failed');
      mockRepository.completeQuest.mockRejectedValue(error);

      const params = {
        questId: 'quest-1',
        status: 'completed' as const,
      };

      await expect(useCase.completeQuest(params)).rejects.toThrow('Complete failed');
    });
  });

  describe('getQuestById', () => {
    it('指定されたIDのクエストを返すこと', async () => {
      mockRepository.getQuestById.mockResolvedValue(mockQuests[0]);

      const result = await useCase.getQuestById('quest-1');

      expect(result).toEqual(mockQuests[0]);
      expect(mockRepository.getQuestById).toHaveBeenCalledWith('quest-1');
    });

    it('クエストが見つからない場合は null を返すこと', async () => {
      mockRepository.getQuestById.mockResolvedValue(null);

      const result = await useCase.getQuestById('nonexistent');

      expect(result).toBeNull();
    });

    it('エラーが発生した場合はエラーを投げること', async () => {
      const error = new Error('Database error');
      mockRepository.getQuestById.mockRejectedValue(error);

      await expect(useCase.getQuestById('quest-1')).rejects.toThrow('Database error');
    });
  });

  describe('getQuestsByBundleId', () => {
    it('指定されたバンドルIDのクエスト一覧を返すこと', async () => {
      mockRepository.getQuestsByBundleId.mockResolvedValue(mockQuests);

      const result = await useCase.getQuestsByBundleId('bundle-1');

      expect(result).toHaveLength(3);
      expect(mockRepository.getQuestsByBundleId).toHaveBeenCalledWith('bundle-1');
    });

    it('バンドルに該当するクエストがない場合は空配列を返すこと', async () => {
      mockRepository.getQuestsByBundleId.mockResolvedValue([]);

      const result = await useCase.getQuestsByBundleId('nonexistent');

      expect(result).toEqual([]);
    });
  });

  describe('isQuestValid', () => {
    it('有効なクエストは true を返すこと', () => {
      const result = useCase.isQuestValid(mockQuests[0]);

      expect(result).toBe(true);
    });

    it('有効期限切れのクエストは false を返すこと', () => {
      const expiredQuest = {
        ...mockQuests[0],
        validUntil: new Date(Date.now() - 1000), // 過去
      };

      const result = useCase.isQuestValid(expiredQuest);

      expect(result).toBe(false);
    });

    it('必須フィールドが不足しているクエストは false を返すこと', () => {
      const invalidQuest = {
        ...mockQuests[0],
        title: '', // 空のタイトル
      };

      const result = useCase.isQuestValid(invalidQuest);

      expect(result).toBe(false);
    });
  });
});
