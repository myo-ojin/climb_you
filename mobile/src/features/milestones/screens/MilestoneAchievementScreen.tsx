/**
 * MilestoneAchievementScreen
 * マイルストーン達成確認画面
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '@/navigation/types';
import { useMilestoneAchievement } from '../hooks/useMilestoneAchievement';
import {
  AchievementDialog,
  EvidenceUpload,
  ProgressRateInput,
  AdjustmentOptions,
} from '../components';
import { Evidence, NotAchievedOption } from '../types';

type MilestoneAchievementScreenRouteProp = RouteProp<
  MainStackParamList,
  'MilestoneAchievement'
>;

type MilestoneAchievementScreenNavigationProp = NativeStackNavigationProp<
  MainStackParamList,
  'MilestoneAchievement'
>;

/**
 * 画面の状態
 */
enum ScreenState {
  DIALOG = 'dialog', // 達成確認ダイアログ
  EVIDENCE_UPLOAD = 'evidence_upload', // 証跡提出
  PROGRESS_INPUT = 'progress_input', // 進捗率入力
  ADJUSTMENT_OPTIONS = 'adjustment_options', // 調整選択肢
  COMPLETED = 'completed', // 完了
}

/**
 * MilestoneAchievementScreen Component
 */
export const MilestoneAchievementScreen: React.FC = () => {
  const route = useRoute<MilestoneAchievementScreenRouteProp>();
  const navigation = useNavigation<MilestoneAchievementScreenNavigationProp>();
  const { userId } = useSelector((state: RootState) => state.auth);

  const { milestoneId } = route.params;

  const {
    achievementState,
    isLoading,
    error,
    confirmAchievement,
    confirmNotAchieved,
    adjustmentProposal,
    redesignProposal,
    approveAdjustment,
    approveRedesign,
  } = useMilestoneAchievement(userId || '', milestoneId);

  const [screenState, setScreenState] = useState<ScreenState>(ScreenState.DIALOG);
  const [dialogVisible, setDialogVisible] = useState(true);
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | undefined>();
  const [progressRate, setProgressRate] = useState<number>(50);
  const [selectedOption, setSelectedOption] = useState<NotAchievedOption | undefined>();

  /**
   * すでに確認済みの場合は、完了画面に移動
   */
  useEffect(() => {
    if (achievementState?.isConfirmed) {
      setScreenState(ScreenState.COMPLETED);
      setDialogVisible(false);
    }
  }, [achievementState]);

  /**
   * 「はい」を選択（達成）
   */
  const handleConfirmAchieved = () => {
    setDialogVisible(false);
    setScreenState(ScreenState.EVIDENCE_UPLOAD);
  };

  /**
   * 「いいえ」を選択（未達成）
   */
  const handleConfirmNotAchieved = () => {
    setDialogVisible(false);
    setScreenState(ScreenState.PROGRESS_INPUT);
  };

  /**
   * ダイアログを閉じる
   */
  const handleCloseDialog = () => {
    setDialogVisible(false);
    navigation.goBack();
  };

  /**
   * 証跡を提出
   */
  const handleSubmitEvidence = async () => {
    if (!selectedEvidence) {
      Alert.alert('エラー', '証跡を提出してください');
      return;
    }

    await confirmAchievement(selectedEvidence);
    setScreenState(ScreenState.COMPLETED);
  };

  /**
   * 進捗率入力を完了
   */
  const handleCompleteProgressInput = () => {
    setScreenState(ScreenState.ADJUSTMENT_OPTIONS);
  };

  /**
   * 調整選択肢を選択
   */
  const handleSelectAdjustmentOption = async (option: NotAchievedOption) => {
    setSelectedOption(option);
  };

  /**
   * 調整を確定
   */
  const handleConfirmAdjustment = async () => {
    if (!selectedOption) {
      Alert.alert('エラー', '選択肢を選んでください');
      return;
    }

    await confirmNotAchieved(progressRate, selectedOption);

    // 選択肢に応じた画面遷移
    if (selectedOption === NotAchievedOption.CONTINUE) {
      setScreenState(ScreenState.COMPLETED);
    }
    // ADJUST_GOALとREDESIGN_MILESTONESの場合は、提案画面に遷移（useMilestoneAchievementで処理）
  };

  /**
   * ローディング中
   */
  if (isLoading && !achievementState) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3C507D" />
          <Text style={styles.loadingText}>読み込み中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  /**
   * エラー
   */
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>エラー</Text>
          <Text style={styles.errorMessage}>{error.message}</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>戻る</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  /**
   * データなし
   */
  if (!achievementState) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>マイルストーンが見つかりません</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>戻る</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 達成確認ダイアログ */}
      <AchievementDialog
        visible={dialogVisible}
        achievementState={achievementState}
        onConfirmAchieved={handleConfirmAchieved}
        onConfirmNotAchieved={handleConfirmNotAchieved}
        onClose={handleCloseDialog}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* 証跡提出画面 */}
        {screenState === ScreenState.EVIDENCE_UPLOAD && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {achievementState.milestone.stationNumber}合目 達成の証跡を提出
            </Text>
            <Text style={styles.sectionSubtitle}>
              {achievementState.milestone.title}
            </Text>

            <EvidenceUpload
              onEvidenceSelected={setSelectedEvidence}
              selectedEvidence={selectedEvidence}
              isUploading={isLoading}
            />

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  !selectedEvidence && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmitEvidence}
                disabled={!selectedEvidence || isLoading}
              >
                <Text style={styles.submitButtonText}>
                  {isLoading ? '送信中...' : '証跡を提出'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setScreenState(ScreenState.DIALOG)}
              >
                <Text style={styles.cancelButtonText}>戻る</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 進捗率入力画面 */}
        {screenState === ScreenState.PROGRESS_INPUT && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>現在の進捗率を教えてください</Text>
            <Text style={styles.sectionSubtitle}>
              {achievementState.milestone.stationNumber}合目:{' '}
              {achievementState.milestone.title}
            </Text>

            <ProgressRateInput
              initialValue={progressRate}
              onProgressRateChange={setProgressRate}
              milestoneTitle={achievementState.milestone.title}
              criteria={achievementState.milestone.criteria}
            />

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleCompleteProgressInput}
              >
                <Text style={styles.submitButtonText}>次へ</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setScreenState(ScreenState.DIALOG)}
              >
                <Text style={styles.cancelButtonText}>戻る</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 調整選択肢画面 */}
        {screenState === ScreenState.ADJUSTMENT_OPTIONS && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>次のステップを選択</Text>

            <AdjustmentOptions
              progressRate={progressRate}
              milestoneTitle={achievementState.milestone.title}
              onOptionSelect={handleSelectAdjustmentOption}
              selectedOption={selectedOption}
            />

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  !selectedOption && styles.submitButtonDisabled,
                ]}
                onPress={handleConfirmAdjustment}
                disabled={!selectedOption || isLoading}
              >
                <Text style={styles.submitButtonText}>
                  {isLoading ? '処理中...' : '決定'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setScreenState(ScreenState.PROGRESS_INPUT)}
              >
                <Text style={styles.cancelButtonText}>戻る</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 調整提案画面 */}
        {adjustmentProposal && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>目標調整の提案</Text>

            <View style={styles.proposalCard}>
              <Text style={styles.proposalReason}>{adjustmentProposal.reason}</Text>

              <View style={styles.changesContainer}>
                <Text style={styles.changesTitle}>変更点</Text>
                {adjustmentProposal.changes.map((change, index) => (
                  <View key={index} style={styles.changeItem}>
                    <Text style={styles.changeField}>
                      {change.field === 'title'
                        ? 'タイトル'
                        : change.field === 'kpi'
                        ? 'KPI'
                        : '期限'}
                    </Text>
                    <Text style={styles.changeBefore}>変更前: {change.before}</Text>
                    <Text style={styles.changeAfter}>変更後: {change.after}</Text>
                    <Text style={styles.changeExplanation}>{change.explanation}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={approveAdjustment}
                disabled={isLoading}
              >
                <Text style={styles.submitButtonText}>
                  {isLoading ? '承認中...' : 'この提案を承認'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.cancelButtonText}>キャンセル</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 再設計提案画面 */}
        {redesignProposal && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>マイルストーン再設計の提案</Text>

            <View style={styles.proposalCard}>
              <Text style={styles.proposalReason}>{redesignProposal.reason}</Text>

              <View style={styles.analysisContainer}>
                <Text style={styles.analysisTitle}>進捗状況分析</Text>
                <Text style={styles.analysisText}>
                  • 現在の合目: {redesignProposal.progressAnalysis.currentStation}
                </Text>
                <Text style={styles.analysisText}>
                  • 累計歩数: {redesignProposal.progressAnalysis.totalSteps.toLocaleString()}
                </Text>
                <Text style={styles.analysisText}>
                  • 平均達成率: {redesignProposal.progressAnalysis.averageAchievementRate}%
                </Text>
                <Text style={styles.analysisTitle}>特定された課題</Text>
                {redesignProposal.progressAnalysis.identifiedIssues.map((issue, index) => (
                  <Text key={index} style={styles.analysisText}>
                    • {issue}
                  </Text>
                ))}
              </View>

              <View style={styles.milestonesContainer}>
                <Text style={styles.milestonesTitle}>新しいマイルストーン</Text>
                {redesignProposal.newMilestones.map((milestone) => (
                  <View key={milestone.stationNumber} style={styles.milestoneItem}>
                    <Text style={styles.milestoneNumber}>
                      {milestone.stationNumber}合目
                    </Text>
                    <Text style={styles.milestoneTitle}>{milestone.title}</Text>
                    <Text style={styles.milestoneCriteria}>{milestone.criteria}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={approveRedesign}
                disabled={isLoading}
              >
                <Text style={styles.submitButtonText}>
                  {isLoading ? '承認中...' : 'この提案を承認'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.cancelButtonText}>キャンセル</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 完了画面 */}
        {screenState === ScreenState.COMPLETED && (
          <View style={styles.completedContainer}>
            <Text style={styles.completedIcon}>✅</Text>
            <Text style={styles.completedTitle}>記録完了</Text>
            <Text style={styles.completedMessage}>
              {achievementState.confirmation?.achieved
                ? `おめでとうございます！${achievementState.milestone.stationNumber}合目を達成しました。`
                : '進捗を記録しました。引き続き頑張りましょう！'}
            </Text>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={() => navigation.navigate('Progress')}
            >
              <Text style={styles.submitButtonText}>進捗画面に戻る</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  analysisContainer: {
    gap: 8,
  },
  analysisText: {
    color: '#666',
    fontSize: 13,
  },
  analysisTitle: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  backButton: {
    backgroundColor: '#3C507D',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  backButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonContainer: {
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  cancelButtonText: {
    color: '#999',
    fontSize: 14,
  },
  changeAfter: {
    color: '#4CAF50',
    fontSize: 13,
    fontWeight: '600',
  },
  changeBefore: {
    color: '#999',
    fontSize: 13,
  },
  changeExplanation: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
  },
  changeField: {
    color: '#3C507D',
    fontSize: 14,
    fontWeight: '600',
  },
  changeItem: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    gap: 4,
    padding: 12,
  },
  changesContainer: {
    gap: 12,
  },
  changesTitle: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  completedContainer: {
    alignItems: 'center',
    gap: 20,
    paddingVertical: 40,
  },
  completedIcon: {
    fontSize: 80,
  },
  completedMessage: {
    color: '#666',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  completedTitle: {
    color: '#333',
    fontSize: 24,
    fontWeight: '700',
  },
  container: {
    backgroundColor: '#FAFAFA',
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    flex: 1,
    gap: 16,
    justifyContent: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#666',
    fontSize: 18,
    fontWeight: '600',
  },
  errorContainer: {
    alignItems: 'center',
    flex: 1,
    gap: 16,
    justifyContent: 'center',
    padding: 20,
  },
  errorMessage: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
  },
  errorTitle: {
    color: '#D32F2F',
    fontSize: 20,
    fontWeight: '700',
  },
  loadingContainer: {
    alignItems: 'center',
    flex: 1,
    gap: 16,
    justifyContent: 'center',
  },
  loadingText: {
    color: '#666',
    fontSize: 16,
  },
  milestoneCriteria: {
    color: '#666',
    fontSize: 12,
  },
  milestoneItem: {
    backgroundColor: '#F0F4F8',
    borderRadius: 8,
    gap: 4,
    padding: 12,
  },
  milestoneNumber: {
    color: '#3C507D',
    fontSize: 14,
    fontWeight: '700',
  },
  milestoneTitle: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
  },
  milestonesContainer: {
    gap: 12,
  },
  milestonesTitle: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  proposalCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    elevation: 2,
    gap: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  proposalReason: {
    color: '#333',
    fontSize: 16,
    lineHeight: 24,
  },
  scrollContent: {
    padding: 20,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    gap: 20,
  },
  sectionSubtitle: {
    color: '#666',
    fontSize: 16,
    marginTop: -12,
  },
  sectionTitle: {
    color: '#333',
    fontSize: 22,
    fontWeight: '700',
  },
  submitButton: {
    alignItems: 'center',
    backgroundColor: '#3C507D',
    borderRadius: 12,
    paddingVertical: 16,
  },
  submitButtonDisabled: {
    backgroundColor: '#CCC',
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
