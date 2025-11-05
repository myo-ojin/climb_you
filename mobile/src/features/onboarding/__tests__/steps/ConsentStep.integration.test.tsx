/**
 * ConsentStep 統合テスト
 * 同意画面の動作確認
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Alert } from 'react-native';
import ConsentStep from '../../steps/ConsentStep';
import type { ConsentData } from '../../types';

// Alert.alertをモック
jest.spyOn(Alert, 'alert');

describe('ConsentStep 統合テスト', () => {
  const mockOnAgree = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('画面表示', () => {
    it('同意画面が正しく表示されること', () => {
      render(
        <ConsentStep
          onAgree={mockOnAgree}
          onCancel={mockOnCancel}
          loading={false}
        />
      );

      // タイトル確認
      expect(screen.getByText('climb-youへようこそ')).toBeDefined();

      // サブタイトル確認
      expect(screen.getByText(/長期目標を達成するための準備をしましょう/)).toBeDefined();

      // セクションタイトル確認
      expect(screen.getByText('データ収集と利用について')).toBeDefined();
      expect(screen.getByText('データ保護')).toBeDefined();

      // チェックボックスラベル確認
      expect(screen.getByText('データ収集と利用に同意する')).toBeDefined();
      expect(screen.getByText('プライバシーポリシーに同意する')).toBeDefined();

      // ボタン確認
      expect(screen.getByText('キャンセル')).toBeDefined();
      expect(screen.getByText('同意して続行')).toBeDefined();
    });

    it('データ収集内容が表示されること', () => {
      render(
        <ConsentStep
          onAgree={mockOnAgree}
          onCancel={mockOnCancel}
          loading={false}
        />
      );

      // データ収集項目
      expect(screen.getByText(/長期目標と期間/)).toBeDefined();
      expect(screen.getByText(/1日のコミット時間とライフスタイル/)).toBeDefined();
      expect(screen.getByText(/クエスト完了履歴と進捗状況/)).toBeDefined();
      expect(screen.getByText(/プロファイル情報/)).toBeDefined();
      expect(screen.getByText(/アプリの利用パターン/)).toBeDefined();
    });

    it('データ保護情報が表示されること', () => {
      render(
        <ConsentStep
          onAgree={mockOnAgree}
          onCancel={mockOnCancel}
          loading={false}
        />
      );

      expect(screen.getByText(/データは暗号化されて保存されます/)).toBeDefined();
      expect(screen.getByText(/あなたを個人特定するデータは匿名IDで管理されます/)).toBeDefined();
      expect(screen.getByText(/クエストログは180日間保持されます/)).toBeDefined();
    });
  });

  describe('チェックボックス操作', () => {
    it('データ収集チェックボックスをクリックできること', () => {
      render(
        <ConsentStep
          onAgree={mockOnAgree}
          onCancel={mockOnCancel}
          loading={false}
        />
      );

      // データ収集チェックボックス取得
      const dataCheckbox = screen.getByLabelText('データ収集に同意する');
      expect(dataCheckbox).toBeDefined();

      // クリック
      fireEvent.press(dataCheckbox);

      // チェックマークが表示される（checkmarkテキストを確認）
      const checkmarks = screen.queryAllByText('✓');
      expect(checkmarks.length).toBeGreaterThan(0);
    });

    it('プライバシーポリシーチェックボックスをクリックできること', () => {
      render(
        <ConsentStep
          onAgree={mockOnAgree}
          onCancel={mockOnCancel}
          loading={false}
        />
      );

      // プライバシーポリシーチェックボックス取得
      const privacyCheckbox = screen.getByLabelText('プライバシーポリシーに同意する');
      expect(privacyCheckbox).toBeDefined();

      // クリック
      fireEvent.press(privacyCheckbox);

      // チェックマークが表示される
      const checkmarks = screen.queryAllByText('✓');
      expect(checkmarks.length).toBeGreaterThan(0);
    });

    it('両方のチェックボックスをチェックできること', () => {
      render(
        <ConsentStep
          onAgree={mockOnAgree}
          onCancel={mockOnCancel}
          loading={false}
        />
      );

      // 両方クリック
      const dataCheckbox = screen.getByLabelText('データ収集に同意する');
      const privacyCheckbox = screen.getByLabelText('プライバシーポリシーに同意する');

      fireEvent.press(dataCheckbox);
      fireEvent.press(privacyCheckbox);

      // 2つのチェックマークが表示される
      const checkmarks = screen.queryAllByText('✓');
      expect(checkmarks.length).toBe(2);
    });
  });

  describe('同意ボタン', () => {
    it('両方チェックすると同意ボタンが有効になること', () => {
      render(
        <ConsentStep
          onAgree={mockOnAgree}
          onCancel={mockOnCancel}
          loading={false}
        />
      );

      const dataCheckbox = screen.getByLabelText('データ収集に同意する');
      const privacyCheckbox = screen.getByLabelText('プライバシーポリシーに同意する');
      const agreeButton = screen.getByLabelText('同意して続行');

      // 初期状態: 無効
      expect(agreeButton.props.accessibilityState?.disabled).toBe(true);

      // 両方チェック
      fireEvent.press(dataCheckbox);
      fireEvent.press(privacyCheckbox);

      // 有効になる
      expect(agreeButton.props.accessibilityState?.disabled).toBe(false);
    });

    it('両方チェックして同意ボタンを押すとonAgreeが呼ばれること', () => {
      render(
        <ConsentStep
          onAgree={mockOnAgree}
          onCancel={mockOnCancel}
          loading={false}
        />
      );

      const dataCheckbox = screen.getByLabelText('データ収集に同意する');
      const privacyCheckbox = screen.getByLabelText('プライバシーポリシーに同意する');
      const agreeButton = screen.getByLabelText('同意して続行');

      // 両方チェック
      fireEvent.press(dataCheckbox);
      fireEvent.press(privacyCheckbox);

      // 同意ボタンクリック
      fireEvent.press(agreeButton);

      // onAgreeが呼ばれる
      expect(mockOnAgree).toHaveBeenCalledTimes(1);
      expect(mockOnAgree).toHaveBeenCalledWith({
        dataCollection: true,
        privacyPolicy: true,
        timestamp: expect.any(Number),
      });
    });

    it('片方のみチェックでは同意できないこと', () => {
      render(
        <ConsentStep
          onAgree={mockOnAgree}
          onCancel={mockOnCancel}
          loading={false}
        />
      );

      const dataCheckbox = screen.getByLabelText('データ収集に同意する');
      const agreeButton = screen.getByLabelText('同意して続行');

      // データ収集のみチェック
      fireEvent.press(dataCheckbox);

      // 同意ボタンクリック
      fireEvent.press(agreeButton);

      // onAgreeは呼ばれない（ボタンがdisabledなので）
      expect(mockOnAgree).not.toHaveBeenCalled();
    });
  });

  describe('キャンセルボタン', () => {
    it('キャンセルボタンを押すとonCancelが呼ばれること', () => {
      render(
        <ConsentStep
          onAgree={mockOnAgree}
          onCancel={mockOnCancel}
          loading={false}
        />
      );

      const cancelButton = screen.getByLabelText('キャンセル');

      fireEvent.press(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('loading中はキャンセルボタンが無効になること', () => {
      render(
        <ConsentStep
          onAgree={mockOnAgree}
          onCancel={mockOnCancel}
          loading={true}
        />
      );

      const cancelButton = screen.getByLabelText('キャンセル');

      expect(cancelButton.props.accessibilityState?.disabled).toBe(true);
    });
  });

  describe('ローディング状態', () => {
    it('loading中は同意ボタンが無効になること', () => {
      render(
        <ConsentStep
          onAgree={mockOnAgree}
          onCancel={mockOnCancel}
          loading={true}
        />
      );

      const dataCheckbox = screen.getByLabelText('データ収集に同意する');
      const privacyCheckbox = screen.getByLabelText('プライバシーポリシーに同意する');
      const agreeButton = screen.getByLabelText('同意して続行');

      // 両方チェック
      fireEvent.press(dataCheckbox);
      fireEvent.press(privacyCheckbox);

      // loadingなので無効のまま
      expect(agreeButton.props.accessibilityState?.disabled).toBe(true);
    });
  });

  describe('アクセシビリティ', () => {
    it('すべてのインタラクティブ要素にaccessibilityLabelがあること', () => {
      render(
        <ConsentStep
          onAgree={mockOnAgree}
          onCancel={mockOnCancel}
          loading={false}
        />
      );

      // チェックボックス
      expect(screen.getByLabelText('データ収集に同意する')).toBeDefined();
      expect(screen.getByLabelText('プライバシーポリシーに同意する')).toBeDefined();

      // ボタン
      expect(screen.getByLabelText('キャンセル')).toBeDefined();
      expect(screen.getByLabelText('同意して続行')).toBeDefined();
    });
  });
});
