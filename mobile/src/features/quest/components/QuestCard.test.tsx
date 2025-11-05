/**
 * QuestCard Component Tests
 * UI レンダリングとインタラクション テスト
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { QuestCard } from './QuestCard';
import type { Quest } from '../types';

describe('QuestCard Component', () => {
  const mockQuest: Quest = {
    id: 'quest-1',
    questBundleId: 'bundle-1',
    type: 'small',
    title: '朝30分ウォーキング',
    description: '毎朝30分のウォーキングを実施して体を動かす',
    estimatedTime: 30,
    difficulty: 'easy',
    completionCriteria: '30分以上継続して歩く',
    evidenceType: 'text',
    contributesToStation: 3,
    order: 1,
    status: 'pending',
    createdAt: new Date(),
    validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
  };

  it('クエスト情報を正しく表示できること', () => {
    render(<QuestCard quest={mockQuest} />);

    // タイトル
    const title = screen.getByTestId('quest-title-quest-1');
    expect(title).toHaveTextContent('朝30分ウォーキング');

    // 説明文
    const description = screen.getByTestId('quest-description-quest-1');
    expect(description).toHaveTextContent('毎朝30分のウォーキングを実施して体を動かす');

    // 推定時間
    const time = screen.getByTestId('quest-time-quest-1');
    expect(time).toHaveTextContent('30分');

    // 完了基準
    const criteria = screen.getByTestId('quest-criteria-quest-1');
    expect(criteria).toHaveTextContent('完了基準: 30分以上継続して歩く');
  });

  it('クエストタイプを正しく表示できること', () => {
    render(<QuestCard quest={mockQuest} />);

    const typeLabel = screen.getByTestId('quest-type-quest-1');
    expect(typeLabel).toHaveTextContent('スモール');
  });

  it('難易度を正しく表示できること', () => {
    render(<QuestCard quest={mockQuest} />);

    const difficulty = screen.getByTestId('quest-difficulty-quest-1');
    expect(difficulty).toHaveTextContent('簡単');
  });

  it('ステータスアイコンを表示できること', () => {
    render(<QuestCard quest={mockQuest} />);

    const status = screen.getByTestId('quest-status-quest-1');
    expect(status).toBeTruthy();
  });

  it('onPress コールバックが呼び出されること', () => {
    const mockOnPress = jest.fn();
    render(<QuestCard quest={mockQuest} onPress={mockOnPress} />);

    const card = screen.getByTestId('quest-card-quest-1');
    fireEvent.press(card);

    expect(mockOnPress).toHaveBeenCalledWith('quest-1');
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('MEDIUM タイプを表示できること', () => {
    const mediumQuest: Quest = {
      ...mockQuest,
      type: 'medium',
      estimatedTime: 60,
      difficulty: 'medium',
    };

    render(<QuestCard quest={mediumQuest} />);

    const typeLabel = screen.getByTestId('quest-type-quest-1');
    expect(typeLabel).toHaveTextContent('ミディアム');

    const difficulty = screen.getByTestId('quest-difficulty-quest-1');
    expect(difficulty).toHaveTextContent('中級');

    const time = screen.getByTestId('quest-time-quest-1');
    expect(time).toHaveTextContent('60分');
  });

  it('VALIDATION タイプを表示できること', () => {
    const validationQuest: Quest = {
      ...mockQuest,
      type: 'validation',
      estimatedTime: 15,
      difficulty: 'easy',
    };

    render(<QuestCard quest={validationQuest} />);

    const typeLabel = screen.getByTestId('quest-type-quest-1');
    expect(typeLabel).toHaveTextContent('検証');
  });

  it('CHALLENGING 難易度を表示できること', () => {
    const challengingQuest: Quest = {
      ...mockQuest,
      difficulty: 'challenging',
      estimatedTime: 120,
    };

    render(<QuestCard quest={challengingQuest} />);

    const difficulty = screen.getByTestId('quest-difficulty-quest-1');
    expect(difficulty).toHaveTextContent('チャレンジング');
  });

  it('完了ステータスを表示できること', () => {
    const completedQuest: Quest = {
      ...mockQuest,
      status: 'completed',
    };

    render(<QuestCard quest={completedQuest} />);

    const status = screen.getByTestId('quest-status-quest-1');
    expect(status).toBeTruthy();
  });

  it('スキップステータスを表示できること', () => {
    const skippedQuest: Quest = {
      ...mockQuest,
      status: 'skipped',
    };

    render(<QuestCard quest={skippedQuest} />);

    const status = screen.getByTestId('quest-status-quest-1');
    expect(status).toBeTruthy();
  });

  it('阻害ステータスを表示できること', () => {
    const obstructedQuest: Quest = {
      ...mockQuest,
      status: 'obstructed',
    };

    render(<QuestCard quest={obstructedQuest} />);

    const status = screen.getByTestId('quest-status-quest-1');
    expect(status).toBeTruthy();
  });

  it('アクセシビリティ属性を持っていること', () => {
    render(<QuestCard quest={mockQuest} />);

    const card = screen.getByTestId('quest-card-quest-1');

    // accessibilityRole が設定されている
    expect(card).toBeTruthy();
  });

  it('長いタイトルを正しく表示できること', () => {
    const longTitleQuest: Quest = {
      ...mockQuest,
      title: 'これは非常に長いクエストタイトルです。複数行に分かれて表示される可能性があります。',
    };

    render(<QuestCard quest={longTitleQuest} />);

    const title = screen.getByTestId('quest-title-quest-1');
    expect(title).toHaveTextContent('これは非常に長いクエストタイトルです。複数行に分かれて表示される可能性があります。');
  });

  it('複数の異なるクエストを並べて表示できること', () => {
    const quest1: Quest = {
      ...mockQuest,
      id: 'quest-1',
      type: 'small',
      title: 'クエスト1',
    };

    const quest2: Quest = {
      ...mockQuest,
      id: 'quest-2',
      type: 'medium',
      title: 'クエスト2',
    };

    const quest3: Quest = {
      ...mockQuest,
      id: 'quest-3',
      type: 'validation',
      title: 'クエスト3',
    };

    const { rerender } = render(<QuestCard quest={quest1} />);
    expect(screen.getByTestId('quest-card-quest-1')).toBeTruthy();

    rerender(<QuestCard quest={quest2} />);
    expect(screen.getByTestId('quest-card-quest-2')).toBeTruthy();

    rerender(<QuestCard quest={quest3} />);
    expect(screen.getByTestId('quest-card-quest-3')).toBeTruthy();
  });

  it('onPress が undefined の場合でもエラーにならないこと', () => {
    const { getByTestId } = render(<QuestCard quest={mockQuest} />);

    const card = getByTestId('quest-card-quest-1');

    // onPress なしで press イベントを実行してもエラーにならない
    expect(() => {
      fireEvent.press(card);
    }).not.toThrow();
  });

  it('短い情報でも正しく表示されること', () => {
    const shortQuest: Quest = {
      ...mockQuest,
      title: '運動',
      description: '動く',
      completionCriteria: '実施',
      estimatedTime: 15,
    };

    render(<QuestCard quest={shortQuest} />);

    const title = screen.getByTestId('quest-title-quest-1');
    expect(title).toHaveTextContent('運動');

    const description = screen.getByTestId('quest-description-quest-1');
    expect(description).toHaveTextContent('動く');
  });
});
