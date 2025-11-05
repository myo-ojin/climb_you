/**
 * QuestSkipScreen
 * クエスト見送り画面 - 見送り理由を記録
 *
 * フロー:
 * 1. 見送り理由を選択
 * 2. 「その他」の場合は理由を入力
 * 3. 詳細メモを入力（オプション）
 * 4. 見送りを記録 → 結果表示
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  useColorScheme,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { Quest } from '@/core/domain/entities/Quest';
import { useQuestUseCase } from '../hooks/useQuestUseCase';
import { Colors, LightTheme, DarkTheme } from '@/shared/theme';

type QuestSkipScreenProps = NativeStackScreenProps<
  any, // QuestStackParamList
  'QuestSkip'
>;

type SkipReason = 'time' | 'difficult' | 'motivation' | 'health' | 'other';

interface SkipState {
  selectedReason: SkipReason | null;
  customReason: string;
  memo: string;
  currentStep: 1 | 2 | 3; // 1 = 理由選択, 2 = カスタム理由, 3 = メモ
  isSubmitting: boolean;
  error: string | null;
  result: any | null;
}

/**
 * QuestSkipScreen コンポーネント
 */
export const QuestSkipScreen: React.FC<QuestSkipScreenProps> = ({
  navigation,
  route,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? DarkTheme : LightTheme;
  const questUseCase = useQuestUseCase();

  const { questId } = route.params as { questId: string };

  // クエスト情報取得
  const [quest, setQuest] = useState<Quest | null>(null);
  const [isLoadingQuest, setIsLoadingQuest] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // フォーム状態
  const [state, setState] = useState<SkipState>({
    selectedReason: null,
    customReason: '',
    memo: '',
    currentStep: 1,
    isSubmitting: false,
    error: null,
    result: null,
  });

  // クエスト情報を取得
  React.useEffect(() => {
    const fetchQuest = async () => {
      try {
        setIsLoadingQuest(true);
        const fetchedQuest = await questUseCase.getQuestById(questId);

        if (!fetchedQuest) {
          setLoadError('クエストが見つかりません');
          return;
        }

        if (!questUseCase.isQuestValid(fetchedQuest)) {
          setLoadError('このクエストは期限が切れています');
          return;
        }

        setQuest(fetchedQuest);
        setLoadError(null);
      } catch (err) {
        console.error('[QuestSkipScreen] Error fetching quest:', err);
        setLoadError('クエスト情報の取得に失敗しました');
      } finally {
        setIsLoadingQuest(false);
      }
    };

    fetchQuest();
  }, [questId, questUseCase]);

  // 見送り理由を選択
  const handleSelectReason = useCallback((reason: SkipReason) => {
    setState((prev) => ({
      ...prev,
      selectedReason: reason,
      currentStep: reason === 'other' ? 2 : 3,
    }));
  }, []);

  // カスタム理由を入力
  const handleSetCustomReason = useCallback((reason: string) => {
    setState((prev) => ({
      ...prev,
      customReason: reason,
    }));
  }, []);

  const canProceedStep2 = useMemo(
    () => state.customReason.length > 0,
    [state.customReason]
  );

  const handleNextStep3 = useCallback(() => {
    if (canProceedStep2) {
      setState((prev) => ({ ...prev, currentStep: 3 }));
    }
  }, [canProceedStep2]);

  // メモを入力
  const handleSetMemo = useCallback((memo: string) => {
    setState((prev) => ({
      ...prev,
      memo,
    }));
  }, []);

  // 見送りを記録
  const handleSubmitSkip = useCallback(async () => {
    if (!quest || !state.selectedReason) return;

    setState((prev) => ({ ...prev, isSubmitting: true, error: null }));

    try {
      // スキップ理由をマッピング
      let skipReasonText = '';
      switch (state.selectedReason) {
        case 'time':
          skipReasonText = '時間がなかった';
          break;
        case 'difficult':
          skipReasonText = '難しすぎた';
          break;
        case 'motivation':
          skipReasonText = 'モチベーションが低い';
          break;
        case 'health':
          skipReasonText = '体調不良';
          break;
        case 'other':
          skipReasonText = state.customReason;
          break;
      }

      const result = await questUseCase.completeQuest({
        questId,
        status: 'skipped',
        skipReason: skipReasonText,
        skipMemo: state.memo,
      });

      console.log('[QuestSkipScreen] Skip result:', result);

      setState((prev) => ({
        ...prev,
        result,
        isSubmitting: false,
      }));
    } catch (err) {
      console.error('[QuestSkipScreen] Error recording skip:', err);
      setState((prev) => ({
        ...prev,
        error: 'クエスト見送りの記録に失敗しました',
        isSubmitting: false,
      }));
    }
  }, [quest, questId, state, questUseCase]);

  // ホーム画面に戻る
  const handleGoHome = useCallback(() => {
    navigation.navigate('Home');
  }, [navigation]);

  // 理由選択に戻る
  const handleBackToReasonSelection = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentStep: 1,
      customReason: '',
    }));
  }, []);

  if (isLoadingQuest) {
    return (
      <SafeAreaView
        style={[
          styles.safeArea,
          {
            backgroundColor: theme.background,
          },
        ]}
      >
        <View
          style={[
            styles.loadingContainer,
            {
              backgroundColor: theme.background,
            },
          ]}
        >
          <ActivityIndicator
            size="large"
            color={Colors.mountainBlue}
            testID="quest-skip-loading"
          />
        </View>
      </SafeAreaView>
    );
  }

  if (loadError || !quest) {
    return (
      <SafeAreaView
        style={[
          styles.safeArea,
          {
            backgroundColor: theme.background,
          },
        ]}
      >
        <View
          style={[
            styles.errorContainer,
            {
              backgroundColor: theme.background,
            },
          ]}
        >
          <Text
            style={[
              styles.errorTitle,
              {
                color: Colors.error,
              },
            ]}
          >
            エラーが発生しました
          </Text>
          <Text
            style={[
              styles.errorText,
              {
                color: theme.textSecondary,
              },
            ]}
          >
            {loadError}
          </Text>
          <TouchableOpacity
            style={[
              styles.backButton,
              {
                backgroundColor: Colors.mountainBlue,
              },
            ]}
            onPress={() => navigation.goBack()}
            testID="error-back-button"
          >
            <Text style={styles.backButtonText}>戻る</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        {
          backgroundColor: theme.background,
        },
      ]}
    >
      <ScrollView
        style={[
          styles.container,
          {
            backgroundColor: theme.background,
          },
        ]}
        contentContainerStyle={styles.contentContainer}
        testID="quest-skip-scroll"
      >
        {/* タイトル */}
        <Text
          style={[
            styles.title,
            {
              color: theme.text,
            },
          ]}
          testID="quest-skip-title"
        >
          {state.result ? '⏭️ 見送りしました' : '⏭️ クエストを見送りますか？'}
        </Text>

        {/* ステップ1: 見送り理由の選択 */}
        {state.currentStep === 1 && !state.result && (
          <View style={styles.stepContainer}>
            <Text
              style={[
                styles.subtitle,
                {
                  color: theme.textSecondary,
                },
              ]}
            >
              見送り理由を選択してください
            </Text>

            {/* 理由選択肢 */}
            {[
              { id: 'time' as SkipReason, label: '時間がなかった', emoji: '⏰' },
              { id: 'difficult' as SkipReason, label: '難しすぎた', emoji: '😓' },
              { id: 'motivation' as SkipReason, label: 'モチベーションが低い', emoji: '😴' },
              { id: 'health' as SkipReason, label: '体調不良', emoji: '🤒' },
              { id: 'other' as SkipReason, label: 'その他', emoji: '❓' },
            ].map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionButton,
                  {
                    backgroundColor:
                      state.selectedReason === option.id
                        ? Colors.warning
                        : theme.elevation.level1,
                  },
                ]}
                onPress={() => handleSelectReason(option.id)}
                testID={`skip-reason-${option.id}`}
              >
                <Text
                  style={[
                    styles.optionText,
                    {
                      color:
                        state.selectedReason === option.id
                          ? Colors.white
                          : theme.text,
                      fontWeight: state.selectedReason === option.id ? '600' : '500',
                    },
                  ]}
                >
                  {option.emoji} {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ステップ2: カスタム理由入力 */}
        {state.currentStep === 2 && !state.result && (
          <View style={styles.stepContainer}>
            <Text
              style={[
                styles.subtitle,
                {
                  color: theme.textSecondary,
                },
              ]}
            >
              理由を詳しく教えてください
            </Text>

            <TextInput
              style={[
                styles.textAreaInput,
                {
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
              placeholder="理由を入力（例：予定が急に入った、集中できなかった）"
              placeholderTextColor={theme.textSecondary}
              multiline
              numberOfLines={4}
              value={state.customReason}
              onChangeText={handleSetCustomReason}
              testID="skip-custom-reason-input"
            />

            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[
                  styles.buttonSecondary,
                  {
                    backgroundColor: Colors.gray[300],
                  },
                ]}
                onPress={handleBackToReasonSelection}
                testID="skip-back-button"
              >
                <Text style={styles.buttonText}>戻る</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.button,
                  {
                    backgroundColor: canProceedStep2 ? Colors.mountainBlue : Colors.gray[400],
                    opacity: canProceedStep2 ? 1 : 0.6,
                  },
                ]}
                onPress={handleNextStep3}
                disabled={!canProceedStep2}
                testID="skip-next-button"
              >
                <Text style={styles.buttonText}>次へ</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ステップ3: メモ入力 */}
        {state.currentStep === 3 && !state.result && (
          <View style={styles.stepContainer}>
            <Text
              style={[
                styles.subtitle,
                {
                  color: theme.textSecondary,
                },
              ]}
            >
              詳細メモ（オプション）
            </Text>

            <TextInput
              style={[
                styles.textAreaInput,
                {
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
              placeholder="追加のメモを入力（オプション）"
              placeholderTextColor={theme.textSecondary}
              multiline
              numberOfLines={3}
              value={state.memo}
              onChangeText={handleSetMemo}
              testID="skip-memo-input"
            />

            {state.error && (
              <View
                style={[
                  styles.errorBanner,
                  {
                    backgroundColor: Colors.error,
                  },
                ]}
              >
                <Text style={styles.errorBannerText}>{state.error}</Text>
              </View>
            )}

            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[
                  styles.buttonSecondary,
                  {
                    backgroundColor: Colors.gray[300],
                  },
                ]}
                onPress={handleBackToReasonSelection}
                disabled={state.isSubmitting}
                testID="skip-back-button-2"
              >
                <Text style={styles.buttonText}>戻る</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.button,
                  {
                    backgroundColor: state.isSubmitting ? Colors.gray[400] : Colors.warning,
                  },
                ]}
                onPress={handleSubmitSkip}
                disabled={state.isSubmitting}
                testID="skip-submit-button"
              >
                {state.isSubmitting ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Text style={styles.buttonText}>見送りを記録する</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 結果画面 */}
        {state.result && (
          <View style={styles.resultContainer}>
            <Text
              style={[
                styles.resultTitle,
                {
                  color: Colors.warning,
                },
              ]}
              testID="skip-result-title"
            >
              ⏭️ 見送りました
            </Text>

            <View
              style={[
                styles.resultCard,
                {
                  backgroundColor: theme.elevation.level1,
                },
              ]}
            >
              <Text
                style={[
                  styles.resultLabel,
                  {
                    color: theme.text,
                  },
                ]}
              >
                見送り理由
              </Text>
              <Text
                style={[
                  styles.resultValue,
                  {
                    color: theme.textSecondary,
                  },
                ]}
                testID="skip-result-reason"
              >
                {state.selectedReason === 'time' && '⏰ 時間がなかった'}
                {state.selectedReason === 'difficult' && '😓 難しすぎた'}
                {state.selectedReason === 'motivation' && '😴 モチベーションが低い'}
                {state.selectedReason === 'health' && '🤒 体調不良'}
                {state.selectedReason === 'other' && `❓ ${state.customReason}`}
              </Text>
            </View>

            <Text
              style={[
                styles.resultMessage,
                {
                  color: theme.textSecondary,
                },
              ]}
            >
              明日は新しい1日です。頑張りましょう！
            </Text>

            <TouchableOpacity
              style={[
                styles.button,
                {
                  backgroundColor: Colors.mountainBlue,
                },
              ]}
              onPress={handleGoHome}
              testID="skip-home-button"
            >
              <Text style={styles.buttonText}>ホームに戻る</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  backButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 16,
  },
  stepContainer: {
    marginBottom: 20,
  },
  optionButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  optionText: {
    fontSize: 16,
    textAlign: 'left',
  },
  textAreaInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    fontSize: 14,
    marginBottom: 16,
    textAlignVertical: 'top',
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginLeft: 8,
  },
  buttonSecondary: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginRight: 8,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonGroup: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 8,
  },
  errorBanner: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorBannerText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '500',
  },
  resultContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  resultTitle: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  resultCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  resultValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  resultMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
});

export default QuestSkipScreen;
