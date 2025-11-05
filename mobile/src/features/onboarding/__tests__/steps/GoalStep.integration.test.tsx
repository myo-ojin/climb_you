/**
 * GoalStep 統合テスト
 * 目標入力とSMART + WOOP分析ステップの動作確認
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Alert } from 'react-native';
import GoalStep from '../../steps/GoalStep';
import type { GoalAnalysisResult } from '../../types';

// Alert.alertをモック
jest.spyOn(Alert, 'alert');

// SmartAnalysisDisplay コンポーネントをモック
jest.mock('../../components/SmartAnalysisDisplay', () => {
  const React = require('react');
  const { View, Text } = require('react-native');

  return ({ smartAnalysis }: any) => (
    <View>
      <Text>Smart Analysis Display</Text>
    </View>
  );
});

describe('GoalStep 統合テスト', () => {
  const mockOnSubmit = jest.fn();
  const mockOnBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('目標入力ステップ - 画面表示', () => {
    it('目標入力画面が正しく表示されること', () => {
      render(
        <GoalStep
          step="goal"
          onSubmit={mockOnSubmit}
          onBack={mockOnBack}
          loading={false}
        />
      );

      expect(screen.getByText('長期目標の設定')).toBeDefined();
      expect(screen.getByText('山頂を目指すための目標を設定しましょう')).toBeDefined();
    });

    it('目標入力フィールドが表示されること', () => {
      render(
        <GoalStep
          step="goal"
          onSubmit={mockOnSubmit}
          onBack={mockOnBack}
          loading={false}
        />
      );

      expect(screen.getByLabelText('目標入力フィールド')).toBeDefined();
      expect(screen.getByLabelText('背景情報入力フィールド')).toBeDefined();
    });

    it('ボタンが表示されること', () => {
      render(
        <GoalStep
          step="goal"
          onSubmit={mockOnSubmit}
          onBack={mockOnBack}
          loading={false}
        />
      );

      expect(screen.getByLabelText('戻る')).toBeDefined();
      expect(screen.getByLabelText('分析する')).toBeDefined();
    });
  });

  describe('障害入力ステップ - 画面表示', () => {
    it('障害入力画面が正しく表示されること', () => {
      render(
        <GoalStep
          step="obstacles"
          onSubmit={mockOnSubmit}
          onBack={mockOnBack}
          loading={false}
        />
      );

      expect(screen.getByText('障害と対処計画')).toBeDefined();
      expect(screen.getByText('達成を阻みそうな課題に対策を立てましょう')).toBeDefined();
    });

    it('障害入力フィールドが表示されること', () => {
      render(
        <GoalStep
          step="obstacles"
          onSubmit={mockOnSubmit}
          onBack={mockOnBack}
          loading={false}
        />
      );

      expect(screen.getByLabelText('障害入力フィールド')).toBeDefined();
      expect(screen.getByLabelText('対処計画入力フィールド')).toBeDefined();
    });
  });

  describe('目標入力', () => {
    it('目標を入力できること', () => {
      render(
        <GoalStep
          step="goal"
          onSubmit={mockOnSubmit}
          onBack={mockOnBack}
          loading={false}
        />
      );

      const goalInput = screen.getByLabelText('目標入力フィールド');
      fireEvent.changeText(goalInput, 'TOEIC 800点を取得する');

      expect(goalInput.props.value).toBe('TOEIC 800点を取得する');
    });

    it('背景情報を入力できること', () => {
      render(
        <GoalStep
          step="goal"
          onSubmit={mockOnSubmit}
          onBack={mockOnBack}
          loading={false}
        />
      );

      const contextInput = screen.getByLabelText('背景情報入力フィールド');
      fireEvent.changeText(contextInput, '海外で働きたいから');

      expect(contextInput.props.value).toBe('海外で働きたいから');
    });
  });

  describe('分析ボタン', () => {
    it('空の入力では分析ボタンが無効であること', () => {
      render(
        <GoalStep
          step="goal"
          onSubmit={mockOnSubmit}
          onBack={mockOnBack}
          loading={false}
        />
      );

      const submitButton = screen.getByLabelText('分析する');
      expect(submitButton.props.accessibilityState?.disabled).toBe(true);
    });

    it('目標を入力すると分析ボタンが有効になること', () => {
      render(
        <GoalStep
          step="goal"
          onSubmit={mockOnSubmit}
          onBack={mockOnBack}
          loading={false}
        />
      );

      const goalInput = screen.getByLabelText('目標入力フィールド');
      fireEvent.changeText(goalInput, 'TOEIC 800点を取得する');

      const submitButton = screen.getByLabelText('分析する');
      expect(submitButton.props.accessibilityState?.disabled).toBe(false);
    });

    it('分析ボタンを押すとonSubmitが呼ばれること', () => {
      render(
        <GoalStep
          step="goal"
          onSubmit={mockOnSubmit}
          onBack={mockOnBack}
          loading={false}
        />
      );

      // 目標を入力
      const goalInput = screen.getByLabelText('目標入力フィールド');
      fireEvent.changeText(goalInput, 'TOEIC 800点を取得する');

      // 背景情報を入力
      const contextInput = screen.getByLabelText('背景情報入力フィールド');
      fireEvent.changeText(contextInput, '海外で働きたいから');

      // 分析ボタンを押す
      const submitButton = screen.getByLabelText('分析する');
      fireEvent.press(submitButton);

      // onSubmitが呼ばれる
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      expect(mockOnSubmit).toHaveBeenCalledWith('TOEIC 800点を取得する', '海外で働きたいから');
    });

    it('背景情報が空の場合はundefinedが渡されること', () => {
      render(
        <GoalStep
          step="goal"
          onSubmit={mockOnSubmit}
          onBack={mockOnBack}
          loading={false}
        />
      );

      const goalInput = screen.getByLabelText('目標入力フィールド');
      fireEvent.changeText(goalInput, 'TOEIC 800点を取得する');

      const submitButton = screen.getByLabelText('分析する');
      fireEvent.press(submitButton);

      expect(mockOnSubmit).toHaveBeenCalledWith('TOEIC 800点を取得する', undefined);
    });
  });

  describe('分析結果の表示 - 完全な目標', () => {
    const completeAnalysis: GoalAnalysisResult = {
      isComplete: true,
      missingElements: [],
      suggestions: [],
      smartAnalysis: {
        specific: { score: 10, feedback: 'Good' },
        measurable: { score: 10, feedback: 'Good' },
        achievable: { score: 10, feedback: 'Good' },
        relevant: { score: 10, feedback: 'Good' },
        timeBound: { score: 10, feedback: 'Good' },
      },
    };

    it('完全な目標の場合は成功メッセージが表示されること', () => {
      render(
        <GoalStep
          step="goal"
          analysis={completeAnalysis}
          onSubmit={mockOnSubmit}
          onBack={mockOnBack}
          loading={false}
        />
      );

      expect(screen.getByText('目標の分析結果')).toBeDefined();
      expect(screen.getByText('目標が明確です！このまま進めましょう')).toBeDefined();
    });

    it('完全な目標の場合はボタンが「次へ」になること', () => {
      render(
        <GoalStep
          step="goal"
          analysis={completeAnalysis}
          goal={{ title: 'TOEIC 800点を取得する', kpi: '800点', deadline: '2024-12-31' }}
          onSubmit={mockOnSubmit}
          onBack={mockOnBack}
          loading={false}
        />
      );

      expect(screen.getByText('次へ')).toBeDefined();
    });
  });

  describe('分析結果の表示 - 不完全な目標', () => {
    const incompleteAnalysis: GoalAnalysisResult = {
      isComplete: false,
      missingElements: ['期限が明確でない', '測定可能な指標がない'],
      suggestions: [
        'いつまでに達成したいか、具体的な日付を設定しましょう',
        '進捗を測る具体的な数値や基準を設定しましょう',
      ],
      smartAnalysis: {
        specific: { score: 8, feedback: 'Good' },
        measurable: { score: 3, feedback: '測定可能性が低い' },
        achievable: { score: 7, feedback: 'OK' },
        relevant: { score: 9, feedback: 'Good' },
        timeBound: { score: 2, feedback: '期限が不明確' },
      },
    };

    it('不完全な目標の場合は欠けている要素が表示されること', () => {
      render(
        <GoalStep
          step="goal"
          analysis={incompleteAnalysis}
          onSubmit={mockOnSubmit}
          onBack={mockOnBack}
          loading={false}
        />
      );

      expect(screen.getByText('以下の要素が不足しています：')).toBeDefined();
      expect(screen.getByText('• 期限が明確でない')).toBeDefined();
      expect(screen.getByText('• 測定可能な指標がない')).toBeDefined();
    });

    it('不完全な目標の場合は提案が表示されること', () => {
      render(
        <GoalStep
          step="goal"
          analysis={incompleteAnalysis}
          onSubmit={mockOnSubmit}
          onBack={mockOnBack}
          loading={false}
        />
      );

      expect(screen.getByText('改善のためのご提案：')).toBeDefined();
      expect(screen.getByText('1. いつまでに達成したいか、具体的な日付を設定しましょう')).toBeDefined();
      expect(screen.getByText('2. 進捗を測る具体的な数値や基準を設定しましょう')).toBeDefined();
    });

    it('不完全な目標の場合は修正プロンプトが表示されること', () => {
      render(
        <GoalStep
          step="goal"
          analysis={incompleteAnalysis}
          onSubmit={mockOnSubmit}
          onBack={mockOnBack}
          loading={false}
        />
      );

      expect(screen.getByText('目標を修正してもう一度試してください')).toBeDefined();
      expect(screen.getByText(/SMART基準を満たす目標に修正いただくと/)).toBeDefined();
    });
  });

  describe('戻るボタン', () => {
    it('戻るボタンを押すとonBackが呼ばれること', () => {
      render(
        <GoalStep
          step="goal"
          onSubmit={mockOnSubmit}
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
        <GoalStep
          step="goal"
          onSubmit={mockOnSubmit}
          onBack={mockOnBack}
          loading={true}
        />
      );

      const backButton = screen.getByLabelText('戻る');
      expect(backButton.props.accessibilityState?.disabled).toBe(true);
    });
  });

  describe('ローディング状態', () => {
    it('loading中は分析ボタンが無効になること', () => {
      render(
        <GoalStep
          step="goal"
          goal={{ title: 'TOEIC 800点を取得する', kpi: '800点', deadline: '2024-12-31' }}
          onSubmit={mockOnSubmit}
          onBack={mockOnBack}
          loading={true}
        />
      );

      const submitButton = screen.getByLabelText('分析する');
      expect(submitButton.props.accessibilityState?.disabled).toBe(true);
    });

    it('loading中は入力フィールドが無効になること', () => {
      render(
        <GoalStep
          step="goal"
          onSubmit={mockOnSubmit}
          onBack={mockOnBack}
          loading={true}
        />
      );

      const goalInput = screen.getByLabelText('目標入力フィールド');
      const contextInput = screen.getByLabelText('背景情報入力フィールド');

      expect(goalInput.props.editable).toBe(false);
      expect(contextInput.props.editable).toBe(false);
    });

    it('loading中はActivityIndicatorが表示されること', () => {
      const { UNSAFE_root } = render(
        <GoalStep
          step="goal"
          goal={{ title: 'TOEIC 800点を取得する', kpi: '800点', deadline: '2024-12-31' }}
          onSubmit={mockOnSubmit}
          onBack={mockOnBack}
          loading={true}
        />
      );

      const activityIndicator = UNSAFE_root.findAllByType('ActivityIndicator' as any);
      expect(activityIndicator.length).toBeGreaterThan(0);
    });
  });

  describe('初期値の設定', () => {
    it('初期goalが渡された場合、入力フィールドに反映されること', () => {
      render(
        <GoalStep
          step="goal"
          goal={{ title: 'TOEIC 800点を取得する', kpi: '800点', deadline: '2024-12-31' }}
          onSubmit={mockOnSubmit}
          onBack={mockOnBack}
          loading={false}
        />
      );

      const goalInput = screen.getByLabelText('目標入力フィールド');
      expect(goalInput.props.value).toBe('TOEIC 800点を取得する');
    });
  });

  describe('アクセシビリティ', () => {
    it('全ての入力フィールドとボタンにaccessibilityLabelがあること', () => {
      render(
        <GoalStep
          step="goal"
          onSubmit={mockOnSubmit}
          onBack={mockOnBack}
          loading={false}
        />
      );

      // 入力フィールド
      expect(screen.getByLabelText('目標入力フィールド')).toBeDefined();
      expect(screen.getByLabelText('背景情報入力フィールド')).toBeDefined();

      // ボタン
      expect(screen.getByLabelText('戻る')).toBeDefined();
      expect(screen.getByLabelText('分析する')).toBeDefined();
    });

    it('障害ステップの入力フィールドにaccessibilityLabelがあること', () => {
      render(
        <GoalStep
          step="obstacles"
          onSubmit={mockOnSubmit}
          onBack={mockOnBack}
          loading={false}
        />
      );

      expect(screen.getByLabelText('障害入力フィールド')).toBeDefined();
      expect(screen.getByLabelText('対処計画入力フィールド')).toBeDefined();
    });
  });
});
