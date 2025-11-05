/**
 * NotificationSettingsScreen
 * 通知設定画面
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  NotificationService,
  NotificationPermissionStatus,
  NotificationSettings,
} from '@/services/notification';

export const NotificationSettingsScreen: React.FC = () => {
  const [permissionStatus, setPermissionStatus] =
    useState<NotificationPermissionStatus>(NotificationPermissionStatus.UNDETERMINED);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const notificationService = NotificationService.getInstance();

  useEffect(() => {
    loadSettings();
  }, []);

  /**
   * 設定を読み込む
   */
  const loadSettings = async () => {
    try {
      setIsLoading(true);

      // 許可ステータスを取得
      const status = await notificationService.getPermissionStatus();
      setPermissionStatus(status);

      // 通知設定を取得
      const currentSettings = await notificationService.getSettings();
      setSettings(currentSettings);
    } catch (error) {
      console.error('Failed to load notification settings:', error);
      Alert.alert('エラー', '通知設定の読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 通知許可をリクエスト
   */
  const requestPermission = async () => {
    try {
      const status = await notificationService.requestPermissions();
      setPermissionStatus(status);

      if (status === NotificationPermissionStatus.GRANTED) {
        Alert.alert('許可されました', '通知を受け取ることができます');
      } else if (status === NotificationPermissionStatus.DENIED) {
        Alert.alert(
          '許可が必要です',
          '設定アプリから通知を許可してください',
          [
            { text: 'キャンセル', style: 'cancel' },
            {
              text: '設定を開く',
              onPress: () => {
                // 設定アプリを開く（実装は後で）
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Failed to request permission:', error);
      Alert.alert('エラー', '通知許可のリクエストに失敗しました');
    }
  };

  /**
   * 設定を更新
   */
  const updateSetting = async (
    key: keyof NotificationSettings,
    value: boolean | string
  ) => {
    if (!settings) return;

    try {
      const newSettings = { ...settings, [key]: value };
      await notificationService.updateSettings({ [key]: value });
      setSettings(newSettings);
    } catch (error) {
      console.error('Failed to update setting:', error);
      Alert.alert('エラー', '設定の更新に失敗しました');
    }
  };

  /**
   * リマインダー時間を選択
   */
  const selectReminderTime = () => {
    // 時間選択ダイアログ（簡易実装）
    Alert.alert(
      'リマインダー時間',
      '時間を選択してください',
      [
        { text: '18:00', onPress: () => updateSetting('dailyQuestTime', '1800') },
        { text: '19:00', onPress: () => updateSetting('dailyQuestTime', '1900') },
        { text: '20:00', onPress: () => updateSetting('dailyQuestTime', '2000') },
        { text: '21:00', onPress: () => updateSetting('dailyQuestTime', '2100') },
        { text: '22:00', onPress: () => updateSetting('dailyQuestTime', '2200') },
        { text: 'キャンセル', style: 'cancel' },
      ]
    );
  };

  /**
   * リマインダー時間を表示用にフォーマット
   */
  const formatTime = (time: string | undefined): string => {
    if (!time) return '20:00';
    const hours = time.substring(0, 2);
    const minutes = time.substring(2, 4);
    return `${hours}:${minutes}`;
  };

  if (isLoading || !settings) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>読み込み中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* 通知許可セクション */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>通知許可</Text>
          <View style={styles.permissionCard}>
            <Text style={styles.permissionStatus}>
              ステータス:{' '}
              {permissionStatus === NotificationPermissionStatus.GRANTED
                ? '✅ 許可済み'
                : permissionStatus === NotificationPermissionStatus.DENIED
                ? '❌ 拒否'
                : '⚠️ 未設定'}
            </Text>
            {permissionStatus !== NotificationPermissionStatus.GRANTED && (
              <TouchableOpacity
                style={styles.permissionButton}
                onPress={requestPermission}
              >
                <Text style={styles.permissionButtonText}>通知を許可する</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* マスタースイッチ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>通知設定</Text>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>すべての通知</Text>
              <Text style={styles.settingDescription}>
                全ての通知を一括でオン/オフできます
              </Text>
            </View>
            <Switch
              value={settings.enabled}
              onValueChange={(value) => updateSetting('enabled', value)}
              trackColor={{ false: '#767577', true: '#3C507D' }}
              thumbColor={settings.enabled ? '#E0C58F' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* 通知タイプ別設定 */}
        {settings.enabled && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>通知の種類</Text>

              {/* 日次クエスト通知 */}
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>日次クエスト生成</Text>
                  <Text style={styles.settingDescription}>
                    毎朝4時頃に新しいクエストを通知
                  </Text>
                </View>
                <Switch
                  value={settings.dailyQuestEnabled}
                  onValueChange={(value) => updateSetting('dailyQuestEnabled', value)}
                  trackColor={{ false: '#767577', true: '#3C507D' }}
                  thumbColor={settings.dailyQuestEnabled ? '#E0C58F' : '#f4f3f4'}
                />
              </View>

              {/* マイルストーン達成通知 */}
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>合目達成</Text>
                  <Text style={styles.settingDescription}>
                    合目に到達したときに祝福通知
                  </Text>
                </View>
                <Switch
                  value={settings.milestoneEnabled}
                  onValueChange={(value) => updateSetting('milestoneEnabled', value)}
                  trackColor={{ false: '#767577', true: '#3C507D' }}
                  thumbColor={settings.milestoneEnabled ? '#E0C58F' : '#f4f3f4'}
                />
              </View>

              {/* ランキング通知 */}
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>週次ランキング</Text>
                  <Text style={styles.settingDescription}>
                    毎週月曜日に順位を通知
                  </Text>
                </View>
                <Switch
                  value={settings.rankingEnabled}
                  onValueChange={(value) => updateSetting('rankingEnabled', value)}
                  trackColor={{ false: '#767577', true: '#3C507D' }}
                  thumbColor={settings.rankingEnabled ? '#E0C58F' : '#f4f3f4'}
                />
              </View>

              {/* 停滞アラート通知 */}
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>停滞アラート</Text>
                  <Text style={styles.settingDescription}>
                    30日間進捗がない場合に通知
                  </Text>
                </View>
                <Switch
                  value={settings.stagnationEnabled}
                  onValueChange={(value) => updateSetting('stagnationEnabled', value)}
                  trackColor={{ false: '#767577', true: '#3C507D' }}
                  thumbColor={settings.stagnationEnabled ? '#E0C58F' : '#f4f3f4'}
                />
              </View>

              {/* リマインダー通知 */}
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>リマインダー</Text>
                  <Text style={styles.settingDescription}>
                    クエスト完了のリマインダー
                  </Text>
                </View>
                <Switch
                  value={settings.reminderEnabled}
                  onValueChange={(value) => updateSetting('reminderEnabled', value)}
                  trackColor={{ false: '#767577', true: '#3C507D' }}
                  thumbColor={settings.reminderEnabled ? '#E0C58F' : '#f4f3f4'}
                />
              </View>

              {/* リマインダー時間設定 */}
              {settings.reminderEnabled && (
                <TouchableOpacity
                  style={styles.timeSelector}
                  onPress={selectReminderTime}
                >
                  <Text style={styles.timeSelectorLabel}>リマインダー時間</Text>
                  <Text style={styles.timeSelectorValue}>
                    {formatTime(settings.dailyQuestTime)} →
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* サウンド・バイブレーション設定 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>通知方法</Text>

              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>サウンド</Text>
                  <Text style={styles.settingDescription}>
                    通知時に音を鳴らす
                  </Text>
                </View>
                <Switch
                  value={settings.soundEnabled}
                  onValueChange={(value) => updateSetting('soundEnabled', value)}
                  trackColor={{ false: '#767577', true: '#3C507D' }}
                  thumbColor={settings.soundEnabled ? '#E0C58F' : '#f4f3f4'}
                />
              </View>

              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>バイブレーション</Text>
                  <Text style={styles.settingDescription}>
                    通知時に振動する
                  </Text>
                </View>
                <Switch
                  value={settings.vibrationEnabled}
                  onValueChange={(value) => updateSetting('vibrationEnabled', value)}
                  trackColor={{ false: '#767577', true: '#3C507D' }}
                  thumbColor={settings.vibrationEnabled ? '#E0C58F' : '#f4f3f4'}
                />
              </View>
            </View>
          </>
        )}

        {/* 情報セクション */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>その他</Text>
          <TouchableOpacity style={styles.infoRow}>
            <Text style={styles.infoLabel}>通知履歴</Text>
            <Text style={styles.infoValue}>実装予定 →</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.infoRow}>
            <Text style={styles.infoLabel}>プッシュトークン</Text>
            <Text style={styles.infoValue}>表示 →</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  permissionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  permissionStatus: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  permissionButton: {
    backgroundColor: '#3C507D',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: '#666',
  },
  timeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  timeSelectorLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  timeSelectorValue: {
    fontSize: 16,
    color: '#3C507D',
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 16,
    color: '#333',
  },
  infoValue: {
    fontSize: 14,
    color: '#3C507D',
  },
});
