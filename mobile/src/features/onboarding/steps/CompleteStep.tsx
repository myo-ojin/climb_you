/**
 * Complete Step
 * オンボーディング完了画面
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  Animated,
  Easing,
} from 'react-native';

const CompleteStep: React.FC = () => {
  const [celebrate, setCelebrate] = useState(true);
  const scaleAnim = new Animated.Value(0);

  useEffect(() => {
    if (celebrate) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [celebrate, scaleAnim]);

  const scale = scaleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.celebrationSection}>
          <Animated.View
            style={[
              styles.celebrationIcon,
              {
                transform: [{ scale }],
              },
            ]}
          >
            <Text style={styles.mainIcon}>🏔️</Text>
          </Animated.View>

          <Text style={styles.completionTitle}>
            山登りの準備が整いました！
          </Text>

          <Text style={styles.completionSubtitle}>
            あなたの長期目標は、10段階のマイルストーンに分解されました。
            毎日のクエストを完了することで、確実に山頂を目指しましょう。
          </Text>
        </View>

        <View style={styles.milestonePreview}>
          <Text style={styles.previewTitle}>🎯 あなたの目標への道</Text>

          <View style={styles.milestoneTimeline}>
            {[1, 2, 3, 4, 5].map((station) => (
              <View key={station} style={styles.timelineItem}>
                <View style={styles.stationCircle}>
                  <Text style={styles.stationNumber}>{station}</Text>
                </View>
                <Text style={styles.stationName}>第{station}段階</Text>
              </View>
            ))}
            <Text style={styles.ellipsis}>...</Text>
            {[10].map((station) => (
              <View key={station} style={styles.timelineItem}>
                <View style={[styles.stationCircle, styles.finalStation]}>
                  <Text style={styles.stationNumber}>{station}</Text>
                </View>
                <Text style={styles.stationName}>最終段階</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.nextStepsSection}>
          <Text style={styles.nextStepsTitle}>📋 次のステップ</Text>

          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepLabel}>本日のクエストを確認</Text>
              <Text style={styles.stepDescription}>
                3つのクエスト（小・中・検証）が準備されています
              </Text>
            </View>
          </View>

          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepLabel}>クエストを完了</Text>
              <Text style={styles.stepDescription}>
                完了するたびに歩数を獲得し、山を登っていきます
              </Text>
            </View>
          </View>

          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepLabel}>合目を達成</Text>
              <Text style={styles.stepDescription}>
                各段階を達成すると、新しい視点が開けます
              </Text>
            </View>
          </View>

          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>4</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepLabel}>10合目を目指す</Text>
              <Text style={styles.stepDescription}>
                最終段階まで登れば、あなたの目標達成です！
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>💡 成功のコツ</Text>

          <Text style={styles.tipItem}>
            ✓ 毎日少しでも時間を確保することが大切です
          </Text>
          <Text style={styles.tipItem}>
            ✓ ストリーク（連続達成）を保つと、モチベーションが上がります
          </Text>
          <Text style={styles.tipItem}>
            ✓ 困ったときは、プロフィールを修正して、クエストを調整できます
          </Text>
          <Text style={styles.tipItem}>
            ✓ 週次ランキングで、同じレベルのユーザーと競争できます
          </Text>
        </View>

        <View style={styles.motivationBox}>
          <Text style={styles.motivationTitle}>🌟 最後に</Text>
          <Text style={styles.motivationText}>
            あなたの目標達成は、あなた自身の成長につながります。
            一歩ずつ進んでいけば、必ず山頂に到達できます。
            頑張ってください！
          </Text>
        </View>

        <View style={styles.spacer} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollContent: {
    paddingVertical: 20,
  },
  celebrationSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  celebrationIcon: {
    fontSize: 80,
    marginBottom: 16,
  },
  mainIcon: {
    fontSize: 80,
  },
  completionTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#112250',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 34,
  },
  completionSubtitle: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    lineHeight: 20,
    marginHorizontal: 20,
  },
  milestonePreview: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 0,
    marginBottom: 20,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#112250',
    marginBottom: 16,
    textAlign: 'center',
  },
  milestoneTimeline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  timelineItem: {
    alignItems: 'center',
    marginBottom: 12,
  },
  stationCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E8F4F8',
    borderWidth: 2,
    borderColor: '#3C507D',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  finalStation: {
    backgroundColor: '#FFF3E0',
    borderColor: '#FF9800',
  },
  stationNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3C507D',
  },
  stationName: {
    fontSize: 11,
    color: '#555',
    fontWeight: '500',
  },
  ellipsis: {
    fontSize: 20,
    color: '#999',
    marginBottom: 12,
  },
  nextStepsSection: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 0,
    marginBottom: 20,
  },
  nextStepsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#112250',
    marginBottom: 16,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3C507D',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  stepContent: {
    flex: 1,
  },
  stepLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 12,
    color: '#999',
    lineHeight: 16,
  },
  tipsSection: {
    backgroundColor: '#F0F4F8',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 0,
    marginBottom: 20,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#112250',
    marginBottom: 12,
  },
  tipItem: {
    fontSize: 13,
    color: '#333',
    lineHeight: 18,
    marginBottom: 8,
  },
  motivationBox: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 0,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  motivationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E65100',
    marginBottom: 8,
  },
  motivationText: {
    fontSize: 13,
    color: '#BF360C',
    lineHeight: 18,
  },
  spacer: {
    height: 40,
  },
});

export default CompleteStep;
