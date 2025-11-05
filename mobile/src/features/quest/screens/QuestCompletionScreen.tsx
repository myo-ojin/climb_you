/**
 * QuestCompletionScreen
 * クエスト完了画面 - 完了情報を記録し、歩数を獲得
 *
 * フロー:
 * 1. 完了基準を満たしているかを確認
 * 2. 推定時間との比較を選択
 * 3. エビデンスを提出
 * 4. メモを入力（オプション）
 * 5. 完了を記録 → 結果表示
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
  CheckBox,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { Quest } from '@/core/domain/entities/Quest';
import { useQuestUseCase } from '../hooks/useQuestUseCase';
import { Colors, LightTheme, DarkTheme } from '@/shared/theme';
import { EvidenceUploadModal } from '../components/EvidenceUploadModal';
import { EvidenceUploadResult } from '../services/EvidenceUploadService';

type QuestCompletionScreenProps = NativeStackScreenProps<
  any, // QuestStackParamList
  'QuestCompletion'
>;

type TimeComparisonOption = 'as_estimated' | 'shorter' | 'longer' | 'custom';

interface CompletionState {
  // Step 1: 完了基準確認
  completionCriteriaConfirmed: boolean;

  // Step 2: 推定時間との比較
  timeComparison: TimeComparisonOption | null;
  actualTimeMinutes: number | null;

  // Step 3: エビデンス
  evidenceText: string;
  evidenceUrl: string;
  evidenceUploadResult: EvidenceUploadResult | null;

  // Step 4: メモ
  memo: string;

  // Status
  currentStep: 1 | 2 | 3 | 4 | 5; // 5 = 結果画面
  isSubmitting: boolean;
  error: string | null;
  result: any | null;
  showEvidenceModal: boolean;
  isUploadingEvidence: boolean;
}

/**
 * QuestCompletionScreen コンポーネント
 */
