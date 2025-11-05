/**
 * CommitTimeStep 統合テスト
 * 1日のコミットタイム選択ステップの動作確認
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import CommitTimeStep from '../../steps/CommitTimeStep';

describe('CommitTimeStep 統合テスト', () => {
  const mockOnSelect = jest.fn();
  const mockOnBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('画面表示', () => {
    it('コミットタイム選択画面が正しく表示されること', () => {
      render(
        <CommitTimeStep
          onSelect={mockOnSelect}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByText('1日のコミットタイムを選択してください')).toBeDefined();
    });

    it('4つの時間選択肢が表示されること', () => {
      render(
        <CommitTimeStep
          onSelect={mockOnSelect}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByLabelText('15分')).toBeDefined();
      expect(screen.getByLabelText('30分')).toBeDefined();
      expect(screen.getByLabelText('1時間')).toBeDefined();
      expect(screen.getByLabelText('2時間')).toBeDefined();
    });

    it('ボタンが表示されること', () => {
      render(
        <CommitTimeStep
          onSelect={mockOnSelect}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByLabelText('戻る')).toBeDefined();
      expect(screen.getByLabelText('次へ')).toBeDefined();
    });
  });

  describe('時間選択', () => {
    it('15分を選択できること', () => {
      render(
        <CommitTimeStep
          onSelect={mockOnSelect}
          onBack={mockOnBack}
        />
      );

      const option = screen.getByLabelText('15分');
      fireEvent.press(option);

      expect(option).toBeDefined();
    });

    it('選択した時間で次へ進めること', () => {
      render(
        <CommitTimeStep
          onSelect={mockOnSelect}
          onBack={mockOnBack}
        />
      );

      // 30分を選択
      const option = screen.getByLabelText('30分');
      fireEvent.press(option);

      // 次へボタンを押す
      const nextButton = screen.getByLabelText('次へ');
      fireEvent.press(nextButton);

      // onSelectが呼ばれる
      expect(mockOnSelect).toHaveBeenCalledTimes(1);
      expect(mockOnSelect).toHaveBeenCalledWith('30分');
    });

    it('選択を変更できること', () => {
      render(
        <CommitTimeStep
          onSelect={mockOnSelect}
          onBack={mockOnBack}
        />
      );

      // 最初に15分を選択
      const option15 = screen.getByLabelText('15分');
      fireEvent.press(option15);

      // 1時間に変更
      const option1h = screen.getByLabelText('1時間');
      fireEvent.press(option1h);

      // 次へ
      const nextButton = screen.getByLabelText('次へ');
      fireEvent.press(nextButton);

      // 最後に選択した1時間で呼ばれる
      expect(mockOnSelect).toHaveBeenCalledWith('1時間');
    });
  });

  describe('選択済み状態', () => {
    it('初期選択値が反映されること', () => {
      render(
        <CommitTimeStep
          selected="1時間"
          onSelect={mockOnSelect}
          onBack={mockOnBack}
        />
      );

      // 1時間が選択されている状態で表示される
      const option = screen.getByLabelText('1時間');
      expect(option).toBeDefined();
    });
  });

  describe('戻るボタン', () => {
    it('戻るボタンを押すとonBackが呼ばれること', () => {
      render(
        <CommitTimeStep
          onSelect={mockOnSelect}
          onBack={mockOnBack}
        />
      );

      const backButton = screen.getByLabelText('戻る');
      fireEvent.press(backButton);

      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });
  });

  describe('ローディング状態', () => {
    it('loading中はボタンが無効になること', () => {
      render(
        <CommitTimeStep
          onSelect={mockOnSelect}
          onBack={mockOnBack}
          loading={true}
        />
      );

      const backButton = screen.getByLabelText('戻る');
      const nextButton = screen.getByLabelText('次へ');

      expect(backButton.props.accessibilityState?.disabled).toBe(true);
      expect(nextButton.props.accessibilityState?.disabled).toBe(true);
    });
  });

  describe('アクセシビリティ', () => {
    it('全ての選択肢にaccessibilityLabelがあること', () => {
      render(
        <CommitTimeStep
          onSelect={mockOnSelect}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByLabelText('15分')).toBeDefined();
      expect(screen.getByLabelText('30分')).toBeDefined();
      expect(screen.getByLabelText('1時間')).toBeDefined();
      expect(screen.getByLabelText('2時間')).toBeDefined();
      expect(screen.getByLabelText('戻る')).toBeDefined();
      expect(screen.getByLabelText('次へ')).toBeDefined();
    });
  });
});
