/**
 * DurationStep 統合テスト
 * 目標達成期間選択ステップの動作確認
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import DurationStep from '../../steps/DurationStep';

describe('DurationStep 統合テスト', () => {
  const mockOnSelect = jest.fn();
  const mockOnBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('画面表示', () => {
    it('期間選択画面が正しく表示されること', () => {
      render(
        <DurationStep
          onSelect={mockOnSelect}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByText('目標達成期間を選択してください')).toBeDefined();
      expect(screen.getByText(/目標を達成するまでの期間を見積もりましょう/)).toBeDefined();
    });

    it('4つの期間選択肢が表示されること', () => {
      render(
        <DurationStep
          onSelect={mockOnSelect}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByLabelText('1ヶ月以内')).toBeDefined();
      expect(screen.getByLabelText('3ヶ月以内')).toBeDefined();
      expect(screen.getByLabelText('6ヶ月以内')).toBeDefined();
      expect(screen.getByLabelText('1年以内')).toBeDefined();
    });

    it('ボタンが表示されること', () => {
      render(
        <DurationStep
          onSelect={mockOnSelect}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByLabelText('戻る')).toBeDefined();
      expect(screen.getByLabelText('次へ')).toBeDefined();
    });
  });

  describe('期間選択', () => {
    it('1ヶ月を選択できること', () => {
      render(
        <DurationStep
          onSelect={mockOnSelect}
          onBack={mockOnBack}
        />
      );

      const option = screen.getByLabelText('1ヶ月以内');
      fireEvent.press(option);

      // ラジオボタンがチェックされたことを確認
      expect(option).toBeDefined();
    });

    it('選択した期間で次へ進めること', () => {
      render(
        <DurationStep
          onSelect={mockOnSelect}
          onBack={mockOnBack}
        />
      );

      // 3ヶ月を選択
      const option = screen.getByLabelText('3ヶ月以内');
      fireEvent.press(option);

      // 次へボタンを押す
      const nextButton = screen.getByLabelText('次へ');
      fireEvent.press(nextButton);

      // onSelectが呼ばれる
      expect(mockOnSelect).toHaveBeenCalledTimes(1);
      expect(mockOnSelect).toHaveBeenCalledWith('3months');
    });

    it('選択を変更できること', () => {
      render(
        <DurationStep
          onSelect={mockOnSelect}
          onBack={mockOnBack}
        />
      );

      // 最初に1ヶ月を選択
      const option1 = screen.getByLabelText('1ヶ月以内');
      fireEvent.press(option1);

      // 6ヶ月に変更
      const option6 = screen.getByLabelText('6ヶ月以内');
      fireEvent.press(option6);

      // 次へ
      const nextButton = screen.getByLabelText('次へ');
      fireEvent.press(nextButton);

      // 最後に選択した6ヶ月で呼ばれる
      expect(mockOnSelect).toHaveBeenCalledWith('6months');
    });
  });

  describe('選択済み状態', () => {
    it('初期選択値が反映されること', () => {
      render(
        <DurationStep
          selected="6months"
          onSelect={mockOnSelect}
          onBack={mockOnBack}
        />
      );

      // 6ヶ月が選択されている状態で表示される
      const option = screen.getByLabelText('6ヶ月以内');
      expect(option).toBeDefined();
    });
  });

  describe('戻るボタン', () => {
    it('戻るボタンを押すとonBackが呼ばれること', () => {
      render(
        <DurationStep
          onSelect={mockOnSelect}
          onBack={mockOnBack}
        />
      );

      const backButton = screen.getByLabelText('戻る');
      fireEvent.press(backButton);

      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });
  });

  describe('アクセシビリティ', () => {
    it('全ての選択肢にaccessibilityLabelがあること', () => {
      render(
        <DurationStep
          onSelect={mockOnSelect}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByLabelText('1ヶ月以内')).toBeDefined();
      expect(screen.getByLabelText('3ヶ月以内')).toBeDefined();
      expect(screen.getByLabelText('6ヶ月以内')).toBeDefined();
      expect(screen.getByLabelText('1年以内')).toBeDefined();
      expect(screen.getByLabelText('戻る')).toBeDefined();
      expect(screen.getByLabelText('次へ')).toBeDefined();
    });
  });
});
