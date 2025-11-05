/**
 * PrivacySettingsService Test
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { PrivacySettingsService } from '../PrivacySettingsService';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

describe('PrivacySettingsService', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    PrivacySettingsService.cleanup();
  });

  describe('initialize', () => {
    it('初期化できる', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await PrivacySettingsService.initialize();

      const settings = PrivacySettingsService.getSettings();
      expect(settings.analyticsConsent).toBe(true);
      expect(settings.crashReportConsent).toBe(true);
      expect(settings.usageStatsConsent).toBe(true);
    });

    it('保存済みの設定を読み込める', async () => {
      const savedSettings = {
        analyticsConsent: false,
        crashReportConsent: true,
        usageStatsConsent: false,
        lastUpdated: '2025-01-15T00:00:00.000Z',
        consentVersion: '1.0.0',
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(savedSettings));

      await PrivacySettingsService.initialize();

      const settings = PrivacySettingsService.getSettings();
      expect(settings.analyticsConsent).toBe(false);
      expect(settings.crashReportConsent).toBe(true);
      expect(settings.usageStatsConsent).toBe(false);
    });

    it('既に初期化済みの場合はスキップする', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await PrivacySettingsService.initialize();
      await PrivacySettingsService.initialize(); // 2回目

      expect(AsyncStorage.getItem).toHaveBeenCalledTimes(1); // 1回のみ
    });
  });

  describe('getSettings', () => {
    it('設定を取得できる', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await PrivacySettingsService.initialize();
      const settings = PrivacySettingsService.getSettings();

      expect(settings).toHaveProperty('analyticsConsent');
      expect(settings).toHaveProperty('crashReportConsent');
      expect(settings).toHaveProperty('usageStatsConsent');
      expect(settings).toHaveProperty('lastUpdated');
      expect(settings).toHaveProperty('consentVersion');
    });
  });

  describe('hasAnalyticsConsent', () => {
    it('分析データ収集の同意状態を取得できる', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await PrivacySettingsService.initialize();

      expect(PrivacySettingsService.hasAnalyticsConsent()).toBe(true);
    });
  });

  describe('setAnalyticsConsent', () => {
    it('分析データ収集の同意を設定できる', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await PrivacySettingsService.initialize();
      await PrivacySettingsService.setAnalyticsConsent(false);

      expect(PrivacySettingsService.hasAnalyticsConsent()).toBe(false);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'privacy_settings',
        expect.stringContaining('"analyticsConsent":false')
      );
    });
  });

  describe('setCrashReportConsent', () => {
    it('クラッシュレポート送信の同意を設定できる', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await PrivacySettingsService.initialize();
      await PrivacySettingsService.setCrashReportConsent(false);

      expect(PrivacySettingsService.hasCrashReportConsent()).toBe(false);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'privacy_settings',
        expect.stringContaining('"crashReportConsent":false')
      );
    });
  });

  describe('setUsageStatsConsent', () => {
    it('使用統計収集の同意を設定できる', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await PrivacySettingsService.initialize();
      await PrivacySettingsService.setUsageStatsConsent(false);

      expect(PrivacySettingsService.hasUsageStatsConsent()).toBe(false);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'privacy_settings',
        expect.stringContaining('"usageStatsConsent":false')
      );
    });
  });

  describe('setAllConsents', () => {
    it('すべての同意を一括設定できる', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await PrivacySettingsService.initialize();
      await PrivacySettingsService.setAllConsents(false, false, false);

      expect(PrivacySettingsService.hasAnalyticsConsent()).toBe(false);
      expect(PrivacySettingsService.hasCrashReportConsent()).toBe(false);
      expect(PrivacySettingsService.hasUsageStatsConsent()).toBe(false);
    });
  });

  describe('getPrivacyPolicy', () => {
    it('プライバシーポリシーを取得できる', () => {
      const policy = PrivacySettingsService.getPrivacyPolicy();

      expect(policy).toHaveProperty('version');
      expect(policy).toHaveProperty('lastUpdated');
      expect(policy).toHaveProperty('url');
      expect(policy).toHaveProperty('content');
      expect(policy.content).toContain('プライバシーポリシー');
    });
  });

  describe('resetSettings', () => {
    it('設定をリセットできる', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await PrivacySettingsService.initialize();
      await PrivacySettingsService.setAnalyticsConsent(false);
      await PrivacySettingsService.resetSettings();

      const settings = PrivacySettingsService.getSettings();
      expect(settings.analyticsConsent).toBe(true);
      expect(settings.crashReportConsent).toBe(true);
      expect(settings.usageStatsConsent).toBe(true);
    });
  });

  describe('cleanup', () => {
    it('クリーンアップできる', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      await PrivacySettingsService.initialize();
      PrivacySettingsService.cleanup();

      // cleanup後は初期化が必要
      await PrivacySettingsService.initialize();
      expect(AsyncStorage.getItem).toHaveBeenCalled();
    });
  });
});
