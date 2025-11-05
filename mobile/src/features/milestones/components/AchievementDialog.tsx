/**
 * AchievementDialog Component
 * マイルストーン達成確認ダイアログ
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { MilestoneAchievementState } from '../types';

export interface AchievementDialogProps {
  /**
   * 表示するかどうか
   */
  visible: boolean;

  /**
   * マイルストーン達成状態
   */
  achievementState: MilestoneAchievementState | null;

  /**
   * 「はい」を選択した時のコールバック
   */
  onConfirmAchieved: () => void;

  /**
   * 「いいえ」を選択した時のコールバック
   */
  onConfirmNotAchieved: () => void;

  /**
   * ダイアログを閉じる時のコールバック
   */
  onClose: () => void;
}

/**
 * AchievementDialog Component
 */
export const AchievementDialog: React.FC<AchievementDialogProps> = ({
  visible,
  achievementState,
  onConfirmAchieved,
  onConfirmNotAchieved,
  onClose,
}) => {
  if (!achievementState) {
    return null;
  }

  const { milestone, currentSteps } = achievementState;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.dialogContainer}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
          >
            {/* ヘッダー */}
            <View style={styles.header}>
              <Text style={styles.headerIcon}>🎉</Text>
              <Text style={styles.headerTitle}>
                {milestone.stationNumber}合目に到達しました！
              </Text>
            </View>

            {/* マイルストーン情報 */}
            <View style={styles.milestoneInfo}>
              <Text style={styles.milestoneTitle}>{milestone.title}</Text>
              <Text style={styles.milestoneCriteria}>
                達成基準: {milestone.criteria}
              </Text>
            </View>

            {/* 進捗情報 */}
            <View style={styles.progressInfo}>
              <View style={styles.progressItem}>
                <Text style={styles.progressLabel}>必要歩数</Text>
                <Text style={styles.progressValue}>
                  {milestone.requiredSteps.toLocaleString()} 歩
                </Text>
              </View>
              <View style={styles.progressItem}>
                <Text style={styles.progressLabel}>現在の歩数</Text>
                <Text style={styles.progressValue}>
                  {currentSteps.toLocaleString()} 歩
                </Text>
              </View>
            </View>

            {/* 確認質問 */}
            <View style={styles.questionContainer}>
              <Text style={styles.questionText}>
                この目標を達成しましたか？
              </Text>
              <Text style={styles.questionSubtext}>
                達成した場合は証跡の提出が必要です
              </Text>
            </View>

            {/* ボタン */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.yesButton]}
                onPress={onConfirmAchieved}
              >
                <Text style={styles.buttonText}>はい、達成しました</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.noButton]}
                onPress={onConfirmNotAchieved}
              >
                <Text style={styles.buttonText}>いいえ、まだです</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>後で確認する</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: 16,
  },
  buttonContainer: {
    gap: 12,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  cancelButtonText: {
    color: '#999',
    fontSize: 14,
  },
  dialogContainer: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    elevation: 5,
    maxHeight: '80%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  headerTitle: {
    color: '#333',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  milestoneCriteria: {
    color: '#666',
    fontSize: 14,
    lineHeight: 20,
  },
  milestoneInfo: {
    backgroundColor: '#F0F4F8',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
  },
  milestoneTitle: {
    color: '#3C507D',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  noButton: {
    backgroundColor: '#FF9800',
  },
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  progressInfo: {
    borderBottomWidth: 1,
    borderColor: '#E0E0E0',
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
    paddingVertical: 16,
  },
  progressItem: {
    alignItems: 'center',
  },
  progressLabel: {
    color: '#999',
    fontSize: 12,
    marginBottom: 4,
  },
  progressValue: {
    color: '#3C507D',
    fontSize: 20,
    fontWeight: '700',
  },
  questionContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  questionSubtext: {
    color: '#999',
    fontSize: 12,
    textAlign: 'center',
  },
  questionText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  scrollContent: {
    padding: 24,
  },
  scrollView: {
    flex: 1,
  },
  yesButton: {
    backgroundColor: '#4CAF50',
  },
});
