/**
 * Milestone Card Component
 * 各マイルストーンを表示するカード
 */

import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Milestone } from '../types';

// Enable layout animation on Android
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface MilestoneCardProps {
  milestone: Milestone;
  isExpanded: boolean;
  onToggle: () => void;
}

const MilestoneCard: React.FC<MilestoneCardProps> = ({
  milestone,
  isExpanded,
  onToggle,
}) => {
  const handleToggle = () => {
    LayoutAnimation.configureNext(
      LayoutAnimation.Presets.easeInEaseOut
    );
    onToggle();
  };

  const stationColor = milestone.station === 10 ? '#FF9800' : '#3C507D';
  const stationBackgroundColor =
    milestone.station === 10 ? '#FFF3E0' : '#E8F4F8';

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.header,
          isExpanded && styles.headerExpanded,
        ]}
        onPress={handleToggle}
        accessible
        accessibilityLabel={`${milestone.station}合目 ${milestone.title}`}
        accessibilityHint={isExpanded ? '展開中' : '折畳み中'}
      >
        <View
          style={[
            styles.stationBadge,
            { backgroundColor: stationBackgroundColor },
          ]}
        >
          <Text style={[styles.stationLabel, { color: stationColor }]}>
            {milestone.station}合目
          </Text>
        </View>

        <View style={styles.titleSection}>
          <Text style={styles.title} numberOfLines={1}>
            {milestone.title}
          </Text>
          <Text style={styles.duration}>{milestone.estimatedDuration}</Text>
        </View>

        <Text style={styles.expandIcon}>
          {isExpanded ? '▼' : '▶'}
        </Text>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.content}>
          <Text style={styles.label}>説明</Text>
          <Text style={styles.description}>{milestone.description}</Text>

          <Text style={[styles.label, { marginTop: 12 }]}>達成条件</Text>
          <Text style={styles.criteria}>{milestone.completionCriteria}</Text>

          <Text style={[styles.label, { marginTop: 12 }]}>予想所要期間</Text>
          <Text style={styles.duration}>{milestone.estimatedDuration}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  headerExpanded: {
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  stationBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 12,
  },
  stationLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  titleSection: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  duration: {
    fontSize: 11,
    color: '#999',
  },
  expandIcon: {
    fontSize: 12,
    color: '#999',
  },
  content: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FAFAFA',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    marginBottom: 6,
  },
  description: {
    fontSize: 13,
    color: '#555',
    lineHeight: 18,
    marginBottom: 4,
  },
  criteria: {
    fontSize: 13,
    color: '#333',
    lineHeight: 18,
    fontWeight: '500',
  },
});

export default MilestoneCard;
