/**
 * QuestCard Accessibility Test
 * アクセシビリティ要件のテスト
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { QuestCard } from '../QuestCard';
import type { Quest } from '../../types';

// Mock hooks
jest.mock('@/shared/hooks', () => ({
  useAccessibleTheme: jest.fn(() => ({
    colors: {},
    background: '#FFFFFF',
    surface: '#F5F5F5',
    text: '#000000',
    textSecondary: '#616161',
    border: '#E0E0E0',
    elevation: {
      level0: 'transparent',
      level1: '#FFFFFF',
      level2: '#F5F5F5',
    },
  })),
  useBorderStyle: jest.fn(() => ({
    borderColor: '#E0E0E0',
    borderWidth: 1,
  })),
  useDynamicTextSize: jest.fn(() => ({
    fontScale: 1.0,
    isLargeTextEnabled: false,
    isMaxScaleReached: false,
    isMinScaleReached: false,
    scaleFont: (size: number) => size,
  })),
}));

describe('QuestCard - Accessibility', () => {
  const mockQuest: Quest = {
    id: 'quest-1',
    title: 'テストクエスト',
    description: 'テスト用のクエスト説明文',
    type: 'small',
    difficulty: 'easy',
    estimatedTime: 30,
    completionCriteria: '完了基準のテスト',
    evidenceType: 'text',
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('WCAG 1.1.1: 非テキストコンテンツ', () => {
    it('accessibilityLabelが設定されている', () => {
      const { getByRole } = render(<QuestCard quest={mockQuest} />);

      const button = getByRole('button');
      expect(button.props.accessibilityLabel).toBeTruthy();
      expect(button.props.accessibilityLabel).toContain('テストクエスト');
    });

    it('クエストタイプがaccessibilityLabelに含まれる', () => {
      const { getByRole } = render(<QuestCard quest={mockQuest} />);

      const button = getByRole('button');
      expect(button.props.accessibilityLabel).toContain('スモール');
    });

    it('推定時間がaccessibilityLabelに含まれる', () => {
      const { getByRole } = render(<QuestCard quest={mockQuest} />);

      const button = getByRole('button');
      expect(button.props.accessibilityLabel).toContain('推定時間30分');
    });

    it('難易度がaccessibilityLabelに含まれる', () => {
      const { getByRole } = render(<QuestCard quest={mockQuest} />);

      const button = getByRole('button');
      expect(button.props.accessibilityLabel).toContain('簡単');
    });
  });

  describe('WCAG 1.3.1: 情報および関係性', () => {
    it('accessibilityRoleが"button"として設定されている', () => {
      const { getByRole } = render(<QuestCard quest={mockQuest} />);

      const button = getByRole('button');
      expect(button.props.accessibilityRole).toBe('button');
    });

    it('testIDが正しく設定されている', () => {
      const { getByTestId } = render(<QuestCard quest={mockQuest} />);

      expect(getByTestId('quest-card-quest-1')).toBeTruthy();
      expect(getByTestId('quest-title-quest-1')).toBeTruthy();
      expect(getByTestId('quest-description-quest-1')).toBeTruthy();
      expect(getByTestId('quest-time-quest-1')).toBeTruthy();
      expect(getByTestId('quest-difficulty-quest-1')).toBeTruthy();
      expect(getByTestId('quest-status-quest-1')).toBeTruthy();
    });
  });

  describe('WCAG 1.4.1: 色の使用', () => {
    it('難易度が色とテキストの両方で表現されている', () => {
      const { getByTestId } = render(<QuestCard quest={mockQuest} />);

      const difficultyText = getByTestId('quest-difficulty-quest-1');
      expect(difficultyText.props.children).toBe('簡単');
    });

    it('クエストタイプが色とテキストの両方で表現されている', () => {
      const { getByTestId } = render(<QuestCard quest={mockQuest} />);

      const typeText = getByTestId('quest-type-quest-1');
      expect(typeText.props.children).toBe('スモール');
    });

    it('ステータスが色とアイコンの両方で表現されている', () => {
      const { getByTestId } = render(<QuestCard quest={mockQuest} />);

      const statusIcon = getByTestId('quest-status-quest-1');
      expect(statusIcon.props.children).toBe('◯'); // pending状態のアイコン
    });
  });

  describe('WCAG 2.1.1: キーボード操作', () => {
    it('accessible prop がtrueに設定されている（暗黙的）', () => {
      const { getByRole } = render(<QuestCard quest={mockQuest} />);

      const button = getByRole('button');
      // TouchableOpacityはデフォルトでaccessible={true}
      expect(button.props.accessible).not.toBe(false);
    });

    it('TouchableOpacityコンポーネントとしてレンダリングされる', () => {
      const mockOnPress = jest.fn();
      const { getByRole } = render(
        <QuestCard quest={mockQuest} onPress={mockOnPress} />
      );

      const button = getByRole('button');
      // ボタンとして認識されていることを確認
      expect(button).toBeTruthy();
      expect(button.props.accessibilityRole).toBe('button');
    });
  });

  describe('WCAG 2.4.4: リンクの目的', () => {
    it('accessibilityLabelがクエストの内容を明確に説明している', () => {
      const { getByRole } = render(<QuestCard quest={mockQuest} />);

      const button = getByRole('button');
      const label = button.props.accessibilityLabel;

      // クエストの主要な情報がすべて含まれている
      expect(label).toContain('テストクエスト');
      expect(label).toContain('スモール');
      expect(label).toContain('推定時間30分');
      expect(label).toContain('難易度簡単');
    });
  });

  describe('WCAG 4.1.2: 名前、役割、値', () => {
    it('すべての必須アクセシビリティプロパティが設定されている', () => {
      const { getByRole } = render(<QuestCard quest={mockQuest} />);

      const button = getByRole('button');
      expect(button.props.accessibilityLabel).toBeTruthy();
      expect(button.props.accessibilityRole).toBe('button');
    });
  });

  describe('難易度のバリエーション', () => {
    it.each([
      ['easy', '簡単'],
      ['medium', '中級'],
      ['challenging', 'チャレンジング'],
    ])('難易度%sが正しく表示される', (difficulty, expected) => {
      const quest = {
        ...mockQuest,
        difficulty: difficulty as 'easy' | 'medium' | 'challenging',
      };
      const { getByTestId } = render(<QuestCard quest={quest} />);

      const difficultyText = getByTestId('quest-difficulty-quest-1');
      expect(difficultyText.props.children).toBe(expected);
    });
  });

  describe('クエストタイプのバリエーション', () => {
    it.each([
      ['small', 'スモール'],
      ['medium', 'ミディアム'],
      ['validation', '検証'],
    ])('タイプ%sが正しく表示される', (type, expected) => {
      const quest = {
        ...mockQuest,
        type: type as 'small' | 'medium' | 'validation',
      };
      const { getByTestId } = render(<QuestCard quest={quest} />);

      const typeText = getByTestId('quest-type-quest-1');
      expect(typeText.props.children).toBe(expected);
    });
  });

  describe('ステータスのバリエーション', () => {
    it.each([
      ['pending', '◯'],
      ['completed', '✅'],
      ['skipped', '⏭️'],
      ['obstructed', '🚧'],
    ])('ステータス%sが正しいアイコンで表示される', (status, expectedIcon) => {
      const quest = {
        ...mockQuest,
        status: status as 'pending' | 'completed' | 'skipped' | 'obstructed',
      };
      const { getByTestId } = render(<QuestCard quest={quest} />);

      const statusIcon = getByTestId('quest-status-quest-1');
      expect(statusIcon.props.children).toBe(expectedIcon);
    });
  });

  describe('ScaledTextコンポーネントの使用', () => {
    it('タイトルが正しくレンダリングされる', () => {
      const { getByTestId } = render(<QuestCard quest={mockQuest} />);

      const title = getByTestId('quest-title-quest-1');
      // タイトルが存在し、テキストが正しいことを確認
      expect(title).toBeTruthy();
      expect(title.props.children).toBe('テストクエスト');
    });

    it('説明文が正しくレンダリングされる', () => {
      const { getByTestId } = render(<QuestCard quest={mockQuest} />);

      const description = getByTestId('quest-description-quest-1');
      // 説明文が存在し、テキストが正しいことを確認
      expect(description).toBeTruthy();
      expect(description.props.children).toBe('テスト用のクエスト説明文');
    });
  });

  describe('テーマの適用', () => {
    it('useAccessibleThemeが呼び出されている', () => {
      const { useAccessibleTheme } = require('@/shared/hooks');

      render(<QuestCard quest={mockQuest} />);

      expect(useAccessibleTheme).toHaveBeenCalled();
    });

    it('useBorderStyleが呼び出されている', () => {
      const { useBorderStyle } = require('@/shared/hooks');

      render(<QuestCard quest={mockQuest} />);

      expect(useBorderStyle).toHaveBeenCalled();
    });
  });
});
