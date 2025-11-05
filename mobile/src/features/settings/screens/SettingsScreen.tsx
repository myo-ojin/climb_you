/**
 * SettingsScreen
 * 設定画面
 *
 * 機能:
 * - アカウント設定
 * - データ管理（エクスポート・削除）
 * - プライバシー設定
 * - アプリ設定
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList } from '@/navigation/types';
import { usePowerSaving } from '@/hooks';
import { DataExportService } from '@/services/DataExportService';
import { DataDeletionService } from '@/services/DataDeletionService';
import { PrivacySettingsService } from '@/services/PrivacySettingsService';

type Props = NativeStackScreenProps<MainStackParamList, 'Settings'>;

interface SettingItem {
  title: string;
  subtitle?: string;
  onPress?: () => void;
  showChevron?: boolean;
  showSwitch?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
}

interface SettingSection {
  title: string;
  items: SettingItem[];
}

export const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  const { settings, isLowPowerMode, enableLowPowerMode, disableLowPowerMode } =
    usePowerSaving();
  const [analyticsConsent, setAnalyticsConsent] = React.useState(true);

  // プライバシー設定を読み込み
  React.useEffect(() => {
    const loadPrivacySettings = async () => {
      await PrivacySettingsService.initialize();
      const hasConsent = PrivacySettingsService.hasAnalyticsConsent();
      setAnalyticsConsent(hasConsent);
    };

    loadPrivacySettings();
  }, []);

  const handleExportData = () => {
    Alert.alert(
      'データエクスポート',
      'データをエクスポートしますか？',
      [
        {
          text: 'キャンセル',
          style: 'cancel',
        },
        {
          text: 'JSON形式',
          onPress: async () => {
            try {
              await DataExportService.exportAndShare('json');
              Alert.alert('成功', 'データをJSON形式でエクスポートしました');
            } catch (error) {
              console.error('[SettingsScreen] JSON export failed:', error);
              Alert.alert(
                'エラー',
                'データのエクスポートに失敗しました。もう一度お試しください。'
              );
            }
          },
        },
        {
          text: 'CSV形式',
          onPress: async () => {
            try {
              await DataExportService.exportAndShare('csv');
              Alert.alert('成功', 'データをCSV形式でエクスポートしました');
            } catch (error) {
              console.error('[SettingsScreen] CSV export failed:', error);
              Alert.alert(
                'エラー',
                'データのエクスポートに失敗しました。もう一度お試しください。'
              );
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleDeleteData = async () => {
    try {
      // 削除プレビューを取得
      const preview = await DataDeletionService.getDeletionPreview();
      const sizeInKB = (preview.estimatedSize / 1024).toFixed(2);

      // 第一段階の確認
      Alert.alert(
        'データ削除',
        `以下のデータが削除されます：\n\n` +
          `• 目標: ${preview.itemsByType.goals}件\n` +
          `• マイルストーン: ${preview.itemsByType.milestones}件\n` +
          `• クエストログ: ${preview.itemsByType.questLogs}件\n` +
          `• 進捗データ: ${preview.itemsByType.progress}件\n` +
          `• ストリーク: ${preview.itemsByType.streak}件\n\n` +
          `合計: ${preview.totalItems}件（約${sizeInKB}KB）\n\n` +
          `この操作は取り消せません。本当に削除しますか？`,
        [
          {
            text: 'キャンセル',
            style: 'cancel',
          },
          {
            text: '削除する',
            style: 'destructive',
            onPress: () => {
              // 第二段階の確認
              Alert.alert(
                '最終確認',
                'すべてのデータが完全に削除されます。この操作は取り消せません。本当によろしいですか？',
                [
                  {
                    text: 'キャンセル',
                    style: 'cancel',
                  },
                  {
                    text: '完全に削除',
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        const result = await DataDeletionService.deleteAllUserData({
                          clearImageCache: true,
                          clearSettings: false,
                        });

                        if (result.success) {
                          Alert.alert(
                            '削除完了',
                            `${result.deletedItems}件のデータを削除しました。`
                          );
                        } else {
                          Alert.alert(
                            'エラー',
                            `データの削除に失敗しました: ${result.error}`
                          );
                        }
                      } catch (error) {
                        console.error('[SettingsScreen] Data deletion failed:', error);
                        Alert.alert(
                          'エラー',
                          'データの削除中にエラーが発生しました。'
                        );
                      }
                    },
                  },
                ],
                { cancelable: true }
              );
            },
          },
        ],
        { cancelable: true }
      );
    } catch (error) {
      console.error('[SettingsScreen] Failed to get deletion preview:', error);
      Alert.alert('エラー', '削除プレビューの取得に失敗しました。');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'ログアウト',
      'ログアウトしますか？',
      [
        {
          text: 'キャンセル',
          style: 'cancel',
        },
        {
          text: 'ログアウト',
          style: 'destructive',
          onPress: () => {
            // TODO: ログアウト処理
            Alert.alert('実装予定', 'ログアウト機能は実装予定です');
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleToggleLowPowerMode = (value: boolean) => {
    if (value) {
      enableLowPowerMode();
    } else {
      disableLowPowerMode();
    }
  };

  const sections: SettingSection[] = [
    {
      title: 'アカウント',
      items: [
        {
          title: 'ユーザー情報',
          subtitle: '匿名ユーザー',
          onPress: () => {
            Alert.alert('実装予定', 'ユーザー情報表示は実装予定です');
          },
          showChevron: true,
        },
        {
          title: 'ログアウト',
          onPress: handleLogout,
          showChevron: true,
        },
      ],
    },
    {
      title: 'データ管理',
      items: [
        {
          title: 'データエクスポート',
          subtitle: 'JSON/CSV形式でエクスポート',
          onPress: handleExportData,
          showChevron: true,
        },
        {
          title: 'データ削除',
          subtitle: 'すべてのデータを削除',
          onPress: handleDeleteData,
          showChevron: true,
        },
      ],
    },
    {
      title: 'プライバシー',
      items: [
        {
          title: 'プライバシーポリシー',
          onPress: () => {
            navigation.navigate('PrivacyPolicy');
          },
          showChevron: true,
        },
        {
          title: 'データ収集の同意',
          subtitle: 'アプリの改善のためデータ収集に同意します',
          showSwitch: true,
          switchValue: analyticsConsent,
          onSwitchChange: async (value) => {
            try {
              await PrivacySettingsService.setAnalyticsConsent(value);
              setAnalyticsConsent(value);
              Alert.alert(
                value ? '同意しました' : '同意を撤回しました',
                value
                  ? 'データ収集を開始します。アプリの改善にご協力ありがとうございます。'
                  : 'データ収集を停止しました。現在収集されているデータは削除されます。'
              );
            } catch (error) {
              console.error('[SettingsScreen] Failed to update analytics consent:', error);
              Alert.alert('エラー', 'データ収集同意の更新に失敗しました。');
            }
          },
        },
      ],
    },
    {
      title: 'アプリ設定',
      items: [
        {
          title: '通知設定',
          onPress: () => {
            navigation.navigate('NotificationSettings');
          },
          showChevron: true,
        },
        {
          title: '省電力モード',
          subtitle: isLowPowerMode ? '有効' : '無効',
          showSwitch: true,
          switchValue: isLowPowerMode,
          onSwitchChange: handleToggleLowPowerMode,
        },
      ],
    },
    {
      title: 'その他',
      items: [
        {
          title: 'アプリバージョン',
          subtitle: '1.0.0',
        },
        {
          title: 'ヘルプ・サポート',
          onPress: () => {
            Alert.alert('実装予定', 'ヘルプ・サポートは実装予定です');
          },
          showChevron: true,
        },
      ],
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      accessible={true}
      accessibilityLabel="設定画面"
      accessibilityHint="スクロールして設定項目を表示できます"
    >
      {sections.map((section, sectionIndex) => (
        <View key={sectionIndex} style={styles.section}>
          <Text
            style={styles.sectionTitle}
            accessible={true}
            accessibilityLabel={section.title}
            accessibilityRole="header"
          >
            {section.title}
          </Text>
          <View style={styles.sectionContent}>
            {section.items.map((item, itemIndex) => (
              <SettingItemComponent
                key={itemIndex}
                item={item}
                isLast={itemIndex === section.items.length - 1}
              />
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

/**
 * Setting Item Component
 */
