/**
 * ReviewStep 統合テスト
 * オンボーディング最終確認ステップの動作確認
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import ReviewStep from '../../steps/ReviewStep';
import type { GoalData, UserProfileData } from '../../types';

describe('ReviewStep 統合テスト', () => {
  const mockOnConfirm = jest.fn();
  const mockOnBack = jest.fn();

  const mockGoal: GoalData = {
    title: 'TOEIC 800点を取得する',
    kpi: '800点以上',
    deadline: '2024-12-31',
    obstacles: ['仕事が忙しい', 'モチベーション低下'],
    plans: ['毎朝30分勉強する', '週末に2時間まとめて勉強する'],
  };

  const mockProfile: UserProfileData = {
    lifestyle: '会社員（9-18時）',
    focusTime: '朝（6-9時）',
    workEnvironment: '自宅',
    taskPace: '毎日少しずつ',
    pastFailureReason: '時間がなくなった',
    skillLevel: '全くの初心者',
    difficultyPreference: '確実にできる簡単なこと',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('画面表示', () => {
    it('最終確認画面が正しく表示されること', () => {
      render(
        <ReviewStep
          goal={mockGoal}
          duration="3ヶ月以内"
          dailyCommitTime="30分"
          profile={mockProfile}
          milestonesCount={10}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
          loading={false}
        />
      );

      expect(screen.getByText('最終確認')).toBeDefined();
      expect(screen.getByText(/すべての設定を確認してオンボーディングを完了してください/)).toBeDefined();
    });

    it('ボタンが表示されること', () => {
      render(
        <ReviewStep
          goal={mockGoal}
          duration="3ヶ月以内"
          dailyCommitTime="30分"
          profile={mockProfile}
          milestonesCount={10}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
          loading={false}
        />
      );

      expect(screen.getByLabelText('戻る')).toBeDefined();
      expect(screen.getByLabelText('完了')).toBeDefined();
    });

    it('確認事項が表示されること', () => {
      render(
        <ReviewStep
          goal={mockGoal}
          duration="3ヶ月以内"
          dailyCommitTime="30分"
          profile={mockProfile}
          milestonesCount={10}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
          loading={false}
        />
      );

      expect(screen.getByText('✓ 確認事項')).toBeDefined();
      expect(screen.getByText('• 上記の情報は正確ですか？')).toBeDefined();
    });

    it('準備完了ボックスが表示されること', () => {
      render(
        <ReviewStep
          goal={mockGoal}
          duration="3ヶ月以内"
          dailyCommitTime="30分"
          profile={mockProfile}
          milestonesCount={10}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
          loading={false}
        />
      );

      expect(screen.getByText('🚀 準備完了！')).toBeDefined();
      expect(screen.getByText(/これであなたの山登りが始まります/)).toBeDefined();
    });
  });

  describe('目標セクション', () => {
    it('目標情報が正しく表示されること', () => {
      render(
        <ReviewStep
          goal={mockGoal}
          duration="3ヶ月以内"
          dailyCommitTime="30分"
          profile={mockProfile}
          milestonesCount={10}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
          loading={false}
        />
      );

      expect(screen.getByText('🎯')).toBeDefined();
      expect(screen.getByText('目標')).toBeDefined();
      expect(screen.getByText('TOEIC 800点を取得する')).toBeDefined();
      expect(screen.getByText('800点以上')).toBeDefined();
    });

    it('障害リストが表示されること', () => {
      render(
        <ReviewStep
          goal={mockGoal}
          duration="3ヶ月以内"
          dailyCommitTime="30分"
          profile={mockProfile}
          milestonesCount={10}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
          loading={false}
        />
      );

      expect(screen.getByText('予想される障害')).toBeDefined();
      expect(screen.getByText('1. 仕事が忙しい')).toBeDefined();
      expect(screen.getByText('2. モチベーション低下')).toBeDefined();
    });

    it('対処計画が表示されること', () => {
      render(
        <ReviewStep
          goal={mockGoal}
          duration="3ヶ月以内"
          dailyCommitTime="30分"
          profile={mockProfile}
          milestonesCount={10}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
          loading={false}
        />
      );

      expect(screen.getByText('対処計画')).toBeDefined();
      expect(screen.getByText('1. 毎朝30分勉強する')).toBeDefined();
      expect(screen.getByText('2. 週末に2時間まとめて勉強する')).toBeDefined();
    });

    it('goalがundefinedの場合でもエラーにならないこと', () => {
      render(
        <ReviewStep
          duration="3ヶ月以内"
          dailyCommitTime="30分"
          profile={mockProfile}
          milestonesCount={10}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
          loading={false}
        />
      );

      expect(screen.getByText('最終確認')).toBeDefined();
    });
  });

  describe('期間と時間セクション', () => {
    it('期間と時間情報が正しく表示されること', () => {
      render(
        <ReviewStep
          goal={mockGoal}
          duration="3ヶ月以内"
          dailyCommitTime="30分"
          profile={mockProfile}
          milestonesCount={10}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
          loading={false}
        />
      );

      expect(screen.getByText('📅')).toBeDefined();
      expect(screen.getByText('期間と時間')).toBeDefined();
      expect(screen.getByText('目標期間')).toBeDefined();
      expect(screen.getByText('3ヶ月以内')).toBeDefined();
      expect(screen.getByText('1日のコミットタイム')).toBeDefined();
      expect(screen.getByText('30分')).toBeDefined();
    });
  });

  describe('プロファイルセクション', () => {
    it('プロファイル情報が正しく表示されること', () => {
      render(
        <ReviewStep
          goal={mockGoal}
          duration="3ヶ月以内"
          dailyCommitTime="30分"
          profile={mockProfile}
          milestonesCount={10}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
          loading={false}
        />
      );

      expect(screen.getByText('👤')).toBeDefined();
      expect(screen.getByText('プロファイル')).toBeDefined();
      expect(screen.getByText('生活パターン')).toBeDefined();
      expect(screen.getByText('会社員（9-18時）')).toBeDefined();
      expect(screen.getByText('集中時間')).toBeDefined();
      expect(screen.getByText('朝（6-9時）')).toBeDefined();
      expect(screen.getByText('作業環境')).toBeDefined();
      expect(screen.getByText('自宅')).toBeDefined();
    });

    it('profileがundefinedの場合はセクションが表示されないこと', () => {
      render(
        <ReviewStep
          goal={mockGoal}
          duration="3ヶ月以内"
          dailyCommitTime="30分"
          milestonesCount={10}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
          loading={false}
        />
      );

      expect(screen.queryByText('👤')).toBeNull();
    });
  });

  describe('マイルストーンセクション', () => {
    it('マイルストーン情報が正しく表示されること', () => {
      render(
        <ReviewStep
          goal={mockGoal}
          duration="3ヶ月以内"
          dailyCommitTime="30分"
          profile={mockProfile}
          milestonesCount={10}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
          loading={false}
        />
      );

      expect(screen.getByText('🏔️')).toBeDefined();
      expect(screen.getByText('マイルストーン')).toBeDefined();
      expect(screen.getByText('10合目まで、10段階のマイルストーンが生成されました')).toBeDefined();
    });
  });

  describe('完了ボタン', () => {
    it('完了ボタンを押すとonConfirmが呼ばれること', () => {
      render(
        <ReviewStep
          goal={mockGoal}
          duration="3ヶ月以内"
          dailyCommitTime="30分"
          profile={mockProfile}
          milestonesCount={10}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
          loading={false}
        />
      );

      const confirmButton = screen.getByLabelText('完了');
      fireEvent.press(confirmButton);

      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    });

    it('loading中は完了ボタンが無効になること', () => {
      render(
        <ReviewStep
          goal={mockGoal}
          duration="3ヶ月以内"
          dailyCommitTime="30分"
          profile={mockProfile}
          milestonesCount={10}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
          loading={true}
        />
      );

      const confirmButton = screen.getByLabelText('完了');
      expect(confirmButton.props.accessibilityState?.disabled).toBe(true);
    });

    it('loading中はActivityIndicatorが表示されること', () => {
      const { UNSAFE_root } = render(
        <ReviewStep
          goal={mockGoal}
          duration="3ヶ月以内"
          dailyCommitTime="30分"
          profile={mockProfile}
          milestonesCount={10}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
          loading={true}
        />
      );

      const activityIndicators = UNSAFE_root.findAllByType('ActivityIndicator' as any);
      expect(activityIndicators.length).toBeGreaterThan(0);
    });
  });

  describe('戻るボタン', () => {
    it('戻るボタンを押すとonBackが呼ばれること', () => {
      render(
        <ReviewStep
          goal={mockGoal}
          duration="3ヶ月以内"
          dailyCommitTime="30分"
          profile={mockProfile}
          milestonesCount={10}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
          loading={false}
        />
      );

      const backButton = screen.getByLabelText('戻る');
      fireEvent.press(backButton);

      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });

    it('loading中は戻るボタンが無効になること', () => {
      render(
        <ReviewStep
          goal={mockGoal}
          duration="3ヶ月以内"
          dailyCommitTime="30分"
          profile={mockProfile}
          milestonesCount={10}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
          loading={true}
        />
      );

      const backButton = screen.getByLabelText('戻る');
      expect(backButton.props.accessibilityState?.disabled).toBe(true);
    });
  });

  describe('アクセシビリティ', () => {
    it('すべてのボタンにaccessibilityLabelがあること', () => {
      render(
        <ReviewStep
          goal={mockGoal}
          duration="3ヶ月以内"
          dailyCommitTime="30分"
          profile={mockProfile}
          milestonesCount={10}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
          loading={false}
        />
      );

      expect(screen.getByLabelText('戻る')).toBeDefined();
      expect(screen.getByLabelText('完了')).toBeDefined();
    });
  });
});