export const QuestCompletionScreen: React.FC<QuestCompletionScreenProps> = ({
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

  // 完了フォーム状態
  const [state, setState] = useState<CompletionState>({
    completionCriteriaConfirmed: false,
    timeComparison: null,
    actualTimeMinutes: null,
    evidenceText: '',
    evidenceUrl: '',
    evidenceUploadResult: null,
    memo: '',
    currentStep: 1,
    isSubmitting: false,
    error: null,
    result: null,
    showEvidenceModal: false,
    isUploadingEvidence: false,
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
        console.error('[QuestCompletionScreen] Error fetching quest:', err);
        setLoadError('クエスト情報の取得に失敗しました');
      } finally {
        setIsLoadingQuest(false);
      }
    };

    fetchQuest();
  }, [questId, questUseCase]);

  // ステップ1: 完了基準確認
  const handleConfirmCriteria = useCallback(() => {
    setState((prev) => ({
      ...prev,
      completionCriteriaConfirmed: !prev.completionCriteriaConfirmed,
    }));
  }, []);

  const canProceedStep1 = useMemo(
    () => state.completionCriteriaConfirmed,
    [state.completionCriteriaConfirmed]
  );

  const handleNextStep2 = useCallback(() => {
    if (canProceedStep1) {
      setState((prev) => ({ ...prev, currentStep: 2 }));
    }
  }, [canProceedStep1]);

  // ステップ2: 推定時間との比較
  const handleSelectTimeComparison = useCallback((option: TimeComparisonOption) => {
    setState((prev) => ({
      ...prev,
      timeComparison: option,
      actualTimeMinutes:
        option === 'as_estimated' ? quest?.estimatedTime || 30 : prev.actualTimeMinutes,
    }));
  }, [quest]);

  const handleSetCustomTime = useCallback((minutes: number) => {
    setState((prev) => ({
      ...prev,
      actualTimeMinutes: minutes,
    }));
  }, []);

  const canProceedStep2 = useMemo(
    () => state.timeComparison !== null && (state.timeComparison !== 'custom' || state.actualTimeMinutes !== null),
    [state.timeComparison, state.actualTimeMinutes]
  );

  const handleNextStep3 = useCallback(() => {
    if (canProceedStep2) {
      setState((prev) => ({ ...prev, currentStep: 3 }));
    }
  }, [canProceedStep2]);

  // ステップ3: エビデンス
  const handleSetEvidence = useCallback((text: string, url?: string) => {
    setState((prev) => ({
      ...prev,
      evidenceText: text,
      evidenceUrl: url || '',
    }));
  }, []);

  // エビデンスアップロードモーダルを開く
  const handleOpenEvidenceModal = useCallback(() => {
    setState((prev) => ({
      ...prev,
      showEvidenceModal: true,
    }));
  }, []);

  // エビデンスアップロードモーダルを閉じる
  const handleCloseEvidenceModal = useCallback(() => {
    setState((prev) => ({
      ...prev,
      showEvidenceModal: false,
      isUploadingEvidence: false,
    }));
  }, []);

  // エビデンスアップロード完了
  const handleEvidenceUpload = useCallback((result: EvidenceUploadResult) => {
    setState((prev) => ({
      ...prev,
      evidenceUploadResult: result,
      evidenceUrl: result.url,
      evidenceText: result.type === 'text' ? `[${result.fileName}]` : prev.evidenceText,
      showEvidenceModal: false,
      isUploadingEvidence: false,
    }));
  }, []);

  const canProceedStep3 = useMemo(() => {
    if (!quest) return false;
    // evidenceTypeが「none」の場合はスキップ可能
    if (quest.evidenceType === 'none') return true;
    // それ以外は証跡が必要
    return state.evidenceText.length > 0 || state.evidenceUrl.length > 0;
  }, [quest, state.evidenceText, state.evidenceUrl]);

  const handleNextStep4 = useCallback(() => {
    if (canProceedStep3) {
      setState((prev) => ({ ...prev, currentStep: 4 }));
    }
  }, [canProceedStep3]);

  // ステップ4: メモ入力
  const handleSetMemo = useCallback((memo: string) => {
    setState((prev) => ({
      ...prev,
      memo,
    }));
  }, []);

  const handleSubmitCompletion = useCallback(async () => {
    if (!quest) return;

    setState((prev) => ({ ...prev, isSubmitting: true, error: null }));

    try {
      // completeQuest を呼び出し
      const result = await questUseCase.completeQuest({
        questId,
        status: 'completed',
        actualTime: state.actualTimeMinutes || quest.estimatedTime,
        evidenceUrl: state.evidenceUrl,
        evidenceNote: state.evidenceText,
        memo: state.memo,
      });

      console.log('[QuestCompletionScreen] Completion result:', result);

      setState((prev) => ({
        ...prev,
        currentStep: 5,
        result,
        isSubmitting: false,
      }));
    } catch (err) {
      console.error('[QuestCompletionScreen] Error completing quest:', err);
      setState((prev) => ({
        ...prev,
        error: 'クエスト完了の記録に失敗しました',
        isSubmitting: false,
      }));
    }
  }, [quest, questId, state, questUseCase]);

  // ステップ戻る
  const handlePreviousStep = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentStep: Math.max(1, prev.currentStep - 1) as any,
    }));
  }, []);

  // ホーム画面に戻る
  const handleGoHome = useCallback(() => {
    navigation.navigate('Home');
  }, [navigation]);

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
            testID="quest-completion-loading"
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
        testID="quest-completion-scroll"
      >
        {/* ステップインジケーター */}
        <View style={styles.stepIndicator}>
          <Text
            style={[
              styles.stepText,
              {
                color: theme.text,
              },
            ]}
            testID="quest-completion-step"
          >
            ステップ {state.currentStep} / 5
          </Text>
        </View>

        {/* ステップ1: 完了基準確認 */}
        {state.currentStep === 1 && (
          <View style={styles.stepContainer}>
            <Text
              style={[
                styles.stepTitle,
                {
                  color: theme.text,
                },
              ]}
              testID="step1-title"
            >
              クエストを完了しましたか？
            </Text>

            <View
              style={[
                styles.card,
                {
                  backgroundColor: theme.elevation.level1,
                },
              ]}
            >
              <Text
                style={[
                  styles.label,
                  {
                    color: theme.text,
                  },
                ]}
              >
                完了基準
              </Text>
              <Text
                style={[
                  styles.criteriaText,
                  {
                    color: theme.textSecondary,
                  },
                ]}
                testID="step1-criteria"
              >
                {quest.completionCriteria}
              </Text>

              <View style={styles.checkboxContainer}>
                <CheckBox
                  value={state.completionCriteriaConfirmed}
                  onValueChange={handleConfirmCriteria}
                  testID="step1-checkbox"
                />
                <Text
                  style={[
                    styles.checkboxLabel,
                    {
                      color: theme.text,
                    },
                  ]}
                >
                  完了基準を満たしました
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.button,
                {
                  backgroundColor: canProceedStep1 ? Colors.mountainBlue : Colors.gray[400],
                  opacity: canProceedStep1 ? 1 : 0.6,
                },
              ]}
              onPress={handleNextStep2}
              disabled={!canProceedStep1}
              testID="step1-next-button"
            >
              <Text style={styles.buttonText}>次へ</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ステップ2: 推定時間との比較 */}
        {state.currentStep === 2 && (
          <View style={styles.stepContainer}>
            <Text
              style={[
                styles.stepTitle,
                {
                  color: theme.text,
                },
              ]}
              testID="step2-title"
            >
              実際にかかった時間は？
            </Text>

            <Text
              style={[
                styles.subtitle,
                {
                  color: theme.textSecondary,
                },
              ]}
            >
              推定時間: {quest.estimatedTime}分
            </Text>

            {/* 時間比較選択肢 */}
            {(['as_estimated', 'shorter', 'longer', 'custom'] as TimeComparisonOption[]).map(
              (option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.optionButton,
                    {
                      backgroundColor:
                        state.timeComparison === option
                          ? Colors.mountainBlue
                          : theme.elevation.level1,
                    },
                  ]}
                  onPress={() => handleSelectTimeComparison(option)}
                  testID={`step2-option-${option}`}
                >
                  <Text
                    style={[
                      styles.optionText,
                      {
                        color:
                          state.timeComparison === option
                            ? Colors.white
                            : theme.text,
                        fontWeight: state.timeComparison === option ? '600' : '500',
                      },
                    ]}
                  >
                    {option === 'as_estimated' && '推定通り'}
                    {option === 'shorter' && '推定より短い'}
                    {option === 'longer' && '推定より長い'}
                    {option === 'custom' && '正確に入力'}
                  </Text>
                </TouchableOpacity>
              )
            )}

            {/* カスタム時間入力 */}
            {state.timeComparison === 'custom' && (
              <View
                style={[
                  styles.customTimeContainer,
                  {
                    borderColor: theme.border,
                  },
                ]}
              >
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      color: theme.text,
                      borderColor: theme.border,
                    },
                  ]}
                  placeholder="時間（分）を入力"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="number-pad"
                  value={state.actualTimeMinutes?.toString() || ''}
                  onChangeText={(text) => handleSetCustomTime(parseInt(text, 10) || 0)}
                  testID="step2-custom-input"
                />
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
                testID="step2-prev-button"
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
                testID="step2-next-button"
              >
                <Text style={styles.buttonText}>次へ</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ステップ3: エビデンス */}
        {state.currentStep === 3 && (
          <View style={styles.stepContainer}>
            <Text
              style={[
                styles.stepTitle,
                {
                  color: theme.text,
                },
              ]}
              testID="step3-title"
            >
              エビデンスを提出
            </Text>

            <Text
              style={[
                styles.subtitle,
                {
                  color: theme.textSecondary,
                },
              ]}
            >
              エビデンスタイプ: {getEvidenceTypeLabel(quest.evidenceType)}
            </Text>

            {/* エビデンスアップロードボタン */}
            {(quest.evidenceType === 'image' || quest.evidenceType === 'file' || quest.evidenceType === 'text') && (
              <TouchableOpacity
                style={[
                  styles.button,
                  {
                    backgroundColor: Colors.mountainBlue,
                  },
                ]}
                onPress={handleOpenEvidenceModal}
                testID="step3-upload-button"
              >
                <Text style={styles.buttonText}>📤 エビデンスをアップロード</Text>
              </TouchableOpacity>
            )}

            {/* アップロード済みエビデンスの表示 */}
            {state.evidenceUploadResult && (
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: Colors.successLight,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.successLabel,
                    {
                      color: Colors.success,
                    },
                  ]}
                  testID="step3-upload-success"
                >
                  ✓ エビデンスが保存されました
                </Text>
                <Text
                  style={[
                    styles.fileName,
                    {
                      color: theme.text,
                    },
                  ]}
                  testID="step3-file-name"
                >
                  {state.evidenceUploadResult.fileName}
                </Text>
              </View>
            )}

            {/* フォールバック: 手動入力フィールド */}
            {(quest.evidenceType === 'image' || quest.evidenceType === 'file') && !state.evidenceUploadResult && (
              <TextInput
                style={[
                  styles.textInput,
                  {
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
                placeholder="ファイルURLまたはパスを入力（オプション）"
                placeholderTextColor={theme.textSecondary}
                value={state.evidenceUrl}
                onChangeText={(text) => handleSetEvidence(state.evidenceText, text)}
                testID="step3-url-input"
              />
            )}

            {(quest.evidenceType === 'text' || quest.evidenceType === 'image') && !state.evidenceUploadResult && (
              <TextInput
                style={[
                  styles.textAreaInput,
                  {
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
                placeholder="エビデンスの説明またはテキストを入力"
                placeholderTextColor={theme.textSecondary}
                multiline
                numberOfLines={4}
                value={state.evidenceText}
                onChangeText={(text) => handleSetEvidence(text)}
                testID="step3-text-input"
              />
            )}

            {quest.evidenceType === 'none' && (
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: theme.elevation.level1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.infoText,
                    {
                      color: theme.textSecondary,
                    },
                  ]}
                >
                  このクエストはエビデンスが不要です
                </Text>
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
                testID="step3-prev-button"
              >
                <Text style={styles.buttonText}>戻る</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.button,
                  {
                    backgroundColor: canProceedStep3 ? Colors.mountainBlue : Colors.gray[400],
                    opacity: canProceedStep3 ? 1 : 0.6,
                  },
                ]}
                onPress={handleNextStep4}
                disabled={!canProceedStep3}
                testID="step3-next-button"
              >
                <Text style={styles.buttonText}>次へ</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ステップ4: メモ入力 */}
        {state.currentStep === 4 && (
          <View style={styles.stepContainer}>
            <Text
              style={[
                styles.stepTitle,
                {
                  color: theme.text,
                },
              ]}
              testID="step4-title"
            >
              一言メモ
            </Text>

            <Text
              style={[
                styles.subtitle,
                {
                  color: theme.textSecondary,
                },
              ]}
            >
              オプション: このクエストについて何か思ったことはありますか？
            </Text>

            <TextInput
              style={[
                styles.textAreaInput,
                {
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
              placeholder="メモを入力（オプション）"
              placeholderTextColor={theme.textSecondary}
              multiline
              numberOfLines={3}
              value={state.memo}
              onChangeText={handleSetMemo}
              testID="step4-memo-input"
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
                testID="step4-prev-button"
              >
                <Text style={styles.buttonText}>戻る</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.button,
                  {
                    backgroundColor: state.isSubmitting ? Colors.gray[400] : Colors.success,
                  },
                ]}
                onPress={handleSubmitCompletion}
                disabled={state.isSubmitting}
                testID="step4-submit-button"
              >
                {state.isSubmitting ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Text style={styles.buttonText}>クエストを完了する</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ステップ5: 結果画面 */}
        {state.currentStep === 5 && state.result && (
          <View style={styles.stepContainer}>
            <View style={styles.resultContainer}>
              <Text
                style={[
                  styles.resultTitle,
                  {
                    color: Colors.success,
                  },
                ]}
                testID="step5-result-title"
              >
                🎉 クエスト完了！
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
                  獲得歩数
                </Text>
                <Text
                  style={[
                    styles.resultValue,
                    {
                      color: Colors.mountainBlue,
                    },
                  ]}
                  testID="step5-steps-earned"
                >
                  +{state.result.stepsEarned}歩
                </Text>

                {state.result.streakUpdated && (
                  <>
                    <Text
                      style={[
                        styles.resultLabel,
                        {
                          color: theme.text,
                          marginTop: 12,
                        },
                      ]}
                    >
                      ストリーク更新
                    </Text>
                    <Text
                      style={[
                        styles.resultValue,
                        {
                          color: Colors.success,
                        },
                      ]}
                      testID="step5-streak-updated"
                    >
                      🔥 ストリーク更新！
                    </Text>
                  </>
                )}
              </View>

              <Text
                style={[
                  styles.resultMessage,
                  {
                    color: theme.textSecondary,
                  },
                ]}
              >
                おめでとうございます！次のクエストに挑戦してください。
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.button,
                {
                  backgroundColor: Colors.mountainBlue,
                },
              ]}
              onPress={handleGoHome}
              testID="step5-home-button"
            >
              <Text style={styles.buttonText}>ホームに戻る</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* エビデンスアップロードモーダル */}
      {quest && (
        <EvidenceUploadModal
          visible={state.showEvidenceModal}
          evidenceType={quest.evidenceType}
          onClose={handleCloseEvidenceModal}
          onUpload={handleEvidenceUpload}
          isLoading={state.isUploadingEvidence}
          testID="quest-completion-evidence-modal"
        />
      )}
    </SafeAreaView>
  );
};

// ヘルパー関数
function getEvidenceTypeLabel(type: string): string {
  switch (type) {
    case 'image':
      return '画像提出';
    case 'text':
      return 'テキスト入力';
    case 'file':
      return 'ファイル提出';
    case 'none':
      return 'エビデンス不要';
    default:
      return type;
  }
}

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
  stepContainer: {
    marginBottom: 20,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  card: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  criteriaText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  checkboxLabel: {
    fontSize: 14,
    marginLeft: 12,
  },
  optionButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  optionText: {
    fontSize: 16,
    textAlign: 'center',
  },
  customTimeContainer: {
    marginVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    fontSize: 14,
    marginBottom: 12,
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
  infoText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 12,
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
    marginBottom: 20,
  },
  resultTitle: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  resultCard: {
    borderRadius: 12,
    padding: 24,
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
    fontSize: 28,
    fontWeight: '700',
  },
  resultMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  successLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  fileName: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 4,
  },
});

export default QuestCompletionScreen;
