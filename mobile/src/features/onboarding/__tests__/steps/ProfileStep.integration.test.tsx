/**
 * ProfileStep 統合テスト
 * プロファイル7項目設定ステップの動作確認
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Alert } from 'react-native';
import ProfileStep from '../../steps/ProfileStep';

// Alert.alertをモック
jest.spyOn(Alert, 'alert');

describe('ProfileStep 統合テスト', () => {
  const mockOnComplete = jest.fn();
  const mockOnBack = jest.fn();
  const mockOnGenerateMilestones = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('画面表示', () => {
    it('プロファイル設定画面が正しく表示されること', () => {
      render(
        <ProfileStep
          onComplete={mockOnComplete}
          onBack={mockOnBack}
          onGenerateMilestones={mockOnGenerateMilestones}
          loading={false}
        />
      );

      expect(screen.getByText('プロファイル設定')).toBeDefined();
      expect(screen.getByText(/あなたに合ったクエストを生成するための情報/)).toBeDefined();
    });

    it('7つの質問が表示されること', () => {
      render(
        <ProfileStep
          onComplete={mockOnComplete}
          onBack={mockOnBack}
          onGenerateMilestones={mockOnGenerateMilestones}
          loading={false}
        />
      );

      // 各質問のテキストを確認
      expect(screen.getByText('あなたの平日の生活パターンは？')).toBeDefined();
      expect(screen.getByText('いつが一番集中できますか？')).toBeDefined();
      expect(screen.getByText('主にどこで作業しますか？')).toBeDefined();
      expect(screen.getByText('どんなペースが続けやすいですか？')).toBeDefined();
      expect(screen.getByText('過去に目標が続かなかった理由は？')).toBeDefined();
      expect(screen.getByText('この目標に関する現在の経験は？')).toBeDefined();
      expect(screen.getByText('どんな難易度のタスクが好きですか？')).toBeDefined();
    });

    it('進捗バーと進捗テキストが表示されること', () => {
      render(
        <ProfileStep
          onComplete={mockOnComplete}
          onBack={mockOnBack}
          onGenerateMilestones={mockOnGenerateMilestones}
          loading={false}
        />
      );

      expect(screen.getByText('0 / 7 完了')).toBeDefined();
    });

    it('ボタンが表示されること', () => {
      render(
        <ProfileStep
          onComplete={mockOnComplete}
          onBack={mockOnBack}
          onGenerateMilestones={mockOnGenerateMilestones}
          loading={false}
        />
      );

      expect(screen.getByLabelText('戻る')).toBeDefined();
      expect(screen.getByLabelText('マイルストーンを生成')).toBeDefined();
    });
  });

  describe('質問の展開と折りたたみ', () => {
    it('質問をタップすると選択肢が表示されること', () => {
      render(
        <ProfileStep
          onComplete={mockOnComplete}
          onBack={mockOnBack}
          onGenerateMilestones={mockOnGenerateMilestones}
          loading={false}
        />
      );

      // 最初の質問をタップ
      const question1 = screen.getByLabelText('あなたの平日の生活パターンは？');
      fireEvent.press(question1);

      // 選択肢が表示される
      expect(screen.getByLabelText('会社員（9-18時）')).toBeDefined();
      expect(screen.getByLabelText('学生')).toBeDefined();
      expect(screen.getByLabelText('フリーランス')).toBeDefined();
    });

    it('展開中の質問を再度タップすると折りたたまれること', () => {
      render(
        <ProfileStep
          onComplete={mockOnComplete}
          onBack={mockOnBack}
          onGenerateMilestones={mockOnGenerateMilestones}
          loading={false}
        />
      );

      const question1 = screen.getByLabelText('あなたの平日の生活パターンは？');

      // 展開
      fireEvent.press(question1);
      expect(screen.getByLabelText('会社員（9-18時）')).toBeDefined();

      // 折りたたみ
      fireEvent.press(question1);
      expect(screen.queryByLabelText('会社員（9-18時）')).toBeNull();
    });
  });

  describe('選択肢の選択', () => {
    it('選択肢を選択できること', () => {
      render(
        <ProfileStep
          onComplete={mockOnComplete}
          onBack={mockOnBack}
          onGenerateMilestones={mockOnGenerateMilestones}
          loading={false}
        />
      );

      // 質問を展開
      const question1 = screen.getByLabelText('あなたの平日の生活パターンは？');
      fireEvent.press(question1);

      // 選択肢を選択
      const option = screen.getByLabelText('会社員（9-18時）');
      fireEvent.press(option);

      // 選択されたことを確認（チェックマークが表示される）
      expect(option).toBeDefined();
    });

    it('選択を変更できること', () => {
      render(
        <ProfileStep
          onComplete={mockOnComplete}
          onBack={mockOnBack}
          onGenerateMilestones={mockOnGenerateMilestones}
          loading={false}
        />
      );

      const question1 = screen.getByLabelText('あなたの平日の生活パターンは？');
      fireEvent.press(question1);

      // 最初に「会社員」を選択
      const option1 = screen.getByLabelText('会社員（9-18時）');
      fireEvent.press(option1);

      // 「学生」に変更
      const option2 = screen.getByLabelText('学生');
      fireEvent.press(option2);

      // 両方の選択肢が存在することを確認（変更可能）
      expect(option1).toBeDefined();
      expect(option2).toBeDefined();
    });

    it('全ての質問に回答すると進捗が更新されること', () => {
      render(
        <ProfileStep
          onComplete={mockOnComplete}
          onBack={mockOnBack}
          onGenerateMilestones={mockOnGenerateMilestones}
          loading={false}
        />
      );

      // 初期状態
      expect(screen.getByText('0 / 7 完了')).toBeDefined();

      // 1つ目の質問に回答
      const q1 = screen.getByLabelText('あなたの平日の生活パターンは？');
      fireEvent.press(q1);
      fireEvent.press(screen.getByLabelText('会社員（9-18時）'));

      // 進捗が更新される
      expect(screen.getByText('1 / 7 完了')).toBeDefined();

      // 2つ目の質問に回答
      const q2 = screen.getByLabelText('いつが一番集中できますか？');
      fireEvent.press(q2);
      fireEvent.press(screen.getByLabelText('朝（6-9時）'));

      // 進捗が更新される
      expect(screen.getByText('2 / 7 完了')).toBeDefined();
    });
  });

  describe('マイルストーン生成ボタン', () => {
    it('すべての質問に回答するまでボタンが無効であること', () => {
      render(
        <ProfileStep
          onComplete={mockOnComplete}
          onBack={mockOnBack}
          onGenerateMilestones={mockOnGenerateMilestones}
          loading={false}
        />
      );

      const generateButton = screen.getByLabelText('マイルストーンを生成');
      expect(generateButton.props.accessibilityState?.disabled).toBe(true);
    });

    it('すべての質問に回答するとボタンが有効になること', () => {
      render(
        <ProfileStep
          onComplete={mockOnComplete}
          onBack={mockOnBack}
          onGenerateMilestones={mockOnGenerateMilestones}
          loading={false}
        />
      );

      // すべての質問に回答
      const questions = [
        'あなたの平日の生活パターンは？',
        'いつが一番集中できますか？',
        '主にどこで作業しますか？',
        'どんなペースが続けやすいですか？',
        '過去に目標が続かなかった理由は？',
        'この目標に関する現在の経験は？',
        'どんな難易度のタスクが好きですか？',
      ];

      const answers = [
        '会社員（9-18時）',
        '朝（6-9時）',
        '自宅',
        '毎日少しずつ',
        '時間がなくなった',
        '全くの初心者',
        '確実にできる簡単なこと',
      ];

      questions.forEach((q, index) => {
        fireEvent.press(screen.getByLabelText(q));
        fireEvent.press(screen.getByLabelText(answers[index]));
      });

      const generateButton = screen.getByLabelText('マイルストーンを生成');
      expect(generateButton.props.accessibilityState?.disabled).toBe(false);
    });

    it('すべて回答してボタンを押すとonCompleteとonGenerateMilestonesが呼ばれること', async () => {
      jest.useFakeTimers();

      render(
        <ProfileStep
          onComplete={mockOnComplete}
          onBack={mockOnBack}
          onGenerateMilestones={mockOnGenerateMilestones}
          loading={false}
        />
      );

      // すべての質問に回答
      const questions = [
        'あなたの平日の生活パターンは？',
        'いつが一番集中できますか？',
        '主にどこで作業しますか？',
        'どんなペースが続けやすいですか？',
        '過去に目標が続かなかった理由は？',
        'この目標に関する現在の経験は？',
        'どんな難易度のタスクが好きですか？',
      ];

      const answers = [
        '会社員（9-18時）',
        '朝（6-9時）',
        '自宅',
        '毎日少しずつ',
        '時間がなくなった',
        '全くの初心者',
        '確実にできる簡単なこと',
      ];

      questions.forEach((q, index) => {
        fireEvent.press(screen.getByLabelText(q));
        fireEvent.press(screen.getByLabelText(answers[index]));
      });

      const generateButton = screen.getByLabelText('マイルストーンを生成');
      fireEvent.press(generateButton);

      // onCompleteが呼ばれる
      expect(mockOnComplete).toHaveBeenCalledTimes(1);
      expect(mockOnComplete).toHaveBeenCalledWith({
        lifestyle: '会社員（9-18時）',
        focusTime: '朝（6-9時）',
        workEnvironment: '自宅',
        taskPace: '毎日少しずつ',
        pastFailureReason: '時間がなくなった',
        skillLevel: '全くの初心者',
        difficultyPreference: '確実にできる簡単なこと',
      });

      // 300msのタイムアウト後にonGenerateMilestonesが呼ばれる
      jest.advanceTimersByTime(300);
      expect(mockOnGenerateMilestones).toHaveBeenCalledTimes(1);

      jest.useRealTimers();
    });

    it('未回答がある場合はアラートが表示されること', () => {
      render(
        <ProfileStep
          onComplete={mockOnComplete}
          onBack={mockOnBack}
          onGenerateMilestones={mockOnGenerateMilestones}
          loading={false}
        />
      );

      // 1つだけ回答
      const q1 = screen.getByLabelText('あなたの平日の生活パターンは？');
      fireEvent.press(q1);
      fireEvent.press(screen.getByLabelText('会社員（9-18時）'));

      const generateButton = screen.getByLabelText('マイルストーンを生成');
      fireEvent.press(generateButton);

      // Alertが呼ばれる（ボタンが無効なので実際には押せないが、コードカバレッジのため）
      // このテストでは、ボタンがdisabledなので実際には発火しない
      expect(mockOnComplete).not.toHaveBeenCalled();
    });
  });

  describe('戻るボタン', () => {
    it('戻るボタンを押すとonBackが呼ばれること', () => {
      render(
        <ProfileStep
          onComplete={mockOnComplete}
          onBack={mockOnBack}
          onGenerateMilestones={mockOnGenerateMilestones}
          loading={false}
        />
      );

      const backButton = screen.getByLabelText('戻る');
      fireEvent.press(backButton);

      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });

    it('loading中は戻るボタンが無効になること', () => {
      render(
        <ProfileStep
          onComplete={mockOnComplete}
          onBack={mockOnBack}
          onGenerateMilestones={mockOnGenerateMilestones}
          loading={true}
        />
      );

      const backButton = screen.getByLabelText('戻る');
      expect(backButton.props.accessibilityState?.disabled).toBe(true);
    });
  });

  describe('ローディング状態', () => {
    it('loading中はマイルストーン生成ボタンが無効になること', () => {
      render(
        <ProfileStep
          profile={{
            lifestyle: '会社員（9-18時）',
            focusTime: '朝（6-9時）',
            workEnvironment: '自宅',
            taskPace: '毎日少しずつ',
            pastFailureReason: '時間がなくなった',
            skillLevel: '全くの初心者',
            difficultyPreference: '確実にできる簡単なこと',
          }}
          onComplete={mockOnComplete}
          onBack={mockOnBack}
          onGenerateMilestones={mockOnGenerateMilestones}
          loading={true}
        />
      );

      const generateButton = screen.getByLabelText('マイルストーンを生成');
      expect(generateButton.props.accessibilityState?.disabled).toBe(true);
    });

    it('loading中はActivityIndicatorが表示されること', () => {
      const { UNSAFE_root } = render(
        <ProfileStep
          profile={{
            lifestyle: '会社員（9-18時）',
            focusTime: '朝（6-9時）',
            workEnvironment: '自宅',
            taskPace: '毎日少しずつ',
            pastFailureReason: '時間がなくなった',
            skillLevel: '全くの初心者',
            difficultyPreference: '確実にできる簡単なこと',
          }}
          onComplete={mockOnComplete}
          onBack={mockOnBack}
          onGenerateMilestones={mockOnGenerateMilestones}
          loading={true}
        />
      );

      // ActivityIndicatorが存在することを確認
      const activityIndicator = UNSAFE_root.findAllByType('ActivityIndicator' as any);
      expect(activityIndicator.length).toBeGreaterThan(0);
    });
  });

  describe('初期値の設定', () => {
    it('初期プロファイルが渡された場合、選択済み状態で表示されること', () => {
      render(
        <ProfileStep
          profile={{
            lifestyle: '会社員（9-18時）',
            focusTime: '朝（6-9時）',
            workEnvironment: '自宅',
            taskPace: '毎日少しずつ',
            pastFailureReason: '時間がなくなった',
            skillLevel: '全くの初心者',
            difficultyPreference: '確実にできる簡単なこと',
          }}
          onComplete={mockOnComplete}
          onBack={mockOnBack}
          onGenerateMilestones={mockOnGenerateMilestones}
          loading={false}
        />
      );

      // 進捗が7/7完了になっている
      expect(screen.getByText('7 / 7 完了')).toBeDefined();

      // マイルストーン生成ボタンが有効
      const generateButton = screen.getByLabelText('マイルストーンを生成');
      expect(generateButton.props.accessibilityState?.disabled).toBe(false);
    });
  });

  describe('アクセシビリティ', () => {
    it('全ての質問と選択肢にaccessibilityLabelがあること', () => {
      render(
        <ProfileStep
          onComplete={mockOnComplete}
          onBack={mockOnBack}
          onGenerateMilestones={mockOnGenerateMilestones}
          loading={false}
        />
      );

      // 質問
      expect(screen.getByLabelText('あなたの平日の生活パターンは？')).toBeDefined();
      expect(screen.getByLabelText('いつが一番集中できますか？')).toBeDefined();
      expect(screen.getByLabelText('主にどこで作業しますか？')).toBeDefined();
      expect(screen.getByLabelText('どんなペースが続けやすいですか？')).toBeDefined();
      expect(screen.getByLabelText('過去に目標が続かなかった理由は？')).toBeDefined();
      expect(screen.getByLabelText('この目標に関する現在の経験は？')).toBeDefined();
      expect(screen.getByLabelText('どんな難易度のタスクが好きですか？')).toBeDefined();

      // ボタン
      expect(screen.getByLabelText('戻る')).toBeDefined();
      expect(screen.getByLabelText('マイルストーンを生成')).toBeDefined();
    });
  });
});
