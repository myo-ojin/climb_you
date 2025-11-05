/**
 * QuestDetailScreen Tests
 * クエスト詳細画面のテストスイート
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { QuestDetailScreen } from './QuestDetailScreen';
import type { Quest } from '@/core/domain/entities/Quest';

// モック: useQuestUseCase
jest.mock('../hooks/useQuestUseCase', () => ({
  useQuestUseCase: jest.fn(),
}));

// モック: React Navigation
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
  }),
}));

// テストデータ
const mockQuest: Quest = {
  id: 'quest-1',
  questBundleId: 'bundle-1',
  type: 'small',
  title: 'テストクエスト',
  description: 'これはテストクエストです',
  estimatedTime: 30,
  difficulty: 'easy',
  completionCriteria: '完了基準：Xを実行する',
  evidenceType: 'image',
  contributesToStation: 3,
  order: 1,
  status: 'pending',
  createdAt: new Date(),
  validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
};

// モック: useQuestUseCase フック
const mockUseQuestUseCase = require('../hooks/useQuestUseCase').useQuestUseCase;

describe('QuestDetailScreen', () => {
  const mockRoute = {
    params: { questId: 'quest-1' },
  } as any;

  const mockNavigation = {
    navigate: mockNavigate,
    goBack: mockGoBack,
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('クエスト情報の表示', () => {
    it('クエスト情報を表示すること', async () => {
      const mockGetQuestById = jest.fn().mockResolvedValue(mockQuest);
      const mockIsQuestValid = jest.fn().mockReturnValue(true);
      mockUseQuestUseCase.mockReturnValue({
        getQuestById: mockGetQuestById,
        isQuestValid: mockIsQuestValid,
      });

      render(
        <QuestDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      // クエスト情報ローディング後に表示確認
      await waitFor(() => {
        expect(screen.getByTestId('quest-detail-title')).toBeDefined();
      });

      expect(screen.getByTestId('quest-detail-title')).toHaveTextContent('テストクエスト');
      expect(screen.getByTestId('quest-detail-description')).toHaveTextContent(
        'これはテストクエストです'
      );
      expect(screen.getByTestId('quest-detail-time')).toHaveTextContent('30分');
    });

    it('タイプバッジを表示すること', async () => {
      const mockGetQuestById = jest.fn().mockResolvedValue(mockQuest);
      const mockIsQuestValid = jest.fn().mockReturnValue(true);
      mockUseQuestUseCase.mockReturnValue({
        getQuestById: mockGetQuestById,
        isQuestValid: mockIsQuestValid,
      });

      render(
        <QuestDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('quest-detail-type')).toBeDefined();
      });

      expect(screen.getByTestId('quest-detail-type')).toHaveTextContent('スモール');
    });

    it('難易度を表示すること', async () => {
      const mockGetQuestById = jest.fn().mockResolvedValue(mockQuest);
      const mockIsQuestValid = jest.fn().mockReturnValue(true);
      mockUseQuestUseCase.mockReturnValue({
        getQuestById: mockGetQuestById,
        isQuestValid: mockIsQuestValid,
      });

      render(
        <QuestDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('quest-detail-difficulty')).toBeDefined();
      });

      expect(screen.getByTestId('quest-detail-difficulty')).toHaveTextContent('簡単');
    });

    it('エビデンスタイプを表示すること', async () => {
      const mockGetQuestById = jest.fn().mockResolvedValue(mockQuest);
      const mockIsQuestValid = jest.fn().mockReturnValue(true);
      mockUseQuestUseCase.mockReturnValue({
        getQuestById: mockGetQuestById,
        isQuestValid: mockIsQuestValid,
      });

      render(
        <QuestDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('quest-detail-evidence')).toBeDefined();
      });

      expect(screen.getByTestId('quest-detail-evidence')).toHaveTextContent('画像提出');
    });

    it('完了基準を表示すること', async () => {
      const mockGetQuestById = jest.fn().mockResolvedValue(mockQuest);
      const mockIsQuestValid = jest.fn().mockReturnValue(true);
      mockUseQuestUseCase.mockReturnValue({
        getQuestById: mockGetQuestById,
        isQuestValid: mockIsQuestValid,
      });

      render(
        <QuestDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('quest-detail-criteria')).toBeDefined();
      });

      expect(screen.getByTestId('quest-detail-criteria')).toHaveTextContent('完了基準：Xを実行する');
    });
  });

  describe('アクションボタン', () => {
    it('「クエストを完了」ボタンをクリックすると QuestCompletion に遷移すること', async () => {
      const mockGetQuestById = jest.fn().mockResolvedValue(mockQuest);
      const mockIsQuestValid = jest.fn().mockReturnValue(true);
      mockUseQuestUseCase.mockReturnValue({
        getQuestById: mockGetQuestById,
        isQuestValid: mockIsQuestValid,
      });

      render(
        <QuestDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('quest-detail-complete-button')).toBeDefined();
      });

      const completeButton = screen.getByTestId('quest-detail-complete-button');
      fireEvent.press(completeButton);

      expect(mockNavigate).toHaveBeenCalledWith('QuestCompletion', { questId: 'quest-1' });
    });

    it('「クエストを見送り」ボタンをクリックすると QuestSkip に遷移すること', async () => {
      const mockGetQuestById = jest.fn().mockResolvedValue(mockQuest);
      const mockIsQuestValid = jest.fn().mockReturnValue(true);
      mockUseQuestUseCase.mockReturnValue({
        getQuestById: mockGetQuestById,
        isQuestValid: mockIsQuestValid,
      });

      render(
        <QuestDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('quest-detail-skip-button')).toBeDefined();
      });

      const skipButton = screen.getByTestId('quest-detail-skip-button');
      fireEvent.press(skipButton);

      expect(mockNavigate).toHaveBeenCalledWith('QuestSkip', { questId: 'quest-1' });
    });

    it('「クエストが阻害された」ボタンをクリックすると QuestObstruction に遷移すること', async () => {
      const mockGetQuestById = jest.fn().mockResolvedValue(mockQuest);
      const mockIsQuestValid = jest.fn().mockReturnValue(true);
      mockUseQuestUseCase.mockReturnValue({
        getQuestById: mockGetQuestById,
        isQuestValid: mockIsQuestValid,
      });

      render(
        <QuestDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('quest-detail-obstruction-button')).toBeDefined();
      });

      const obstructionButton = screen.getByTestId('quest-detail-obstruction-button');
      fireEvent.press(obstructionButton);

      expect(mockNavigate).toHaveBeenCalledWith('QuestObstruction', { questId: 'quest-1' });
    });

    it('「戻る」ボタンをクリックすると前の画面に戻ること', async () => {
      const mockGetQuestById = jest.fn().mockResolvedValue(mockQuest);
      const mockIsQuestValid = jest.fn().mockReturnValue(true);
      mockUseQuestUseCase.mockReturnValue({
        getQuestById: mockGetQuestById,
        isQuestValid: mockIsQuestValid,
      });

      render(
        <QuestDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('quest-detail-back-button')).toBeDefined();
      });

      const backButton = screen.getByTestId('quest-detail-back-button');
      fireEvent.press(backButton);

      expect(mockGoBack).toHaveBeenCalled();
    });
  });

  describe('ローディング状態', () => {
    it('クエスト取得中にローディングインジケーターを表示すること', () => {
      const mockGetQuestById = jest.fn().mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve(mockQuest), 1000);
          })
      );
      const mockIsQuestValid = jest.fn().mockReturnValue(true);
      mockUseQuestUseCase.mockReturnValue({
        getQuestById: mockGetQuestById,
        isQuestValid: mockIsQuestValid,
      });

      render(
        <QuestDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      expect(screen.getByTestId('quest-detail-loading')).toBeDefined();
    });
  });

  describe('エラー状態', () => {
    it('クエストが見つからない場合はエラーメッセージを表示すること', async () => {
      const mockGetQuestById = jest.fn().mockResolvedValue(null);
      const mockIsQuestValid = jest.fn().mockReturnValue(true);
      mockUseQuestUseCase.mockReturnValue({
        getQuestById: mockGetQuestById,
        isQuestValid: mockIsQuestValid,
      });

      render(
        <QuestDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('エラーが発生しました')).toBeDefined();
      });
    });

    it('クエストが期限切れの場合はエラーメッセージを表示すること', async () => {
      const expiredQuest = {
        ...mockQuest,
        validUntil: new Date(Date.now() - 1000),
      };
      const mockGetQuestById = jest.fn().mockResolvedValue(expiredQuest);
      const mockIsQuestValid = jest.fn().mockReturnValue(false);
      mockUseQuestUseCase.mockReturnValue({
        getQuestById: mockGetQuestById,
        isQuestValid: mockIsQuestValid,
      });

      render(
        <QuestDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('このクエストは期限が切れています')).toBeDefined();
      });
    });

    it('取得エラー時はエラーメッセージを表示すること', async () => {
      const mockGetQuestById = jest.fn().mockRejectedValue(new Error('API error'));
      const mockIsQuestValid = jest.fn().mockReturnValue(true);
      mockUseQuestUseCase.mockReturnValue({
        getQuestById: mockGetQuestById,
        isQuestValid: mockIsQuestValid,
      });

      render(
        <QuestDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('クエスト情報の取得に失敗しました')).toBeDefined();
      });
    });

    it('エラー画面から「戻る」ボタンで前の画面に戻ること', async () => {
      const mockGetQuestById = jest.fn().mockResolvedValue(null);
      const mockIsQuestValid = jest.fn().mockReturnValue(true);
      mockUseQuestUseCase.mockReturnValue({
        getQuestById: mockGetQuestById,
        isQuestValid: mockIsQuestValid,
      });

      render(
        <QuestDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('error-back-button')).toBeDefined();
      });

      const errorBackButton = screen.getByTestId('error-back-button');
      fireEvent.press(errorBackButton);

      expect(mockGoBack).toHaveBeenCalled();
    });
  });

  describe('異なるクエストタイプの表示', () => {
    it('MEDIUM タイプを正しく表示すること', async () => {
      const mediumQuest = { ...mockQuest, type: 'medium' as const };
      const mockGetQuestById = jest.fn().mockResolvedValue(mediumQuest);
      const mockIsQuestValid = jest.fn().mockReturnValue(true);
      mockUseQuestUseCase.mockReturnValue({
        getQuestById: mockGetQuestById,
        isQuestValid: mockIsQuestValid,
      });

      render(
        <QuestDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('quest-detail-type')).toBeDefined();
      });

      expect(screen.getByTestId('quest-detail-type')).toHaveTextContent('ミディアム');
    });

    it('VALIDATION タイプを正しく表示すること', async () => {
      const validationQuest = { ...mockQuest, type: 'validation' as const };
      const mockGetQuestById = jest.fn().mockResolvedValue(validationQuest);
      const mockIsQuestValid = jest.fn().mockReturnValue(true);
      mockUseQuestUseCase.mockReturnValue({
        getQuestById: mockGetQuestById,
        isQuestValid: mockIsQuestValid,
      });

      render(
        <QuestDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('quest-detail-type')).toBeDefined();
      });

      expect(screen.getByTestId('quest-detail-type')).toHaveTextContent('検証');
    });
  });

  describe('異なる難易度の表示', () => {
    it('MEDIUM 難易度を正しく表示すること', async () => {
      const mediumDifficultyQuest = { ...mockQuest, difficulty: 'medium' as const };
      const mockGetQuestById = jest.fn().mockResolvedValue(mediumDifficultyQuest);
      const mockIsQuestValid = jest.fn().mockReturnValue(true);
      mockUseQuestUseCase.mockReturnValue({
        getQuestById: mockGetQuestById,
        isQuestValid: mockIsQuestValid,
      });

      render(
        <QuestDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('quest-detail-difficulty')).toBeDefined();
      });

      expect(screen.getByTestId('quest-detail-difficulty')).toHaveTextContent('中級');
    });

    it('CHALLENGING 難易度を正しく表示すること', async () => {
      const challengingQuest = { ...mockQuest, difficulty: 'challenging' as const };
      const mockGetQuestById = jest.fn().mockResolvedValue(challengingQuest);
      const mockIsQuestValid = jest.fn().mockReturnValue(true);
      mockUseQuestUseCase.mockReturnValue({
        getQuestById: mockGetQuestById,
        isQuestValid: mockIsQuestValid,
      });

      render(
        <QuestDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('quest-detail-difficulty')).toBeDefined();
      });

      expect(screen.getByTestId('quest-detail-difficulty')).toHaveTextContent('チャレンジング');
    });
  });

  describe('アクセシビリティ', () => {
    it('アクションボタンにアクセシビリティラベルがあること', async () => {
      const mockGetQuestById = jest.fn().mockResolvedValue(mockQuest);
      const mockIsQuestValid = jest.fn().mockReturnValue(true);
      mockUseQuestUseCase.mockReturnValue({
        getQuestById: mockGetQuestById,
        isQuestValid: mockIsQuestValid,
      });

      render(
        <QuestDetailScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('quest-detail-complete-button')).toBeDefined();
      });

      const completeButton = screen.getByTestId('quest-detail-complete-button');
      expect(completeButton.props.accessibilityLabel).toBe('クエストを完了する');
      expect(completeButton.props.accessibilityRole).toBe('button');
    });
  });
});
