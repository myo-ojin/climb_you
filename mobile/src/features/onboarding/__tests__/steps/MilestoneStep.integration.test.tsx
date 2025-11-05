/**
 * MilestoneStep 統合テスト
 * 10合目マイルストーン確認ステップの動作確認
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Alert } from 'react-native';
import MilestoneStep from '../../steps/MilestoneStep';
import type { Milestone } from '../../types';

// Alert.alertをモック
jest.spyOn(Alert, 'alert');

// MilestoneCard コンポーネントをモック
jest.mock('../../components/MilestoneCard', () => {
  const React = require('react');
  const { TouchableOpacity, Text } = require('react-native');

  return ({ milestone, isExpanded, onToggle }: any) => (
    <TouchableOpacity onPress={onToggle}>
      <Text>Milestone {milestone.station}合目: {milestone.title}</Text>
      {isExpanded && <Text>Details: {milestone.description}</Text>}
    </TouchableOpacity>
  );
});

describe('MilestoneStep 統合テスト', () => {
  const mockOnConfirm = jest.fn();
  const mockOnBack = jest.fn();

  const mockMilestones: Milestone[] = [
    {
      station: 1,
      title: '基礎文法の学習',
      description: '基本的な英文法を理解する',
      completionCriteria: 'TOEIC Part5で正答率80%以上',
      estimatedDuration: 14,
      difficultyLevel: 'easy',
    },
    {
      station: 2,
      title: '語彙力の強化',
      description: '頻出単語を習得する',
      completionCriteria: '2000単語をマスター',
      estimatedDuration: 21,
      difficultyLevel: 'medium',
    },
    // ... 他の8個のマイルストーン（省略）
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('画面表示', () => {
    it('マイルストーン確認画面が正しく表示されること', () => {
      render(
        <MilestoneStep
          milestones={mockMilestones}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
          loading={false}
        />
      );

      expect(screen.getByText('マイルストーン確認')).toBeDefined();
      expect(screen.getByText('10合目の山登りが準備できました')).toBeDefined();
    });

    it('ボタンが表示されること', () => {
      render(
        <MilestoneStep
          milestones={mockMilestones}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
          loading={false}
        />
      );

      expect(screen.getByLabelText('戻る')).toBeDefined();
      expect(screen.getByLabelText('確認')).toBeDefined();
    });

    it('注意事項が表示されること', () => {
      render(
        <MilestoneStep
          milestones={mockMilestones}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
          loading={false}
        />
      );

      expect(screen.getByText('📝 ご確認ください')).toBeDefined();
      expect(screen.getByText('• 各合目の達成条件が明確ですか？')).toBeDefined();
      expect(screen.getByText('• 予想所要期間は現実的ですか？')).toBeDefined();
    });
  });

  describe('空の状態', () => {
    it('マイルストーンが空の場合、生成中メッセージが表示されること', () => {
      render(
        <MilestoneStep
          milestones={[]}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
          loading={false}
        />
      );

      expect(screen.getByText('マイルストーンを生成中...')).toBeDefined();
    });

    it('マイルストーンが空の場合、ボタンが表示されないこと', () => {
      render(
        <MilestoneStep
          milestones={[]}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
          loading={false}
        />
      );

      expect(screen.queryByLabelText('戻る')).toBeNull();
      expect(screen.queryByLabelText('確認')).toBeNull();
    });

    it('マイルストーンが空の場合、ActivityIndicatorが表示されること', () => {
      const { UNSAFE_root } = render(
        <MilestoneStep
          milestones={[]}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
          loading={false}
        />
      );

      const activityIndicators = UNSAFE_root.findAllByType('ActivityIndicator' as any);
      expect(activityIndicators.length).toBeGreaterThan(0);
    });
  });

  describe('マイルストーン表示', () => {
    it('マイルストーンリストが表示されること', () => {
      render(
        <MilestoneStep
          milestones={mockMilestones}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
          loading={false}
        />
      );

      expect(screen.getByText('Milestone 1合目: 基礎文法の学習')).toBeDefined();
      expect(screen.getByText('Milestone 2合目: 語彙力の強化')).toBeDefined();
    });

    it('山のビジュアルタイトルが表示されること', () => {
      render(
        <MilestoneStep
          milestones={mockMilestones}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
          loading={false}
        />
      );

      expect(screen.getByText('🏔️ あなたの目標の山')).toBeDefined();
    });

    it('マイルストーン数が表示されること', () => {
      render(
        <MilestoneStep
          milestones={mockMilestones}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
          loading={false}
        />
      );

      expect(screen.getByText('全2段階のマイルストーン')).toBeDefined();
    });
  });

  describe('マイルストーンの展開', () => {
    it('マイルストーンをクリックすると詳細が表示されること', () => {
      render(
        <MilestoneStep
          milestones={mockMilestones}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
          loading={false}
        />
      );

      // 初期状態では詳細が非表示
      expect(screen.queryByText('Details: 基本的な英文法を理解する')).toBeNull();

      // マイルストーンをクリック
      const milestone1 = screen.getByText('Milestone 1合目: 基礎文法の学習');
      fireEvent.press(milestone1);

      // 詳細が表示される
      expect(screen.getByText('Details: 基本的な英文法を理解する')).toBeDefined();
    });

    it('展開中のマイルストーンを再度クリックすると折りたたまれること', () => {
      render(
        <MilestoneStep
          milestones={mockMilestones}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
          loading={false}
        />
      );

      const milestone1 = screen.getByText('Milestone 1合目: 基礎文法の学習');

      // 展開
      fireEvent.press(milestone1);
      expect(screen.getByText('Details: 基本的な英文法を理解する')).toBeDefined();

      // 折りたたみ
      fireEvent.press(milestone1);
      expect(screen.queryByText('Details: 基本的な英文法を理解する')).toBeNull();
    });
  });

  describe('確認ボタン', () => {
    it('確認ボタンを押すとonConfirmが呼ばれること', () => {
      render(
        <MilestoneStep
          milestones={mockMilestones}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
          loading={false}
        />
      );

      const confirmButton = screen.getByLabelText('確認');
      fireEvent.press(confirmButton);

      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
      expect(mockOnConfirm).toHaveBeenCalledWith(mockMilestones);
    });

    it('loading中は確認ボタンが無効になること', () => {
      render(
        <MilestoneStep
          milestones={mockMilestones}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
          loading={true}
        />
      );

      const confirmButton = screen.getByLabelText('確認');
      expect(confirmButton.props.accessibilityState?.disabled).toBe(true);
    });

    it('loading中はActivityIndicatorが表示されること', () => {
      const { UNSAFE_root } = render(
        <MilestoneStep
          milestones={mockMilestones}
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
        <MilestoneStep
          milestones={mockMilestones}
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
        <MilestoneStep
          milestones={mockMilestones}
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
        <MilestoneStep
          milestones={mockMilestones}
          onConfirm={mockOnConfirm}
          onBack={mockOnBack}
          loading={false}
        />
      );

      expect(screen.getByLabelText('戻る')).toBeDefined();
      expect(screen.getByLabelText('確認')).toBeDefined();
    });
  });
});
