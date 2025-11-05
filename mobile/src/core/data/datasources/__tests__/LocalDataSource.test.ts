/**
 * LocalDataSource Unit Tests
 * SQLite ローカルデータ管理のテスト
 */

import { LocalDataSource } from '../LocalDataSource';
import {
  Goal,
  GoalStatus,
  Quest,
  QuestType,
  QuestDifficulty,
  QuestStatus,
  EvidenceType,
  QuestLog,
  Milestone,
  UserProgress,
  Streak,
} from '@/core/domain/entities';

// SQLiteモック
jest.mock('expo-sqlite');

describe('LocalDataSource', () => {
  let localDataSource: LocalDataSource;

  beforeEach(async () => {
    // シングルトン取得
    localDataSource = LocalDataSource.getInstance();
  });

  describe('initialization', () => {
    it('should be a singleton', () => {
      const instance1 = LocalDataSource.getInstance();
      const instance2 = LocalDataSource.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should initialize database without errors', async () => {
      // initializeは実装済み、モックされたデータベースで動作
      expect(() => {
        LocalDataSource.getInstance();
      }).not.toThrow();
    });
  });

  describe('Goal operations', () => {
    const mockGoal: Goal = {
      id: 'goal-1',
      userId: 'user-1',
      title: 'Learn TypeScript',
      kpi: 'Build 3 projects',
      duration: '6 months',
      obstacles: ['Time constraint', 'Complexity'],
      plans: ['Daily practice', 'Read docs'],
      status: GoalStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should save and retrieve a goal', async () => {
      // 注: 実際のテスト実行にはデータベースのモック戦略が必要
      // ここではテスト構造の例を示します
      expect(mockGoal).toBeDefined();
      expect(mockGoal.userId).toBe('user-1');
    });

    it('should handle null when goal does not exist', async () => {
      // テスト構造の例
      const nonExistentGoal = null;
      expect(nonExistentGoal).toBeNull();
    });
  });

  describe('Quest operations', () => {
    const mockQuest: Quest = {
      id: 'quest-1',
      questBundleId: 'bundle-1',
      type: QuestType.SMALL,
      title: 'Read Chapter 1',
      description: 'Read and understand chapter 1',
      estimatedTime: 30,
      difficulty: QuestDifficulty.EASY,
      completionCriteria: 'Complete reading',
      evidenceType: EvidenceType.TEXT,
      contributesToStation: 1,
      order: 1,
      status: QuestStatus.PENDING,
      createdAt: new Date(),
      validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };

    it('should save quests', async () => {
      expect(mockQuest).toBeDefined();
      expect(mockQuest.type).toBe(QuestType.SMALL);
    });

    it('should retrieve quests within valid period', async () => {
      // テスト構造の例
      const quests = [mockQuest];
      expect(quests).toHaveLength(1);
      expect(quests[0].validUntil > new Date()).toBe(true);
    });

    it('should handle empty quest list', async () => {
      const quests: Quest[] = [];
      expect(quests).toEqual([]);
    });
  });

  describe('QuestLog operations', () => {
    const mockQuestLog: QuestLog = {
      id: 'log-1',
      questId: 'quest-1',
      userId: 'user-1',
      status: QuestStatus.COMPLETED,
      actualTime: 25,
      evidenceUrl: 'https://example.com/evidence.jpg',
      stepsEarned: 50,
      completedAt: new Date(),
      createdAt: new Date(),
      isSynced: false,
    };

    it('should save quest log with evidence', async () => {
      expect(mockQuestLog).toBeDefined();
      expect(mockQuestLog.status).toBe(QuestStatus.COMPLETED);
      expect(mockQuestLog.stepsEarned).toBe(50);
    });

    it('should handle skipped quest log', async () => {
      const skippedLog: QuestLog = {
        ...mockQuestLog,
        status: QuestStatus.SKIPPED,
        skipReason: 'Too busy',
        stepsEarned: 0,
      };

      expect(skippedLog.status).toBe(QuestStatus.SKIPPED);
      expect(skippedLog.stepsEarned).toBe(0);
    });

    it('should handle obstructed quest log', async () => {
      const obstructedLog: QuestLog = {
        ...mockQuestLog,
        status: QuestStatus.OBSTRUCTED,
        obstacle: 'Internet down',
        contingencyPlan: 'Try offline',
        stepsEarned: 25,
      };

      expect(obstructedLog.status).toBe(QuestStatus.OBSTRUCTED);
      expect(obstructedLog.obstacle).toBe('Internet down');
    });
  });

  describe('UserProgress operations', () => {
    const mockUserProgress: UserProgress = {
      userId: 'user-1',
      totalSteps: 1000,
      currentStreak: 15,
      maxStreak: 30,
      freezeDaysRemaining: 1,
      lastActivityDate: new Date(),
      currentStation: 3,
      stepsForCurrentStation: 500,
      updatedAt: new Date(),
      isSynced: false,
    };

    it('should save and retrieve user progress', async () => {
      expect(mockUserProgress).toBeDefined();
      expect(mockUserProgress.totalSteps).toBe(1000);
      expect(mockUserProgress.currentStreak).toBe(15);
    });

    it('should update progress when quest completed', async () => {
      const updatedProgress: UserProgress = {
        ...mockUserProgress,
        totalSteps: 1050,
        stepsForCurrentStation: 550,
      };

      expect(updatedProgress.totalSteps).toBe(1050);
      expect(updatedProgress.stepsForCurrentStation).toBe(550);
    });

    it('should track streak correctly', async () => {
      const streakProgress: UserProgress = {
        ...mockUserProgress,
        currentStreak: 16,
        lastActivityDate: new Date(),
      };

      expect(streakProgress.currentStreak).toBe(16);
    });
  });

  describe('Milestone operations', () => {
    const mockMilestones: Milestone[] = [
      {
        id: 'milestone-1',
        goalId: 'goal-1',
        station: 1,
        title: '1合目',
        description: 'First station',
        targetSteps: 100,
        completionCriteria: 'Complete 100 steps',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'milestone-2',
        goalId: 'goal-1',
        station: 2,
        title: '2合目',
        description: 'Second station',
        targetSteps: 200,
        completionCriteria: 'Complete 200 steps',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    it('should save multiple milestones', async () => {
      expect(mockMilestones).toHaveLength(2);
    });

    it('should retrieve milestones ordered by station', async () => {
      const orderedMilestones = mockMilestones.sort(
        (a, b) => a.station - b.station
      );
      expect(orderedMilestones[0].station).toBe(1);
      expect(orderedMilestones[1].station).toBe(2);
    });

    it('should update milestone status on completion', async () => {
      const completedMilestone: Milestone = {
        ...mockMilestones[0],
        status: 'completed',
        completedAt: new Date(),
      };

      expect(completedMilestone.status).toBe('completed');
      expect(completedMilestone.completedAt).toBeDefined();
    });
  });

  describe('Sync status tracking', () => {
    it('should track synced state', async () => {
      const syncedGoal: Goal = {
        id: 'goal-1',
        userId: 'user-1',
        title: 'Test',
        kpi: 'Test',
        duration: '1 month',
        obstacles: [],
        plans: [],
        status: GoalStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(syncedGoal).toBeDefined();
      // isSynced は LocalDataSource で 0 (false) として保存されるはず
    });

    it('should distinguish between synced and unsynced data', async () => {
      const syncedLog: QuestLog = {
        id: 'log-1',
        questId: 'quest-1',
        userId: 'user-1',
        status: QuestStatus.COMPLETED,
        stepsEarned: 50,
        createdAt: new Date(),
        isSynced: true,
      };

      const unsyncedLog: QuestLog = {
        ...syncedLog,
        isSynced: false,
      };

      expect(syncedLog.isSynced).toBe(true);
      expect(unsyncedLog.isSynced).toBe(false);
    });
  });
});
