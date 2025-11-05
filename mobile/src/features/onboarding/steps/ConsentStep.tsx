/**
 * Consent Step
 * プライバシーとデータ収集への同意画面
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
} from 'react-native';
import { ConsentData } from '../types';

interface ConsentStepProps {
  onAgree: (consent: ConsentData) => void;
  onCancel?: () => void;
  loading: boolean;
}

const ConsentStep: React.FC<ConsentStepProps> = ({
  onAgree,
  onCancel,
  loading,
}) => {
  const [dataCollectionConsent, setDataCollectionConsent] = useState(false);
  const [privacyPolicyConsent, setPrivacyPolicyConsent] = useState(false);

  const handleAgree = () => {
    if (!dataCollectionConsent || !privacyPolicyConsent) {
      alert('Please accept both terms to continue');
      return;
    }

    onAgree({
      dataCollection: dataCollectionConsent,
      privacyPolicy: privacyPolicyConsent,
      timestamp: Date.now(),
    });
  };

  const canProceed = dataCollectionConsent && privacyPolicyConsent;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>climb-youへようこそ</Text>
          <Text style={styles.subtitle}>
            長期目標を達成するための準備をしましょう
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>データ収集と利用について</Text>
          <Text style={styles.description}>
            climb-youは、あなたの目標達成をサポートするために、以下のデータを収集・利用します：
          </Text>

          <View style={styles.dataList}>
            <Text style={styles.dataItem}>• 長期目標と期間</Text>
            <Text style={styles.dataItem}>
              • 1日のコミット時間とライフスタイル
            </Text>
            <Text style={styles.dataItem}>• クエスト完了履歴と進捗状況</Text>
            <Text style={styles.dataItem}>• プロファイル情報（スキルレベル、環境など）</Text>
            <Text style={styles.dataItem}>
              • アプリの利用パターン（改善目的）
            </Text>
          </View>

          <Text style={styles.description}>
            収集データは以下の目的で使用されます：
          </Text>

          <View style={styles.purposeList}>
            <Text style={styles.purposeItem}>
              1. あなたに最適なクエストを生成する
            </Text>
            <Text style={styles.purposeItem}>
              2. 進捗を追跡し、達成感を提供する
            </Text>
            <Text style={styles.purposeItem}>3. アプリを改善する</Text>
            <Text style={styles.purposeItem}>
              4. コミュニティランキング（同レベルのユーザー同士）
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>データ保護</Text>
          <Text style={styles.description}>
            • データは暗号化されて保存されます
          </Text>
          <Text style={styles.description}>
            • あなたを個人特定するデータは匿名IDで管理されます
          </Text>
          <Text style={styles.description}>
            • クエストログは180日間保持されます
          </Text>
          <Text style={styles.description}>
            • 目標データは削除リクエストまで保持されます
          </Text>
        </View>

        <View style={styles.checkboxSection}>
          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => setDataCollectionConsent(!dataCollectionConsent)}
            accessible
            accessibilityLabel="データ収集に同意する"
            accessibilityHint="チェックボックス"
          >
            <View
              style={[
                styles.checkboxBox,
                dataCollectionConsent && styles.checkboxBoxChecked,
              ]}
            >
              {dataCollectionConsent && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </View>
            <Text style={styles.checkboxLabel}>
              データ収集と利用に同意する
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => setPrivacyPolicyConsent(!privacyPolicyConsent)}
            accessible
            accessibilityLabel="プライバシーポリシーに同意する"
            accessibilityHint="チェックボックス"
          >
            <View
              style={[
                styles.checkboxBox,
                privacyPolicyConsent && styles.checkboxBoxChecked,
              ]}
            >
              {privacyPolicyConsent && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </View>
            <Text style={styles.checkboxLabel}>
              プライバシーポリシーに同意する
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.policyLink}>
          詳細は{' '}
          <Text style={styles.linkText}>プライバシーポリシー</Text>
          をご確認ください
        </Text>
      </ScrollView>

      <View style={styles.actionSection}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onCancel}
          disabled={loading}
          accessible
          accessibilityLabel="キャンセル"
        >
          <Text style={styles.cancelButtonText}>キャンセル</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.agreeButton,
            !canProceed && styles.agreeButtonDisabled,
          ]}
          onPress={handleAgree}
          disabled={!canProceed || loading}
          accessible
          accessibilityLabel="同意して続行"
        >
          <Text style={styles.agreeButtonText}>同意して続行</Text>
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
    marginBottom: 20,
    paddingHorizontal: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#112250',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 10,
  },
  dataList: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  dataItem: {
    fontSize: 13,
    color: '#333',
    lineHeight: 18,
    marginBottom: 6,
  },
  purposeList: {
    backgroundColor: '#E8F4F8',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  purposeItem: {
    fontSize: 13,
    color: '#333',
    lineHeight: 18,
    marginBottom: 6,
  },
  checkboxSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 0,
  },
  checkboxBox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#CCCCCC',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxBoxChecked: {
    backgroundColor: '#3C507D',
    borderColor: '#3C507D',
  },
  checkmark: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    lineHeight: 20,
  },
  policyLink: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 12,
  },
  linkText: {
    color: '#3C507D',
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
  actionSection: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 0,
    paddingBottom: 20,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    backgroundColor: '#FFF',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  agreeButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#3C507D',
  },
  agreeButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  agreeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
    textAlign: 'center',
  },
});

export default ConsentStep;
