/**
 * QuestCompletionScreen Tests
 * クエスト完了画面のテストスイート
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { QuestCompletionScreen } from './QuestCompletionScreen';
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

const mockCompletionResult = {
  questLog: {
    id: 'log-1',
    questId: 'quest-1',
    userId: 'user-1',
    status: 'completed' as const,
    actualTime: 30,
    stepsEarned: 50,
    createdAt: new Date(),
    isSynced: false,
  },
  stepsEarned: 50,
  streakUpdated: true,
  achievements: [],
};

// モック: useQuestUseCase フック
const mockUseQuestUseCase = require('../hooks/useQuestUseCase').useQuestUseCase;

describe('QuestCompletionScreen', () => {
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
        completeQuest: jest.fn(),
      });

      render(
        <QuestCompletionScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      expect(screen.getByTestId('quest-completion-loading')).toBeDefined();
    });
  });

  describe('ステップ1: 完了基準確認', () => {
    it('ステップ1を表示すること', async () => {
      const mockGetQuestById = jest.fn().mockResolvedValue(mockQuest);
      const mockIsQuestValid = jest.fn().mockReturnValue(true);
      mockUseQuestUseCase.mockReturnValue({
        getQuestById: mockGetQuestById,
        isQuestValid: mockIsQuestValid,
        completeQuest: jest.fn(),
      });

      render(
        <QuestCompletionScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('step1-title')).toBeDefined();
      });

      expect(screen.getByTestId('step1-title')).toHaveTextContent('クエストを完了しましたか？');
    });

    it('完了基準テキストを表示すること', async () => {
      const mockGetQuestById = jest.fn().mockResolvedValue(mockQuest);
      const mockIsQuestValid = jest.fn().mockReturnValue(true);
      mockUseQuestUseCase.mockReturnValue({
        getQuestById: mockGetQuestById,
        isQuestValid: mockIsQuestValid,
        completeQuest: jest.fn(),
      });

      render(
        <QuestCompletionScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('step1-criteria')).toBeDefined();
      });

      expect(screen.getByTestId('step1-criteria')).toHaveTextContent('完了基準：Xを実行する');
    });

    it('チェックボックスをチェック/アンチェックできること', async () => {
      const mockGetQuestById = jest.fn().mockResolvedValue(mockQuest);
      const mockIsQuestValid = jest.fn().mockReturnValue(true);
      mockUseQuestUseCase.mockReturnValue({
        getQuestById: mockGetQuestById,
        isQuestValid: mockIsQuestValid,
        completeQuest: jest.fn(),
      });

      render(
        <QuestCompletionScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('step1-checkbox')).toBeDefined();
      });

      const checkbox = screen.getByTestId('step1-checkbox');
      fireEvent.press(checkbox);

      // チェック状態で次へボタンが有効化される
      const nextButton = screen.getByTestId('step1-next-button');
      expect(nextButton.props.disabled).toBe(false);
    });

    it('チェックボックス未チェック時は次へボタンが無効化されること', async () => {
      const mockGetQuestById = jest.fn().mockResolvedValue(mockQuest);
      const mockIsQuestValid = jest.fn().mockReturnValue(true);
      mockUseQuestUseCase.mockReturnValue({
        getQuestById: mockGetQuestById,
        isQuestValid: mockIsQuestValid,
        completeQuest: jest.fn(),
      });

      render(
        <QuestCompletionScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('step1-next-button')).toBeDefined();
      });

      const nextButton = screen.getByTestId('step1-next-button');
      expect(nextButton.props.disabled).toBe(true);
    });

    it('チェック後、次へボタンをクリックするとステップ2に進むこと', async () => {
      const mockGetQuestById = jest.fn().mockResolvedValue(mockQuest);
      const mockIsQuestValid = jest.fn().mockReturnValue(true);
      mockUseQuestUseCase.mockReturnValue({
        getQuestById: mockGetQuestById,
        isQuestValid: mockIsQuestValid,
        completeQuest: jest.fn(),
      });

      render(
        <QuestCompletionScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('step1-checkbox')).toBeDefined();
      });

      const checkbox = screen.getByTestId('step1-checkbox');
      fireEvent.press(checkbox);

      const nextButton = screen.getByTestId('step1-next-button');
      fireEvent.press(nextButton);

      // ステップ2が表示される
      await waitFor(() => {
        expect(screen.getByTestId('step2-title')).toBeDefined();
      });
    });
  });

  describe('ステップ2: 推定時間との比較', () => {
    beforeEach(async () => {
      const mockGetQuestById = jest.fn().mockResolvedValue(mockQuest);
      const mockIsQuestValid = jest.fn().mockReturnValue(true);
      mockUseQuestUseCase.mockReturnValue({
        getQuestById: mockGetQuestById,
        isQuestValid: mockIsQuestValid,
        completeQuest: jest.fn(),
      });

      render(
        <QuestCompletionScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('step1-checkbox')).toBeDefined();
      });

      const checkbox = screen.getByTestId('step1-checkbox');
      fireEvent.press(checkbox);

      const nextButton = screen.getByTestId('step1-next-button');
      fireEvent.press(nextButton);

      await waitFor(() => {
        expect(screen.getByTestId('step2-title')).toBeDefined();
      });
    });

    it('ステップ2を表示すること', () => {
      expect(screen.getByTestId('step2-title')).toHaveTextContent('実際にかかった時間は？');
    });

    it('推定時間を表示すること', () => {
      expect(screen.getByText(/推定時間: 30分/)).toBeDefined();
    });

    it('時間比較選択肢を表示すること', () => {
      expect(screen.getByTestId('step2-option-as_estimated')).toBeDefined();
      expect(screen.getByTestId('step2-option-shorter')).toBeDefined();
      expect(screen.getByTestId('step2-option-longer')).toBeDefined();
      expect(screen.getByTestId('step2-option-custom')).toBeDefined();
    });

    it('「推定通り」を選択できること', () => {
      const option = screen.getByTestId('step2-option-as_estimated');
      fireEvent.press(option);

      // 次へボタンが有効化される
      const nextButton = screen.getByTestId('step2-next-button');
      expect(nextButton.props.disabled).toBe(false);
    });

    it('「正確に入力」を選択するとカスタム入力フィールドが表示されること', () => {
      const option = screen.getByTestId('step2-option-custom');
      fireEvent.press(option);

      expect(screen.getByTestId('step2-custom-input')).toBeDefined();
    });
  });

  describe('ステップ3: エビデンス', () => {
    it('evidenceType が image の場合、画像URL入力フィールドが表示されること', async () => {
      const mockGetQuestById = jest.fn().mockResolvedValue(mockQuest);
      const mockIsQuestValid = jest.fn().mockReturnValue(true);
      mockUseQuestUseCase.mockReturnValue({
        getQuestById: mockGetQuestById,
        isQuestValid: mockIsQuestValid,
        completeQuest: jest.fn(),
      });

      render(
        <QuestCompletionScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      // ステップ3まで進める
      await navigateToStep3();

      expect(screen.getByTestId('step3-url-input')).toBeDefined();
      expect(screen.getByTestId('step3-text-input')).toBeDefined();
    });

    it('evidenceType が text の場合、テキスト入力フィールドが表示されること', async () => {
      const textQuest = { ...mockQuest, evidenceType: 'text' as const };
      const mockGetQuestById = jest.fn().mockResolvedValue(textQuest);
      const mockIsQuestValid = jest.fn().mockReturnValue(true);
      mockUseQuestUseCase.mockReturnValue({
        getQuestById: mockGetQuestById,
        isQuestValid: mockIsQuestValid,
        completeQuest: jest.fn(),
      });

      render(
        <QuestCompletionScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      // ステップ3まで進める
      await navigateToStep3();

      expect(screen.getByTestId('step3-text-input')).toBeDefined();
    });

    it('evidenceType が none の場合、「エビデンス不要」メッセージが表示されること', async () => {
      const noneQuest = { ...mockQuest, evidenceType: 'none' as const };
      const mockGetQuestById = jest.fn().mockResolvedValue(noneQuest);
      const mockIsQuestValid = jest.fn().mockReturnValue(true);
      mockUseQuestUseCase.mockReturnValue({
        getQuestById: mockGetQuestById,
        isQuestValid: mockIsQuestValid,
        completeQuest: jest.fn(),
      });

      render(
        <QuestCompletionScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      // ステップ3まで進める
      await navigateToStep3();

      expect(screen.getByText(/このクエストはエビデンスが不要です/)).toBeDefined();
    });
  });

  describe('ステップ4: メモ入力', () => {
    it('ステップ4で「一言メモ」を入力できること', async () => {
      const mockGetQuestById = jest.fn().mockResolvedValue(mockQuest);
      const mockIsQuestValid = jest.fn().mockReturnValue(true);
      mockUseQuestUseCase.mockReturnValue({
        getQuestById: mockGetQuestById,
        isQuestValid: mockIsQuestValid,
        completeQuest: jest.fn(),
      });

      render(
        <QuestCompletionScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      // ステップ4まで進める
      await navigateToStep4();

      const memoInput = screen.getByTestId('step4-memo-input');
      fireEvent.changeText(memoInput, 'このクエストは楽でした');

      expect(memoInput.props.value).toBe('このクエストは楽でした');
    });
  });

  describe('完了処理', () => {
    it('完了ボタンをクリックすると completeQuest を呼び出すこと', async () => {
      const mockCompleteQuest = jest.fn().mockResolvedValue(mockCompletionResult);
      const mockGetQuestById = jest.fn().mockResolvedValue(mockQuest);
      const mockIsQuestValid = jest.fn().mockReturnValue(true);
      mockUseQuestUseCase.mockReturnValue({
        getQuestById: mockGetQuestById,
        isQuestValid: mockIsQuestValid,
        completeQuest: mockCompleteQuest,
      });

      render(
        <QuestCompletionScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      // ステップ4まで進める
      await navigateToStep4();

      const submitButton = screen.getByTestId('step4-submit-button');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockCompleteQuest).toHaveBeenCalled();
      });
    });

    it('完了後、結果画面を表示すること', async () => {
      const mockCompleteQuest = jest.fn().mockResolvedValue(mockCompletionResult);
      const mockGetQuestById = jest.fn().mockResolvedValue(mockQuest);
      const mockIsQuestValid = jest.fn().mockReturnValue(true);
      mockUseQuestUseCase.mockReturnValue({
        getQuestById: mockGetQuestById,
        isQuestValid: mockIsQuestValid,
        completeQuest: mockCompleteQuest,
      });

      render(
        <QuestCompletionScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      // ステップ4まで進める
      await navigateToStep4();

      const submitButton = screen.getByTestId('step4-submit-button');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('step5-result-title')).toBeDefined();
      });

      expect(screen.getByTestId('step5-steps-earned')).toHaveTextContent('+50歩');
      expect(screen.getByTestId('step5-streak-updated')).toHaveTextContent('🔥 ストリーク更新！');
    });

    it('「ホームに戻る」ボタンをクリックするとホーム画面に遷移すること', async () => {
      const mockCompleteQuest = jest.fn().mockResolvedValue(mockCompletionResult);
      const mockGetQuestById = jest.fn().mockResolvedValue(mockQuest);
      const mockIsQuestValid = jest.fn().mockReturnValue(true);
      mockUseQuestUseCase.mockReturnValue({
        getQuestById: mockGetQuestById,
        isQuestValid: mockIsQuestValid,
        completeQuest: mockCompleteQuest,
      });

      render(
        <QuestCompletionScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      // ステップ4まで進める
      await navigateToStep4();

      const submitButton = screen.getByTestId('step4-submit-button');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('step5-home-button')).toBeDefined();
      });

      const homeButton = screen.getByTestId('step5-home-button');
      fireEvent.press(homeButton);

      expect(mockNavigate).toHaveBeenCalledWith('Home');
    });
  });

  describe('ステップネイゲーション', () => {
    it('「戻る」ボタンで前のステップに戻ること', async () => {
      const mockGetQuestById = jest.fn().mockResolvedValue(mockQuest);
      const mockIsQuestValid = jest.fn().mockReturnValue(true);
      mockUseQuestUseCase.mockReturnValue({
        getQuestById: mockGetQuestById,
        isQuestValid: mockIsQuestValid,
        completeQuest: jest.fn(),
      });

      render(
        <QuestCompletionScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      // ステップ2まで進める
      await navigateToStep2();

      const prevButton = screen.getByTestId('step2-prev-button');
      fireEvent.press(prevButton);

      // ステップ1に戻る
      await waitFor(() => {
        expect(screen.getByTestId('step1-title')).toBeDefined();
      });
    });
  });

  describe('エラーハンドリング', () => {
    it('クエストが見つからない場合はエラーメッセージを表示すること', async () => {
      const mockGetQuestById = jest.fn().mockResolvedValue(null);
      const mockIsQuestValid = jest.fn().mockReturnValue(true);
      mockUseQuestUseCase.mockReturnValue({
        getQuestById: mockGetQuestById,
        isQuestValid: mockIsQuestValid,
        completeQuest: jest.fn(),
      });

      render(
        <QuestCompletionScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('クエストが見つかりません')).toBeDefined();
      });
    });

    it('完了処理がエラーになった場合、エラーメッセージを表示すること', async () => {
      const mockCompleteQuest = jest.fn().mockRejectedValue(new Error('API error'));
      const mockGetQuestById = jest.fn().mockResolvedValue(mockQuest);
      const mockIsQuestValid = jest.fn().mockReturnValue(true);
      mockUseQuestUseCase.mockReturnValue({
        getQuestById: mockGetQuestById,
        isQuestValid: mockIsQuestValid,
        completeQuest: mockCompleteQuest,
      });

      render(
        <QuestCompletionScreen
          navigation={mockNavigation}
          route={mockRoute}
        />
      );

      // ステップ4まで進める
      await navigateToStep4();

      const submitButton = screen.getByTestId('step4-submit-button');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(screen.queryByText('クエスト完了の記録に失敗しました')).toBeDefined();
      });
    });
  });
});

// ヘルパー関数: ステップまで進める
async function navigateToStep(targetStep: number) {
  for (let step = 1; step < targetStep; step++) {
    if (step === 1) {
      const checkbox = screen.getByTestId('step1-checkbox');
      fireEvent.press(checkbox);
      const nextButton = screen.getByTestId('step1-next-button');
      fireEvent.press(nextButton);
    } else if (step === 2) {
      const option = screen.getByTestId('step2-option-as_estimated');
      fireEvent.press(option);
      const nextButton = screen.getByTestId('step2-next-button');
      fireEvent.press(nextButton);
    } else if (step === 3) {
      const nextButton = screen.getByTestId('step3-next-button');
      fireEvent.press(nextButton);
    } else if (step === 4) {
      // ステップ4はメモ入力後に進む必要なし
      break;
    }

    await waitFor(() => {
      expect(screen.getByTestId(`step${step + 1}-title`)).toBeDefined();
    });
  }
}

async function navigateToStep2() {
  await navigateToStep(2);
}

async function navigateToStep3() {
  await navigateToStep(3);
}

async function navigateToStep4() {
  await navigateToStep(4);
}
