/**
 * SMART Analysis Display Component
 * SMART基準の分析結果を表示
 */

import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { SmartAnalysis } from '../types';

interface SmartAnalysisDisplayProps {
  smartAnalysis: SmartAnalysis;
}

const SmartAnalysisDisplay: React.FC<SmartAnalysisDisplayProps> = ({
  smartAnalysis,
}) => {
  const criteria = [
    { key: 'specific', label: 'Specific（具体的）', description: '目標が具体的に定義されているか' },
    { key: 'measurable', label: 'Measurable（測定可能）', description: '進捗が測定・追跡できるか' },
    { key: 'achievable', label: 'Achievable（達成可能）', description: '現実的に達成可能か' },
    { key: 'relevant', label: 'Relevant（関連性）', description: '自分の価値観と関連があるか' },
    { key: 'timeBound', label: 'Time-bound（期限付き）', description: '達成期限が明確か' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SMART基準の分析</Text>

      {criteria.map((criterion) => {
        const isMet = smartAnalysis[criterion.key as keyof SmartAnalysis];

        return (
          <View
            key={criterion.key}
            style={[
              styles.criterionItem,
              isMet ? styles.criterionMet : styles.criterionUnmet,
            ]}
          >
            <View style={styles.criterionHeader}>
              <Text style={styles.criterionIcon}>
                {isMet ? '✓' : '✗'}
              </Text>
              <View style={styles.criterionText}>
                <Text style={styles.criterionLabel}>{criterion.label}</Text>
                <Text style={styles.criterionDescription}>
                  {criterion.description}
                </Text>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#112250',
    marginBottom: 12,
  },
  criterionItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    borderRadius: 6,
    borderLeftWidth: 3,
  },
  criterionMet: {
    backgroundColor: '#E8F5E9',
    borderLeftColor: '#4CAF50',
  },
  criterionUnmet: {
    backgroundColor: '#FFEBEE',
    borderLeftColor: '#F44336',
  },
  criterionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  criterionIcon: {
    fontSize: 16,
    fontWeight: '700',
    marginRight: 10,
    color: '#333',
    marginTop: 2,
  },
  criterionText: {
    flex: 1,
  },
  criterionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  criterionDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
});

export default SmartAnalysisDisplay;
