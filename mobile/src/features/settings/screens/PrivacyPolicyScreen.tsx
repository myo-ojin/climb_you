/**
 * PrivacyPolicyScreen
 * プライバシーポリシー表示画面
 *
 * 機能:
 * - プライバシーポリシーの全文表示
 * - バージョン・最終更新日の表示
 * - スクロール可能なMarkdown表示
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Linking, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList } from '@/navigation/types';
import { PrivacySettingsService, PrivacyPolicy } from '@/services/PrivacySettingsService';

type Props = NativeStackScreenProps<MainStackParamList, 'PrivacyPolicy'>;

export const PrivacyPolicyScreen: React.FC<Props> = ({ navigation }) => {
  const [policy, setPolicy] = useState<PrivacyPolicy | null>(null);

  useEffect(() => {
    const loadPolicy = () => {
      const privacyPolicy = PrivacySettingsService.getPrivacyPolicy();
      setPolicy(privacyPolicy);
    };

    loadPolicy();
  }, []);

  const handleOpenURL = async () => {
    if (policy?.url) {
      const supported = await Linking.canOpenURL(policy.url);
      if (supported) {
        await Linking.openURL(policy.url);
      }
    }
  };

  if (!policy) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>読み込み中...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <Text style={styles.title}>プライバシーポリシー</Text>
        <Text style={styles.version}>バージョン: {policy.version}</Text>
        <Text style={styles.lastUpdated}>最終更新: {policy.lastUpdated}</Text>
      </View>

      {/* 本文 */}
      <View style={styles.content}>
        <Text style={styles.policyText}>{policy.content}</Text>
      </View>

      {/* URLリンク */}
      {policy.url && (
        <View style={styles.footer}>
          <TouchableOpacity onPress={handleOpenURL} style={styles.linkButton}>
            <Text style={styles.linkText}>Webで開く</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  version: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  lastUpdated: {
    fontSize: 14,
    color: '#666',
  },
  content: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 8,
  },
  policyText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#333',
  },
  footer: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 8,
    marginBottom: 24,
    alignItems: 'center',
  },
  linkButton: {
    backgroundColor: '#3C507D',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  linkText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
