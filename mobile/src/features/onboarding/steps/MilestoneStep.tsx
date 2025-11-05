/**
 * Milestone Step
 * 生成された10合目マイルストーン確認・編集ステップ
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  ActivityIndicator,
} from 'react-native';
import { Milestone } from '../types';
import MilestoneCard from '../components/MilestoneCard';

interface MilestoneStepProps {
  milestones?: Milestone[];
  onConfirm: (milestones: Milestone[]) => void;
  onBack: () => void;
  loading: boolean;
}

const MilestoneStep: React.FC<MilestoneStepProps> = ({
  milestones = [],
  onConfirm,
  onBack,
  loading,
}) => {
  const [expandedMilestone, setExpandedMilestone] = useState<number | null>(null);

  const handleConfirm = () => {
    if (milestones.length === 0) {
      alert('マイルストーンが生成されていません');
      return;
    }

    onConfirm(milestones);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>マイルストーン確認</Text>
          <Text style={styles.subtitle}>
            10合目の山登りが準備できました
          </Text>
        </View>

        {milestones.length === 0 ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color="#3C507D" />
            <Text style={styles.emptyText}>マイルストーンを生成中...</Text>
          </View>
        ) : (
          <>
            <View style={styles.mountainViz}>
              <Text style={styles.mountainTitle}>🏔️ あなたの目標の山</Text>
              <View style={styles.stationsGrid}>
                {milestones.map((milestone) => (
                  <View
                    key={milestone.station}
                    style={[
                      styles.stationPoint,
                      {
                        top: `${(milestone.station / 10) * 100}%`,
                      },
                    ]}
                  >
                    <Text style={styles.stationLabel}>
                      {milestone.station}合目
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.milestonesSection}>
              <Text style={styles.sectionTitle}>
                全{milestones.length}段階のマイルストーン
              </Text>

              {milestones.map((milestone) => (
                <MilestoneCard
                  key={milestone.station}
                  milestone={milestone}
                  isExpanded={expandedMilestone === milestone.station}
                  onToggle={() =>
                    setExpandedMilestone(
                      expandedMilestone === milestone.station
                        ? null
                        : milestone.station
                    )
                  }
                />
              ))}
            </View>

            <View style={styles.noticeBox}>
              <Text style={styles.noticeTitle}>📝 ご確認ください</Text>
              <Text style={styles.noticeText}>
                • 各合目の達成条件が明確ですか？
              </Text>
              <Text style={styles.noticeText}>
                • 予想所要期間は現実的ですか？
              </Text>
              <Text style={styles.noticeText}>
                • 目標達成までのペースに納得できますか？
              </Text>
              <Text style={styles.noticeText}>
                修正が必要な場合は「戻る」ボタンからやり直してください。
              </Text>
            </View>
          </>
        )}
      </ScrollView>

      {milestones.length > 0 && (
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
            onPress={handleConfirm}
            disabled={loading}
            accessible
            accessibilityLabel="確認"
          >
            {loading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.confirmButtonText}>確認</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 16,
  },
  mountainViz: {
    backgroundColor: '#F0F4F8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    minHeight: 300,
    position: 'relative',
    overflow: 'hidden',
  },
  mountainTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#112250',
    marginBottom: 16,
    textAlign: 'center',
  },
  stationsGrid: {
    position: 'relative',
    width: '100%',
    height: 250,
  },
  stationPoint: {
    position: 'absolute',
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stationLabel: {
    backgroundColor: '#3C507D',
    color: '#FFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 11,
    fontWeight: '600',
  },
  milestonesSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#112250',
    marginBottom: 12,
  },
  noticeBox: {
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    padding: 12,
    marginTop: 20,
    borderLeftWidth: 3,
    borderLeftColor: '#FF9800',
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E65100',
    marginBottom: 8,
  },
  noticeText: {
    fontSize: 13,
    color: '#BF360C',
    lineHeight: 18,
    marginBottom: 4,
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

export default MilestoneStep;
