/**
 * useMilestoneAchievement Hook
 * マイルストーン達成管理フック
 */

import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { DatabaseManager } from '@/services/database/DatabaseManager';
import {
  MilestoneAchievementState,
  MilestoneAchievementConfirmation,
  Evidence,
  NotAchievedOption,
  GoalAdjustmentProposal,
  MilestoneRedesignProposal,
} from '../types';

/**
 * useMilestoneAchievement Hook
 */
export const useMilestoneAchievement = (userId: string, milestoneId?: string) => {
  const [achievementState, setAchievementState] =
    useState<MilestoneAchievementState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const [adjustmentProposal, setAdjustmentProposal] =
    useState<GoalAdjustmentProposal | null>(null);
  const [redesignProposal, setRedesignProposal] =
    useState<MilestoneRedesignProposal | null>(null);

  /**
   * マイルストーン達成状態を読み込み
   */
  const loadAchievementState = useCallback(async () => {
    if (!milestoneId) return;

    setIsLoading(true);
    setError(null);

    try {
      const dbManager = DatabaseManager.getInstance();

      // マイルストーン情報を取得
      const milestoneResult = await dbManager.execute(
        `SELECT * FROM milestones WHERE id = ?`,
        [milestoneId]
      );

      if (milestoneResult.rows.length === 0) {
        throw new Error('マイルストーンが見つかりません');
      }

      const milestone = milestoneResult.rows[0];

      // 現在の累計歩数を取得
      const progressResult = await dbManager.execute(
        `SELECT total_steps FROM climbing_progress WHERE user_id = ?`,
        [userId]
      );

      const currentSteps =
        progressResult.rows.length > 0 ? progressResult.rows[0].total_steps : 0;

      // 達成確認データを取得
      const confirmationResult = await dbManager.execute(
        `SELECT * FROM milestone_achievements WHERE milestone_id = ? AND user_id = ?`,
        [milestoneId, userId]
      );

      const isConfirmed = confirmationResult.rows.length > 0;
      let confirmation: MilestoneAchievementConfirmation | undefined;

      if (isConfirmed) {
        const record = confirmationResult.rows[0];
        confirmation = {
          milestoneId: record.milestone_id,
          stationNumber: milestone.station_number,
          achieved: record.achieved,
          evidence: record.evidence ? JSON.parse(record.evidence) : undefined,
          progressRate: record.progress_rate,
          notAchievedOption: record.not_achieved_option,
          confirmedAt: new Date(record.confirmed_at),
        };
      }

      setAchievementState({
        milestone: {
          id: milestone.id,
          stationNumber: milestone.station_number,
          title: milestone.title,
          criteria: milestone.criteria,
          requiredSteps: milestone.required_steps,
        },
        currentSteps,
        isConfirmed,
        confirmation,
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('データの読み込みに失敗しました'));
    } finally {
      setIsLoading(false);
    }
  }, [userId, milestoneId]);

  /**
   * 達成を確認
   */
  const confirmAchievement = useCallback(
    async (evidence: Evidence) => {
      if (!achievementState || !milestoneId) return;

      setIsLoading(true);
      setError(null);

      try {
        const dbManager = DatabaseManager.getInstance();

        // 達成記録を保存
        await dbManager.run(
          `INSERT INTO milestone_achievements (
            id,
            milestone_id,
            user_id,
            achieved,
            evidence,
            confirmed_at,
            created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            `achievement_${Date.now()}`,
            milestoneId,
            userId,
            1, // achieved = true
            JSON.stringify(evidence),
            new Date().toISOString(),
            new Date().toISOString(),
          ]
        );

        // マイルストーンのステータスを更新
        await dbManager.run(
          `UPDATE milestones SET
            status = 'achieved',
            achieved_at = ?
          WHERE id = ?`,
          [new Date().toISOString(), milestoneId]
        );

        // TODO: バックエンドAPIに通知を送信
        // await MCPClient.getInstance().callTool('milestone.achieve', { ... });

        // 状態を再読み込み
        await loadAchievementState();

        Alert.alert(
          '達成おめでとうございます！🎉',
          `${achievementState.milestone.stationNumber}合目を達成しました。次の合目に向けて頑張りましょう！`
        );
      } catch (err) {
        setError(err instanceof Error ? err : new Error('達成の記録に失敗しました'));
        Alert.alert('エラー', '達成の記録に失敗しました');
      } finally {
        setIsLoading(false);
      }
    },
    [achievementState, milestoneId, userId, loadAchievementState]
  );

  /**
   * 未達成を確認
   */
  const confirmNotAchieved = useCallback(
    async (progressRate: number, option: NotAchievedOption) => {
      if (!achievementState || !milestoneId) return;

      setIsLoading(true);
      setError(null);

      try {
        const dbManager = DatabaseManager.getInstance();

        // 未達成記録を保存
        await dbManager.run(
          `INSERT INTO milestone_achievements (
            id,
            milestone_id,
            user_id,
            achieved,
            progress_rate,
            not_achieved_option,
            confirmed_at,
            created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            `achievement_${Date.now()}`,
            milestoneId,
            userId,
            0, // achieved = false
            progressRate,
            option,
            new Date().toISOString(),
            new Date().toISOString(),
          ]
        );

        // マイルストーンのステータスを更新
        await dbManager.run(
          `UPDATE milestones SET
            status = 'not_achieved',
            progress_rate = ?
          WHERE id = ?`,
          [progressRate, milestoneId]
        );

        // 選択肢に応じた処理
        if (option === NotAchievedOption.ADJUST_GOAL) {
          // TODO: バックエンドAPIに目標調整を依頼
          // const proposal = await MCPClient.getInstance().callTool('goal.adjust', { ... });
          // setAdjustmentProposal(proposal);

          // モックデータ（TODO: 実際のAPI実装後に削除）
          setAdjustmentProposal({
            proposalId: 'mock-proposal-1',
            originalGoal: {
              title: '体重を減らす',
              kpi: '体重60kg',
              deadline: new Date('2024-12-31'),
            },
            adjustedGoal: {
              title: '体重を減らす',
              kpi: '体重65kg',
              deadline: new Date('2025-03-31'),
            },
            reason: '進捗率と達成パターンを分析した結果、より現実的な目標を提案します',
            changes: [
              {
                field: 'kpi',
                before: '体重60kg',
                after: '体重65kg',
                explanation: '現在の進捗率から、65kgがより達成可能な目標です',
              },
              {
                field: 'deadline',
                before: '2024-12-31',
                after: '2025-03-31',
                explanation: '3ヶ月の期間延長で、無理のないペースで進められます',
              },
            ],
            proposedAt: new Date(),
          });
        } else if (option === NotAchievedOption.REDESIGN_MILESTONES) {
          // TODO: バックエンドAPIにマイルストーン再設計を依頼
          // const proposal = await MCPClient.getInstance().callTool('milestone.redesign', { ... });
          // setRedesignProposal(proposal);

          // モックデータ（TODO: 実際のAPI実装後に削除）
          setRedesignProposal({
            proposalId: 'mock-redesign-1',
            reason: 'これまでの達成パターンを分析し、より段階的なマイルストーンを提案します',
            progressAnalysis: {
              currentStation: achievementState.milestone.stationNumber,
              totalSteps: achievementState.currentSteps,
              completedQuests: 45,
              averageAchievementRate: progressRate,
              identifiedIssues: [
                'マイルストーン間のギャップが大きすぎる',
                'クエストの難易度が高すぎる',
              ],
            },
            newMilestones: [
              {
                stationNumber: achievementState.milestone.stationNumber,
                title: '調整されたマイルストーン',
                criteria: 'より達成可能な基準',
                requiredSteps: achievementState.milestone.requiredSteps - 500,
              },
              // ... 他のマイルストーン
            ],
            proposedAt: new Date(),
          });
        }

        // 状態を再読み込み
        await loadAchievementState();

        // メッセージを表示
        if (option === NotAchievedOption.CONTINUE) {
          Alert.alert(
            '引き続き頑張りましょう！',
            'このまま現在の目標で続けます。無理せず、自分のペースで進めてください。'
          );
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('記録に失敗しました'));
        Alert.alert('エラー', '記録に失敗しました');
      } finally {
        setIsLoading(false);
      }
    },
    [achievementState, milestoneId, userId, loadAchievementState]
  );

  /**
   * 調整提案を承認
   */
  const approveAdjustment = useCallback(async () => {
    if (!adjustmentProposal) return;

    setIsLoading(true);
    setError(null);

    try {
      const dbManager = DatabaseManager.getInstance();

      // TODO: バックエンドAPIに承認を送信
      // await MCPClient.getInstance().callTool('goal.approveAdjustment', { ... });

      // 目標を更新
      await dbManager.run(
        `UPDATE goals SET
          title = ?,
          kpi = ?,
          deadline = ?,
          updated_at = ?
        WHERE user_id = ?`,
        [
          adjustmentProposal.adjustedGoal.title,
          adjustmentProposal.adjustedGoal.kpi,
          adjustmentProposal.adjustedGoal.deadline.toISOString(),
          new Date().toISOString(),
          userId,
        ]
      );

      Alert.alert('目標を調整しました', '新しい目標で引き続き頑張りましょう！');
      setAdjustmentProposal(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('承認に失敗しました'));
      Alert.alert('エラー', '承認に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [adjustmentProposal, userId]);

  /**
   * 再設計提案を承認
   */
  const approveRedesign = useCallback(async () => {
    if (!redesignProposal) return;

    setIsLoading(true);
    setError(null);

    try {
      const dbManager = DatabaseManager.getInstance();

      // TODO: バックエンドAPIに承認を送信
      // await MCPClient.getInstance().callTool('milestone.approveRedesign', { ... });

      // マイルストーンを更新
      for (const milestone of redesignProposal.newMilestones) {
        await dbManager.run(
          `UPDATE milestones SET
            title = ?,
            criteria = ?,
            required_steps = ?,
            updated_at = ?
          WHERE user_id = ? AND station_number = ?`,
          [
            milestone.title,
            milestone.criteria,
            milestone.requiredSteps,
            new Date().toISOString(),
            userId,
            milestone.stationNumber,
          ]
        );
      }

      Alert.alert('マイルストーンを再設計しました', '新しいプランで引き続き頑張りましょう！');
      setRedesignProposal(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('承認に失敗しました'));
      Alert.alert('エラー', '承認に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [redesignProposal, userId]);

  // 初回読み込み
  useEffect(() => {
    loadAchievementState();
  }, [loadAchievementState]);

  return {
    achievementState,
    isLoading,
    error,
    confirmAchievement,
    confirmNotAchieved,
    adjustmentProposal,
    redesignProposal,
    approveAdjustment,
    approveRedesign,
    refresh: loadAchievementState,
  };
};
