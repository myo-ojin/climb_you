/**
 * QuestObstructionScreen
 * クエスト阻害画面 - 阻害要因と対処計画を記録
 *
 * フロー:
 * 1. 阻害要因を選択
 * 2. 「その他」の場合は要因を入力
 * 3. 詳細説明を入力
 * 4. 次回対処計画を入力
 * 5. 阻害を記録 → 結果表示
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

type QuestObstructionScreenProps = NativeStackScreenProps<
  any, // QuestStackParamList
  'QuestObstruction'
>;

type ObstacleType =
  | 'schedule'
  | 'environment'
  | 'resources'
  | 'technical'
  | 'other';

interface ObstructionState {
  selectedObstacle: ObstacleType | null;
  customObstacle: string;
  obstacleDetails: string;
  contingencyPlan: string;
  currentStep: 1 | 2 | 3 | 4 | 5; // 1 = 要因選択, 2 = カスタム要因, 3 = 詳細, 4 = 対処計画, 5 = 結果
  isSubmitting: boolean;
  error: string | null;
  result: any | null;
}

/**
 * QuestObstructionScreen コンポーネント
 */
export const QuestObstructionScreen: React.FC<QuestObstructionScreenProps> = ({
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
  const [state, setState] = useState<ObstructionState>({
    selectedObstacle: null,
    customObstacle: '',
    obstacleDetails: '',
    contingencyPlan: '',
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
        console.error('[QuestObstructionScreen] Error fetching quest:', err);
        setLoadError('クエスト情報の取得に失敗しました');
      } finally {
        setIsLoadingQuest(false);
      }
    };

    fetchQuest();
  }, [questId, questUseCase]);

  // 阻害要因を選択
  const handleSelectObstacle = useCallback((obstacle: ObstacleType) => {
    setState((prev) => ({
      ...prev,
      selectedObstacle: obstacle,
      currentStep: obstacle === 'other' ? 2 : 3,
    }));
  }, []);

  // カスタム要因を入力
  const handleSetCustomObstacle = useCallback((obstacle: string) => {
    setState((prev) => ({
      ...prev,
      customObstacle: obstacle,
    }));
  }, []);

  const canProceedStep2 = useMemo(
    () => state.customObstacle.length > 0,
    [state.customObstacle]
  );

  const handleNextStep3 = useCallback(() => {
    if (canProceedStep2) {
      setState((prev) => ({ ...prev, currentStep: 3 }));
    }
  }, [canProceedStep2]);

  // 詳細説明を入力
  const handleSetDetails = useCallback((details: string) => {
    setState((prev) => ({
      ...prev,
      obstacleDetails: details,
    }));
  }, []);

  const canProceedStep3 = useMemo(
    () => state.obstacleDetails.length > 0,
    [state.obstacleDetails]
  );

  const handleNextStep4 = useCallback(() => {
    if (canProceedStep3) {
      setState((prev) => ({ ...prev, currentStep: 4 }));
    }
  }, [canProceedStep3]);

  // 対処計画を入力
  const handleSetContingencyPlan = useCallback((plan: string) => {
    setState((prev) => ({
      ...prev,
      contingencyPlan: plan,
    }));
  }, []);

  const canProceedStep4 = useMemo(
    () => state.contingencyPlan.length > 0,
    [state.contingencyPlan]
  );

  // 阻害を記録
  const handleSubmitObstruction = useCallback(async () => {
    if (!quest || !state.selectedObstacle) return;

    setState((prev) => ({ ...prev, isSubmitting: true, error: null }));

    try {
      // 阻害要因をマッピング
      let obstacleText = '';
      switch (state.selectedObstacle) {
        case 'schedule':
          obstacleText = '急な予定変更';
          break;
        case 'environment':
          obstacleText = '環境の問題';
          break;
        case 'resources':
          obstacleText = '必要なリソースがない';
          break;
        case 'technical':
          obstacleText = '技術的な問題';
          break;
        case 'other':
          obstacleText = state.customObstacle;
          break;
      }

      const result = await questUseCase.completeQuest({
        questId,
        status: 'obstructed',
        obstacle: obstacleText,
        obstacleDetails: state.obstacleDetails,
        contingencyPlan: state.contingencyPlan,
      });

      console.log('[QuestObstructionScreen] Obstruction result:', result);

      setState((prev) => ({
        ...prev,
        result,
        currentStep: 5,
        isSubmitting: false,
      }));
    } catch (err) {
      console.error('[QuestObstructionScreen] Error recording obstruction:', err);
      setState((prev) => ({
        ...prev,
        error: 'クエスト阻害の記録に失敗しました',
        isSubmitting: false,
      }));
    }
  }, [quest, questId, state, questUseCase]);

  // ホーム画面に戻る
  const handleGoHome = useCallback(() => {
    navigation.navigate('Home');
  }, [navigation]);

  // 前のステップに戻る
  const handlePreviousStep = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentStep: Math.max(1, prev.currentStep - 1) as any,
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
            testID="quest-obstruction-loading"
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
        testID="quest-obstruction-scroll"
      >
        {/* ステップインジケーター */}
        {state.currentStep !== 5 && (
          <View style={styles.stepIndicator}>
            <Text
              style={[
                styles.stepText,
                {
                  color: theme.text,
                },
              ]}
              testID="quest-obstruction-step"
            >
              ステップ {state.currentStep} / 4
            </Text>
          </View>
        )}

        {/* タイトル */}
        <Text
          style={[
            styles.title,
            {
              color: theme.text,
            },
          ]}
          testID="quest-obstruction-title"
        >
          {state.currentStep === 5 ? '🚧 阻害を記録しました' : '🚧 何が阻害になりましたか？'}
        </Text>

        {/* ステップ1: 阻害要因の選択 */}
        {state.currentStep === 1 && (
          <View style={styles.stepContainer}>
            <Text
              style={[
                styles.subtitle,
                {
                  color: theme.textSecondary,
                },
              ]}
            >
              阻害要因を選択してください
            </Text>

            {[
              { id: 'schedule' as ObstacleType, label: '急な予定変更', emoji: '📅' },
              { id: 'environment' as ObstacleType, label: '環境の問題', emoji: '🏚️' },
              { id: 'resources' as ObstacleType, label: '必要なリソースがない', emoji: '🔧' },
              { id: 'technical' as ObstacleType, label: '技術的な問題', emoji: '⚠️' },
              { id: 'other' as ObstacleType, label: 'その他', emoji: '❓' },
            ].map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionButton,
                  {
                    backgroundColor:
                      state.selectedObstacle === option.id
                        ? Colors.error
                        : theme.elevation.level1,
                  },
                ]}
                onPress={() => handleSelectObstacle(option.id)}
                testID={`obstruction-obstacle-${option.id}`}
              >
                <Text
                  style={[
                    styles.optionText,
                    {
                      color:
                        state.selectedObstacle === option.id
                          ? Colors.white
                          : theme.text,
                      fontWeight: state.selectedObstacle === option.id ? '600' : '500',
                    },
                  ]}
                >
                  {option.emoji} {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ステップ2: カスタム要因入力 */}
        {state.currentStep === 2 && (
          <View style={styles.stepContainer}>
            <Text
              style={[
                styles.subtitle,
                {
                  color: theme.textSecondary,
                },
              ]}
            >
              阻害要因を詳しく教えてください
            </Text>

            <TextInput
              style={[
                styles.textAreaInput,
                {
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
              placeholder="要因を入力（例：パソコンが故障した）"
              placeholderTextColor={theme.textSecondary}
              multiline
              numberOfLines={3}
              value={state.customObstacle}
              onChangeText={handleSetCustomObstacle}
              testID="obstruction-custom-obstacle-input"
            />

            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[
                  styles.buttonSecondary,
                  {
                    backgroundColor: Colors.gray[300],
                  },
                ]}
                onPress={handlePreviousStep}
                testID="obstruction-back-button-1"
              >
                <Text style={styles.buttonText}>戻る</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.button,
                  {
                    backgroundColor: canProceedStep2
                      ? Colors.mountainBlue
                      : Colors.gray[400],
                    opacity: canProceedStep2 ? 1 : 0.6,
                  },
                ]}
                onPress={handleNextStep3}
                disabled={!canProceedStep2}
                testID="obstruction-next-button-1"
              >
                <Text style={styles.buttonText}>次へ</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ステップ3: 詳細説明 */}
        {state.currentStep === 3 && (
          <View style={styles.stepContainer}>
            <Text
              style={[
                styles.subtitle,
                {
                  color: theme.textSecondary,
                },
              ]}
            >
              詳細を説明してください
            </Text>

            <TextInput
              style={[
                styles.textAreaInput,
                {
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
              placeholder="何が起こったのか、どのように影響したか"
              placeholderTextColor={theme.textSecondary}
              multiline
              numberOfLines={4}
              value={state.obstacleDetails}
              onChangeText={handleSetDetails}
              testID="obstruction-details-input"
            />

            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[
                  styles.buttonSecondary,
                  {
                    backgroundColor: Colors.gray[300],
                  },
                ]}
                onPress={handlePreviousStep}
                testID="obstruction-back-button-2"
              >
                <Text style={styles.buttonText}>戻る</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.button,
                  {
                    backgroundColor: canProceedStep3
                      ? Colors.mountainBlue
                      : Colors.gray[400],
                    opacity: canProceedStep3 ? 1 : 0.6,
                  },
                ]}
                onPress={handleNextStep4}
                disabled={!canProceedStep3}
                testID="obstruction-next-button-2"
              >
                <Text style={styles.buttonText}>次へ</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ステップ4: 対処計画 */}
        {state.currentStep === 4 && (
          <View style={styles.stepContainer}>
            <Text
              style={[
                styles.subtitle,
                {
                  color: theme.textSecondary,
                },
              ]}
            >
              次回はどう対処しますか？
            </Text>

            <TextInput
              style={[
                styles.textAreaInput,
                {
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
              placeholder="対処計画（例：事前に確認する、予備を用意する）"
              placeholderTextColor={theme.textSecondary}
              multiline
              numberOfLines={4}
              value={state.contingencyPlan}
              onChangeText={handleSetContingencyPlan}
              testID="obstruction-plan-input"
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
                onPress={handlePreviousStep}
                disabled={state.isSubmitting}
                testID="obstruction-back-button-3"
              >
                <Text style={styles.buttonText}>戻る</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.button,
                  {
                    backgroundColor: state.isSubmitting
                      ? Colors.gray[400]
                      : Colors.error,
                  },
                ]}
                onPress={handleSubmitObstruction}
                disabled={state.isSubmitting || !canProceedStep4}
                testID="obstruction-submit-button"
              >
                {state.isSubmitting ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Text style={styles.buttonText}>阻害を記録する</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ステップ5: 結果画面 */}
        {state.currentStep === 5 && state.result && (
          <View style={styles.resultContainer}>
            <Text
              style={[
                styles.resultTitle,
                {
                  color: Colors.error,
                },
              ]}
              testID="obstruction-result-title"
            >
              🚧 阻害を記録しました
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
                阻害要因
              </Text>
              <Text
                style={[
                  styles.resultValue,
                  {
                    color: theme.textSecondary,
                  },
                ]}
                testID="obstruction-result-obstacle"
              >
                {state.selectedObstacle === 'schedule' && '📅 急な予定変更'}
                {state.selectedObstacle === 'environment' && '🏚️ 環境の問題'}
                {state.selectedObstacle === 'resources' && '🔧 必要なリソースがない'}
                {state.selectedObstacle === 'technical' && '⚠️ 技術的な問題'}
                {state.selectedObstacle === 'other' && `❓ ${state.customObstacle}`}
              </Text>
            </View>

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
                対処計画
              </Text>
              <Text
                style={[
                  styles.resultValue,
                  {
                    color: theme.textSecondary,
                  },
                ]}
                testID="obstruction-result-plan"
              >
                {state.contingencyPlan}
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
              次回は対策を立てて挑戦してください。あなたならできます！
            </Text>

            <TouchableOpacity
              style={[
                styles.button,
                {
                  backgroundColor: Colors.mountainBlue,
                },
              ]}
              onPress={handleGoHome}
              testID="obstruction-home-button"
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
  stepIndicator: {
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: Colors.gray[100],
  },
  stepText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
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
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
  },
  resultMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
});

export default QuestObstructionScreen;