interface SettingItemComponentProps {
  item: SettingItem;
  isLast: boolean;
}

const SettingItemComponent: React.FC<SettingItemComponentProps> = ({ item, isLast }) => {
  const accessibilityLabel = item.subtitle
    ? `${item.title}、${item.subtitle}`
    : item.title;

  const content = (
    <View style={[styles.item, !isLast && styles.itemBorder]}>
      <View style={styles.itemLeft}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        {item.subtitle && <Text style={styles.itemSubtitle}>{item.subtitle}</Text>}
      </View>
      {item.showSwitch && (
        <Switch
          value={item.switchValue}
          onValueChange={item.onSwitchChange}
          accessible={true}
          accessibilityLabel={`${item.title}、${item.switchValue ? 'オン' : 'オフ'}`}
          accessibilityHint="タップして切り替えます"
          accessibilityRole="switch"
        />
      )}
      {item.showChevron && <Text style={styles.chevron}>›</Text>}
    </View>
  );

  if (item.onPress && !item.showSwitch) {
    return (
      <TouchableOpacity
        onPress={item.onPress}
        activeOpacity={0.7}
        accessible={true}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint="タップして詳細を表示します"
        accessibilityRole="button"
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionContent: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E0E0E0',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 48,
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  itemLeft: {
    flex: 1,
    marginRight: 12,
  },
  itemTitle: {
    fontSize: 16,
    color: '#333',
    marginBottom: 2,
  },
  itemSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  chevron: {
    fontSize: 24,
    color: '#999',
    marginLeft: 8,
  },
});
