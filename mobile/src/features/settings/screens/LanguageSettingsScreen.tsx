/**
 * LanguageSettingsScreen
 * 言語設定画面
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from '@/hooks/useTranslation';
import { getSupportedLanguages } from '@/config/i18n';

/**
 * 言語設定画面コンポーネント
 */
export const LanguageSettingsScreen: React.FC = () => {
  const { t, currentLanguage, changeLanguage } = useTranslation();
  const [isChanging, setIsChanging] = useState(false);

  const supportedLanguages = getSupportedLanguages();

  /**
   * 言語変更ハンドラー
   */
  const handleLanguageChange = useCallback(
    async (languageCode: string) => {
      if (languageCode === currentLanguage) {
        return; // 既に選択されている言語の場合は何もしない
      }

      try {
        setIsChanging(true);

        await changeLanguage(languageCode);

        // 成功メッセージを表示（変更後の言語で表示される）
        Alert.alert(
          t('common.done'),
          t('settings.language_description'),
          [{ text: t('common.ok') }]
        );
      } catch (error) {
        console.error('[LanguageSettings] Failed to change language:', error);

        // エラーメッセージを表示（具体的なエラー内容を含める）
        const errorMessage = error instanceof Error ? error.message : String(error);
        Alert.alert(
          t('common.error'),
          t('error.language_change_failed', { error: errorMessage }),
          [{ text: t('common.ok') }]
        );
      } finally {
        setIsChanging(false);
      }
    },
    [currentLanguage, changeLanguage, t]
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {/* 説明文 */}
          <Text style={styles.description}>
            {t('settings.language_description')}
          </Text>

          {/* 言語リスト */}
          <View style={styles.languageList}>
            {supportedLanguages.map(({ code, name, nativeName }) => {
              const isSelected = currentLanguage === code;

              return (
                <TouchableOpacity
                  key={code}
                  style={[
                    styles.languageItem,
                    isSelected && styles.languageItemSelected,
                  ]}
                  onPress={() => handleLanguageChange(code)}
                  disabled={isChanging || isSelected}
                  accessibilityLabel={`${nativeName} (${name})`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected, disabled: isChanging }}
                >
                  <View style={styles.languageInfo}>
                    <Text
                      style={[
                        styles.languageName,
                        isSelected && styles.languageNameSelected,
                      ]}
                    >
                      {nativeName}
                    </Text>
                    <Text style={styles.languageCode}>{name}</Text>
                  </View>

                  {isSelected && (
                    <Text style={styles.checkmark} accessibilityLabel="Selected">
                      ✓
                    </Text>
                  )}

                  {isChanging && !isSelected && (
                    <ActivityIndicator size="small" color="#999" />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* 注意事項 */}
          <View style={styles.noteContainer}>
            <Text style={styles.noteTitle}>{t('common.confirm')}:</Text>
            <Text style={styles.noteText}>
              • {t('settings.language_description')}
            </Text>
            <Text style={styles.noteText}>
              • {t('settings.language_change_immediate')}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    lineHeight: 24,
  },
  languageList: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  languageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  languageItemSelected: {
    backgroundColor: '#E3F2FD',
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  languageNameSelected: {
    color: '#1976D2',
  },
  languageCode: {
    fontSize: 14,
    color: '#999',
  },
  checkmark: {
    fontSize: 24,
    color: '#1976D2',
    fontWeight: 'bold',
    marginLeft: 12,
  },
  noteContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#FFF9E6',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  noteText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 4,
  },
});
