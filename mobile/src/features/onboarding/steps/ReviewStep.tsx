/**
 * Review Step
 * オンボーディング全体の確認ステップ
 */

import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  ActivityIndicator,
} from 'react-native';
import { GoalData, UserProfileData } from '../types';

interface ReviewStepProps {
  goal?: GoalData;
  duration?: string;
  dailyCommitTime?: string;
  profile?: UserProfileData;
  milestonesCount: number;
  onConfirm: () => void;
  onBack: () => void;
  loading: boolean;
}

const ReviewStep: React.FC<ReviewStepProps> = ({
  goal,
  duration,
  dailyCommitTime,
  profile,
  milestonesCount,
  onConfirm,
  onBack,
  loading,
}) => {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>最終確認</Text>
          <Text style={styles.subtitle}>
            すべての設定を確認してオンボーディングを完了してください
          </Text>
        </View>

        {goal && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>🎯</Text>
              <Text style={styles.sectionTitle}>目標</Text>
            </View>
            <View style={styles.sectionContent}>
              <Text style={styles.label}>目標タイトル</Text>
              <Text style={styles.value}>{goal.title}</Text>

              <Text style={[styles.label, { marginTop: 12 }]}>KPI</Text>
              <Text style={styles.value}>{goal.kpi}</Text>

              {goal.obstacles.length > 0 && (
                <>
                  <Text style={[styles.label, { marginTop: 12 }]}>
                    予想される障害
                  </Text>
                  {goal.obstacles.map((obstacle, index) => (
                    <Text key={index} style={styles.listItem}>
                      {index + 1}. {obstacle}
                    </Text>
                  ))}
                </>
              )}

              {goal.plans.length > 0 && (
                <>
                  <Text style={[styles.label, { marginTop: 12 }]}>
                    対処計画
                  </Text>
                  {goal.plans.map((plan, index) => (
                    <Text key={index} style={styles.listItem}>
                      {index + 1}. {plan}
                    </Text>
                  ))}
                </>
              )}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>📅</Text>
            <Text style={styles.sectionTitle}>期間と時間</Text>
          </View>
          <View style={styles.sectionContent}>
            <View style={styles.row}>
              <Text style={styles.label}>目標期間</Text>
              <Text style={styles.value}>{duration}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>1日のコミットタイム</Text>
              <Text style={styles.value}>{dailyCommitTime}</Text>
            </View>
          </View>
        </View>

        {profile && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>👤</Text>
              <Text style={styles.sectionTitle}>プロファイル</Text>
            </View>
            <View style={styles.sectionContent}>
              <View style={styles.profileGrid}>
                <View style={styles.profileItem}>
                  <Text style={styles.profileLabel}>生活パターン</Text>
                  <Text style={styles.profileValue}>{profile.lifestyle}</Text>
                </View>
                <View style={styles.profileItem}>
                  <Text style={styles.profileLabel}>集中時間</Text>
                  <Text style={styles.profileValue}>{profile.focusTime}</Text>
                </View>
                <View style={styles.profileItem}>
                  <Text style={styles.profileLabel}>作業環境</Text>
                  <Text style={styles.profileValue}>
                    {profile.workEnvironment}
                  </Text>
                </View>
                <View style={styles.profileItem}>
                  <Text style={styles.profileLabel}>好みのペース</Text>
                  <Text style={styles.profileValue}>{profile.taskPace}</Text>
                </View>
                <View style={styles.profileItem}>
                  <Text style={styles.profileLabel}>経験レベル</Text>
                  <Text style={styles.profileValue}>{profile.skillLevel}</Text>
                </View>
                <View style={styles.profileItem}>
                  <Text style={styles.profileLabel}>難易度の好み</Text>
                  <Text style={styles.profileValue}>
                    {profile.difficultyPreference}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🏔️</Text>
            <Text style={styles.sectionTitle}>マイルストーン</Text>
          </View>
          <View style={styles.sectionContent}>
            <Text style={styles.milestoneSummary}>
              {milestonesCount}合目まで、{milestonesCount}段階のマイルストーンが生成されました
            </Text>
          </View>
        </View>

        <View style={styles.confirmBox}>
          <Text style={styles.confirmTitle}>✓ 確認事項</Text>
          <Text style={styles.confirmItem}>
            • 上記の情報は正確ですか？
          </Text>
          <Text style={styles.confirmItem}>
            • 修正が必要な場合は「戻る」ボタンで戻ってください
          </Text>
          <Text style={styles.confirmItem}>
            • 「完了」ボタンを押すと、オンボーディングが終了します
          </Text>
        </View>

        <View style={styles.readyBox}>
          <Text style={styles.readyTitle}>🚀 準備完了！</Text>
          <Text style={styles.readyText}>
            これであなたの山登りが始まります。毎日のクエストを完了して、10合目を目指しましょう！
          </Text>
        </View>
      </ScrollView>

      <View style={styles.actionSection}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          disabled={loading}
          accessible
          accessibilityLabel="戻る"
        >
          <Text style={styles.backButtonText}>戻る</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.confirmButton, loading && styles.confirmButtonDisabled]}
          onPress={onConfirm}
          disabled={loading}
          accessible
          accessibilityLabel="完了"
        >
          {loading ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <Text style={styles.confirmButtonText}>完了</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#112250',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  section: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F0F4F8',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  sectionIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#112250',
  },
  sectionContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    marginBottom: 4,
  },
  value: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    lineHeight: 20,
  },
  listItem: {
    fontSize: 13,
    color: '#555',
    marginBottom: 6,
    lineHeight: 18,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  profileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  profileItem: {
    width: '50%',
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  profileLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#999',
    marginBottom: 4,
  },
  profileValue: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  milestoneSummary: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  confirmBox: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  confirmTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 8,
  },
  confirmItem: {
    fontSize: 12,
    color: '#1B5E20',
    lineHeight: 16,
    marginBottom: 4,
  },
  readyBox: {
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: '#FF9800',
  },
  readyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E65100',
    marginBottom: 8,
  },
  readyText: {
    fontSize: 13,
    color: '#BF360C',
    lineHeight: 18,
  },
  actionSection: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 0,
    paddingBottom: 20,
    marginTop: 20,
  },
  backButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    backgroundColor: '#FFF',
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#3C507D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
    textAlign: 'center',
  },
});

export default ReviewStep;
