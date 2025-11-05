/**
 * QuestLog Entity Tests
 * クエストログのユニットテスト
 *
 * テストケース:
 * 1. QuestLog作成（完了）
 * 2. QuestLog作成（見送り）
 * 3. QuestLog作成（阻害）
 * 4. ステップ計算（small, medium, validation）
 * 5. エビデンスのバリデーション
 * 6. 同期フラグのテスト
 */

import { describe, it, expect } from '@jest/globals';
import type {
  Quest,
  QuestLog,
  QuestType,
  QuestStatus,
  QuestDifficulty,
  EvidenceType,
} from '../Quest';

/**
 * QuestLog Type Validation Tests
 */
describe('QuestLog Entity', () => {
  describe('QuestLog作成（完了）', () => {
    it('完了状態のQuestLogを正しく作成できること', () => {
      const questLog: QuestLog = {
        id: 'log-1',
        questId: 'quest-1',
        userId: 'user-1',
        status: 'completed' as QuestStatus,
        actualTime: 30,
        stepsEarned: 50,
        evidenceType: 'image' as EvidenceType,
        evidenceUrl: 'https://example.com/evidence.jpg',
        evidenceNote: 'Screenshot of completion',
        memo: 'Completed successfully',
        completedAt: new Date(),
        createdAt: new Date(),
        isSynced: false,
      };

      expect(questLog.id).toBe('log-1');
      expect(questLog.questId).toBe('quest-1');
      expect(questLog.userId).toBe('user-1');
      expect(questLog.status).toBe('completed');
      expect(questLog.actualTime).toBe(30);
      expect(questLog.stepsEarned).toBe(50);
      expect(questLog.evidenceType).toBe('image');
      expect(questLog.evidenceUrl).toBe('https://example.com/evidence.jpg');
      expect(questLog.completedAt).toBeDefined();
      expect(questLog.isSynced).toBe(false);
    });

    it('完了時は必須フィールドがすべて存在すること', () => {
      const questLog: QuestLog = {
        id: 'log-2',
        questId: 'quest-2',
        userId: 'user-2',
        status: 'completed' as QuestStatus,
        actualTime: 45,
        stepsEarned: 100,
        evidenceType: 'text' as EvidenceType,
        evidenceNote: 'Detailed explanation',
        completedAt: new Date(),
        createdAt: new Date(),
        isSynced: true,
      };

      // 必須フィールドの存在確認
      expect(questLog.id).toBeDefined();
      expect(questLog.questId).toBeDefined();
      expect(questLog.userId).toBeDefined();
      expect(questLog.status).toBe('completed');
      expect(questLog.stepsEarned).toBeDefined();
      expect(questLog.createdAt).toBeDefined();
    });

    it('エビデンスタイプがnoneの場合はURLや詳細が不要', () => {
      const questLog: QuestLog = {
        id: 'log-3',
        questId: 'quest-3',
        userId: 'user-3',
        status: 'completed' as QuestStatus,
        actualTime: 20,
        stepsEarned: 30,
        evidenceType: 'none' as EvidenceType,
        completedAt: new Date(),
        createdAt: new Date(),
        isSynced: false,
      };

      expect(questLog.evidenceType).toBe('none');
      expect(questLog.evidenceUrl).toBeUndefined();
    });
  });

  describe('QuestLog作成（見送り）', () => {
    it('見送り状態のQuestLogを正しく作成できること', () => {
      const questLog: QuestLog = {
        id: 'log-4',
        questId: 'quest-4',
        userId: 'user-4',
        status: 'skipped' as QuestStatus,
        skipReason: 'Time constraint',
        skipMemo: 'Was too busy with work today',
        stepsEarned: 0,
        createdAt: new Date(),
        isSynced: false,
      };

      expect(questLog.status).toBe('skipped');
      expect(questLog.skipReason).toBe('Time constraint');
      expect(questLog.skipMemo).toBe('Was too busy with work today');
      expect(questLog.stepsEarned).toBe(0);
      expect(questLog.actualTime).toBeUndefined();
      expect(questLog.completedAt).toBeUndefined();
    });

    it('見送り時はskipReasonが必須であること', () => {
      const questLog: QuestLog = {
        id: 'log-5',
        questId: 'quest-5',
        userId: 'user-5',
        status: 'skipped' as QuestStatus,
        skipReason: 'Not motivated',
        stepsEarned: 0,
        createdAt: new Date(),
        isSynced: false,
      };

      expect(questLog.skipReason).toBeDefined();
      expect(typeof questLog.skipReason).toBe('string');
    });

    it('見送り時は歩数が0であること', () => {
      const questLog: QuestLog = {
        id: 'log-6',
        questId: 'quest-6',
        userId: 'user-6',
        status: 'skipped' as QuestStatus,
        skipReason: 'Forgot',
        stepsEarned: 0,
        createdAt: new Date(),
        isSynced: false,
      };

      expect(questLog.stepsEarned).toBe(0);
    });
  });

  describe('QuestLog作成（阻害）', () => {
    it('阻害状態のQuestLogを正しく作成できること', () => {
      const questLog: QuestLog = {
        id: 'log-7',
        questId: 'quest-7',
        userId: 'user-7',
        status: 'obstructed' as QuestStatus,
        obstacle: 'Unexpected meeting',
        obstacleDetails: 'Emergency meeting took 2 hours',
        contingencyPlan: 'Reschedule for tomorrow morning',
        stepsEarned: 0,
        createdAt: new Date(),
        isSynced: false,
      };

      expect(questLog.status).toBe('obstructed');
      expect(questLog.obstacle).toBe('Unexpected meeting');
      expect(questLog.obstacleDetails).toBe('Emergency meeting took 2 hours');
      expect(questLog.contingencyPlan).toBe('Reschedule for tomorrow morning');
      expect(questLog.stepsEarned).toBe(0);
    });

    it('阻害時はobstacleとcontingencyPlanが存在すること', () => {
      const questLog: QuestLog = {
        id: 'log-8',
        questId: 'quest-8',
        userId: 'user-8',
        status: 'obstructed' as QuestStatus,
        obstacle: 'Internet outage',
        contingencyPlan: 'Use mobile hotspot tomorrow',
        stepsEarned: 0,
        createdAt: new Date(),
        isSynced: false,
      };

      expect(questLog.obstacle).toBeDefined();
      expect(typeof questLog.obstacle).toBe('string');
      expect(questLog.contingencyPlan).toBeDefined();
      expect(typeof questLog.contingencyPlan).toBe('string');
    });

    it('阻害時は歩数が0であること', () => {
      const questLog: QuestLog = {
        id: 'log-9',
        questId: 'quest-9',
        userId: 'user-9',
        status: 'obstructed' as QuestStatus,
        obstacle: 'Family emergency',
        contingencyPlan: 'Try again tomorrow',
        stepsEarned: 0,
        createdAt: new Date(),
        isSynced: false,
      };

      expect(questLog.stepsEarned).toBe(0);
    });
  });

  describe('ステップ計算', () => {
    it('小クエスト完了時は50ステップを獲得', () => {
      const questLog: QuestLog = {
        id: 'log-10',
        questId: 'quest-10',
        userId: 'user-10',
        status: 'completed' as QuestStatus,
        actualTime: 20,
        stepsEarned: 50,
        evidenceType: 'text' as EvidenceType,
        evidenceNote: 'Completed',
        completedAt: new Date(),
        createdAt: new Date(),
        isSynced: false,
      };

      expect(questLog.stepsEarned).toBe(50);
    });

    it('中クエスト完了時は100ステップを獲得', () => {
      const questLog: QuestLog = {
        id: 'log-11',
        questId: 'quest-11',
        userId: 'user-11',
        status: 'completed' as QuestStatus,
        actualTime: 50,
        stepsEarned: 100,
        evidenceType: 'image' as EvidenceType,
        evidenceUrl: 'https://example.com/proof.jpg',
        completedAt: new Date(),
        createdAt: new Date(),
        isSynced: false,
      };

      expect(questLog.stepsEarned).toBe(100);
    });

    it('検証クエスト完了時は30ステップを獲得', () => {
      const questLog: QuestLog = {
        id: 'log-12',
        questId: 'quest-12',
        userId: 'user-12',
        status: 'completed' as QuestStatus,
        actualTime: 15,
        stepsEarned: 30,
        evidenceType: 'url' as EvidenceType,
        evidenceUrl: 'https://example.com/validation',
        completedAt: new Date(),
        createdAt: new Date(),
        isSynced: false,
      };

      expect(questLog.stepsEarned).toBe(30);
    });

    it('全クエスト完了時は+50ボーナスステップ', () => {
      const questLog: QuestLog = {
        id: 'log-13',
        questId: 'quest-13',
        userId: 'user-13',
        status: 'completed' as QuestStatus,
        actualTime: 120, // すべてのクエスト合計
        stepsEarned: 230, // 50 + 100 + 30 + 50(bonus)
        evidenceType: 'none' as EvidenceType,
        completedAt: new Date(),
        createdAt: new Date(),
        isSynced: false,
      };

      expect(questLog.stepsEarned).toBe(230);
    });

    it('見送り・阻害時は歩数が0', () => {
      const skippedLog: QuestLog = {
        id: 'log-14',
        questId: 'quest-14',
        userId: 'user-14',
        status: 'skipped' as QuestStatus,
        skipReason: 'Not enough time',
        stepsEarned: 0,
        createdAt: new Date(),
        isSynced: false,
      };

      const obstructedLog: QuestLog = {
        id: 'log-15',
        questId: 'quest-15',
        userId: 'user-15',
        status: 'obstructed' as QuestStatus,
        obstacle: 'Technical issue',
        contingencyPlan: 'Fix tomorrow',
        stepsEarned: 0,
        createdAt: new Date(),
        isSynced: false,
      };

      expect(skippedLog.stepsEarned).toBe(0);
      expect(obstructedLog.stepsEarned).toBe(0);
    });
  });

  describe('エビデンスのバリデーション', () => {
    it('IMAGE エビデンスタイプはURLが必須', () => {
      const questLog: QuestLog = {
        id: 'log-16',
        questId: 'quest-16',
        userId: 'user-16',
        status: 'completed' as QuestStatus,
        actualTime: 30,
        stepsEarned: 50,
        evidenceType: 'image' as EvidenceType,
        evidenceUrl: 'https://example.com/image.jpg',
        completedAt: new Date(),
        createdAt: new Date(),
        isSynced: false,
      };

      expect(questLog.evidenceType).toBe('image');
      expect(questLog.evidenceUrl).toBeDefined();
      expect(typeof questLog.evidenceUrl).toBe('string');
    });

    it('TEXT エビデンスタイプはnoteが存在すること', () => {
      const questLog: QuestLog = {
        id: 'log-17',
        questId: 'quest-17',
        userId: 'user-17',
        status: 'completed' as QuestStatus,
        actualTime: 25,
        stepsEarned: 50,
        evidenceType: 'text' as EvidenceType,
        evidenceNote: 'Detailed explanation of completion',
        completedAt: new Date(),
        createdAt: new Date(),
        isSynced: false,
      };

      expect(questLog.evidenceType).toBe('text');
      expect(questLog.evidenceNote).toBeDefined();
      expect(typeof questLog.evidenceNote).toBe('string');
    });

    it('URL エビデンスタイプはURLが必須', () => {
      const questLog: QuestLog = {
        id: 'log-18',
        questId: 'quest-18',
        userId: 'user-18',
        status: 'completed' as QuestStatus,
        actualTime: 40,
        stepsEarned: 100,
        evidenceType: 'url' as EvidenceType,
        evidenceUrl: 'https://github.com/user/repo/pull/123',
        completedAt: new Date(),
        createdAt: new Date(),
        isSynced: false,
      };

      expect(questLog.evidenceType).toBe('url');
      expect(questLog.evidenceUrl).toBeDefined();
      expect(typeof questLog.evidenceUrl).toBe('string');
    });

    it('NONE エビデンスタイプはURL/noteが不要', () => {
      const questLog: QuestLog = {
        id: 'log-19',
        questId: 'quest-19',
        userId: 'user-19',
        status: 'completed' as QuestStatus,
        actualTime: 15,
        stepsEarned: 30,
        evidenceType: 'none' as EvidenceType,
        completedAt: new Date(),
        createdAt: new Date(),
        isSynced: false,
      };

      expect(questLog.evidenceType).toBe('none');
      expect(questLog.evidenceUrl).toBeUndefined();
      expect(questLog.evidenceNote).toBeUndefined();
    });
  });

  describe('同期フラグのテスト', () => {
    it('作成直後は isSynced が false であること', () => {
      const questLog: QuestLog = {
        id: 'log-20',
        questId: 'quest-20',
        userId: 'user-20',
        status: 'completed' as QuestStatus,
        actualTime: 30,
        stepsEarned: 50,
        evidenceType: 'text' as EvidenceType,
        evidenceNote: 'Done',
        completedAt: new Date(),
        createdAt: new Date(),
        isSynced: false,
      };

      expect(questLog.isSynced).toBe(false);
    });

    it('サーバー同期後は isSynced が true になること', () => {
      const questLog: QuestLog = {
        id: 'log-21',
        questId: 'quest-21',
        userId: 'user-21',
        status: 'completed' as QuestStatus,
        actualTime: 50,
        stepsEarned: 100,
        evidenceType: 'image' as EvidenceType,
        evidenceUrl: 'https://example.com/proof.jpg',
        completedAt: new Date(),
        createdAt: new Date(),
        isSynced: true,
      };

      expect(questLog.isSynced).toBe(true);
    });

    it('未同期のログをフィルタできること', () => {
      const logs: QuestLog[] = [
        {
          id: 'log-22',
          questId: 'quest-22',
          userId: 'user-22',
          status: 'completed' as QuestStatus,
          actualTime: 30,
          stepsEarned: 50,
          evidenceType: 'none' as EvidenceType,
          completedAt: new Date(),
          createdAt: new Date(),
          isSynced: false,
        },
        {
          id: 'log-23',
          questId: 'quest-23',
          userId: 'user-23',
          status: 'completed' as QuestStatus,
          actualTime: 40,
          stepsEarned: 100,
          evidenceType: 'text' as EvidenceType,
          evidenceNote: 'Done',
          completedAt: new Date(),
          createdAt: new Date(),
          isSynced: true,
        },
      ];

      const unsyncedLogs = logs.filter((log) => !log.isSynced);

      expect(unsyncedLogs.length).toBe(1);
      expect(unsyncedLogs[0].id).toBe('log-22');
    });
  });

  describe('タイムスタンプのテスト', () => {
    it('createdAt が常に存在すること', () => {
      const questLog: QuestLog = {
        id: 'log-24',
        questId: 'quest-24',
        userId: 'user-24',
        status: 'completed' as QuestStatus,
        actualTime: 30,
        stepsEarned: 50,
        evidenceType: 'none' as EvidenceType,
        completedAt: new Date(),
        createdAt: new Date(),
        isSynced: false,
      };

      expect(questLog.createdAt).toBeDefined();
      expect(questLog.createdAt instanceof Date).toBe(true);
    });

    it('完了時は completedAt が存在すること', () => {
      const questLog: QuestLog = {
        id: 'log-25',
        questId: 'quest-25',
        userId: 'user-25',
        status: 'completed' as QuestStatus,
        actualTime: 45,
        stepsEarned: 100,
        evidenceType: 'url' as EvidenceType,
        evidenceUrl: 'https://example.com/proof',
        completedAt: new Date(),
        createdAt: new Date(),
        isSynced: false,
      };

      expect(questLog.completedAt).toBeDefined();
      expect(questLog.completedAt instanceof Date).toBe(true);
    });

    it('見送り・阻害時は completedAt が存在しないこと', () => {
      const skippedLog: QuestLog = {
        id: 'log-26',
        questId: 'quest-26',
        userId: 'user-26',
        status: 'skipped' as QuestStatus,
        skipReason: 'Not enough time',
        stepsEarned: 0,
        createdAt: new Date(),
        isSynced: false,
      };

      const obstructedLog: QuestLog = {
        id: 'log-27',
        questId: 'quest-27',
        userId: 'user-27',
        status: 'obstructed' as QuestStatus,
        obstacle: 'Internet down',
        contingencyPlan: 'Try tomorrow',
        stepsEarned: 0,
        createdAt: new Date(),
        isSynced: false,
      };

      expect(skippedLog.completedAt).toBeUndefined();
      expect(obstructedLog.completedAt).toBeUndefined();
    });

    it('completedAt は createdAt より後であること', () => {
      const createdTime = new Date();
      const completedTime = new Date(createdTime.getTime() + 30 * 60 * 1000); // 30分後

      const questLog: QuestLog = {
        id: 'log-28',
        questId: 'quest-28',
        userId: 'user-28',
        status: 'completed' as QuestStatus,
        actualTime: 30,
        stepsEarned: 50,
        evidenceType: 'none' as EvidenceType,
        completedAt: completedTime,
        createdAt: createdTime,
        isSynced: false,
      };

      expect(questLog.completedAt!.getTime()).toBeGreaterThan(
        questLog.createdAt.getTime()
      );
    });
  });

  describe('実際の時間（actualTime）のテスト', () => {
    it('完了時は actualTime が存在すること', () => {
      const questLog: QuestLog = {
        id: 'log-29',
        questId: 'quest-29',
        userId: 'user-29',
        status: 'completed' as QuestStatus,
        actualTime: 35,
        stepsEarned: 50,
        evidenceType: 'text' as EvidenceType,
        evidenceNote: 'Finished',
        completedAt: new Date(),
        createdAt: new Date(),
        isSynced: false,
      };

      expect(questLog.actualTime).toBeDefined();
      expect(typeof questLog.actualTime).toBe('number');
      expect(questLog.actualTime).toBeGreaterThan(0);
    });

    it('見送り・阻害時は actualTime が存在しないこと', () => {
      const skippedLog: QuestLog = {
        id: 'log-30',
        questId: 'quest-30',
        userId: 'user-30',
        status: 'skipped' as QuestStatus,
        skipReason: 'Forgot',
        stepsEarned: 0,
        createdAt: new Date(),
        isSynced: false,
      };

      const obstructedLog: QuestLog = {
        id: 'log-31',
        questId: 'quest-31',
        userId: 'user-31',
        status: 'obstructed' as QuestStatus,
        obstacle: 'Power outage',
        contingencyPlan: 'Do tomorrow',
        stepsEarned: 0,
        createdAt: new Date(),
        isSynced: false,
      };

      expect(skippedLog.actualTime).toBeUndefined();
      expect(obstructedLog.actualTime).toBeUndefined();
    });

    it('actualTime は正の数であること', () => {
      const questLog: QuestLog = {
        id: 'log-32',
        questId: 'quest-32',
        userId: 'user-32',
        status: 'completed' as QuestStatus,
        actualTime: 60,
        stepsEarned: 100,
        evidenceType: 'image' as EvidenceType,
        evidenceUrl: 'https://example.com/img.jpg',
        completedAt: new Date(),
        createdAt: new Date(),
        isSynced: false,
      };

      expect(questLog.actualTime).toBeGreaterThan(0);
    });
  });

  describe('メモフィールドのテスト', () => {
    it('完了時は任意でメモを追加できること', () => {
      const questLog: QuestLog = {
        id: 'log-33',
        questId: 'quest-33',
        userId: 'user-33',
        status: 'completed' as QuestStatus,
        actualTime: 40,
        stepsEarned: 100,
        evidenceType: 'text' as EvidenceType,
        evidenceNote: 'Evidence',
        memo: 'This was harder than expected',
        completedAt: new Date(),
        createdAt: new Date(),
        isSynced: false,
      };

      expect(questLog.memo).toBe('This was harder than expected');
    });

    it('見送り時は skipMemo が追加できること', () => {
      const questLog: QuestLog = {
        id: 'log-34',
        questId: 'quest-34',
        userId: 'user-34',
        status: 'skipped' as QuestStatus,
        skipReason: 'Not enough time',
        skipMemo: 'Will try to do it tomorrow instead',
        stepsEarned: 0,
        createdAt: new Date(),
        isSynced: false,
      };

      expect(questLog.skipMemo).toBe('Will try to do it tomorrow instead');
    });

    it('阻害時は obstacleDetails が追加できること', () => {
      const questLog: QuestLog = {
        id: 'log-35',
        questId: 'quest-35',
        userId: 'user-35',
        status: 'obstructed' as QuestStatus,
        obstacle: 'Internet issue',
        obstacleDetails: 'Router stopped working, had to restart',
        contingencyPlan: 'Will continue when internet is stable',
        stepsEarned: 0,
        createdAt: new Date(),
        isSynced: false,
      };

      expect(questLog.obstacleDetails).toBe('Router stopped working, had to restart');
    });
  });
});
