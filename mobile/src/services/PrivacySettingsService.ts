/**
 * PrivacySettingsService
 * プライバシー設定の管理
 *
 * 機能:
 * - データ収集同意の管理
 * - 匿名分析データの送信制御
 * - クラッシュレポートの送信制御
 * - プライバシー設定の永続化
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const PRIVACY_SETTINGS_KEY = 'privacy_settings';

export interface PrivacySettings {
  /**
   * データ収集に同意しているか
   */
  analyticsConsent: boolean;

  /**
   * クラッシュレポート送信に同意しているか
   */
  crashReportConsent: boolean;

  /**
   * 匿名使用統計の収集に同意しているか
   */
  usageStatsConsent: boolean;

  /**
   * 最終更新日時
   */
  lastUpdated: string;

  /**
   * 同意のバージョン（プライバシーポリシーのバージョン）
   */
  consentVersion: string;
}

export interface PrivacyPolicy {
  /**
   * プライバシーポリシーのバージョン
   */
  version: string;

  /**
   * 最終更新日
   */
  lastUpdated: string;

  /**
   * プライバシーポリシーURL
   */
  url?: string;

  /**
   * プライバシーポリシー本文（Markdown）
   */
  content?: string;
}

const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  analyticsConsent: true,
  crashReportConsent: true,
  usageStatsConsent: true,
  lastUpdated: new Date().toISOString(),
  consentVersion: '1.0.0',
};

const PRIVACY_POLICY: PrivacyPolicy = {
  version: '1.0.0',
  lastUpdated: '2025-01-15',
  url: 'https://climb-you.app/privacy',
  content: `# プライバシーポリシー

climb-you（以下「本アプリ」）は、ユーザーのプライバシーを尊重し、個人情報の保護に努めます。

## 1. 収集する情報

本アプリは、以下の情報を収集する場合があります：

### 1.1 ユーザーが提供する情報
- 目標設定に関する情報（目標タイトル、説明、期限等）
- クエスト完了記録（完了日時、証跡、コメント等）
- プロフィール情報（ニックネーム、アバター等）※任意

### 1.2 自動的に収集される情報
- 使用統計（アプリの起動回数、滞在時間、画面遷移等）
- デバイス情報（OS種類・バージョン、デバイスモデル、言語設定等）
- クラッシュレポート（エラーログ、スタックトレース等）

## 2. 情報の利用目的

収集した情報は、以下の目的で利用します：

- アプリの機能提供（目標管理、進捗追跡、ランキング表示等）
- サービスの改善（バグ修正、パフォーマンス向上、新機能開発等）
- 統計分析（匿名化された利用傾向の分析）
- サポート対応（問い合わせへの回答、トラブルシューティング）

## 3. 情報の共有

本アプリは、以下の場合を除き、ユーザーの個人情報を第三者に提供しません：

- ユーザーの同意がある場合
- 法令に基づく開示が必要な場合
- サービス提供に必要な範囲で業務委託先に提供する場合（守秘義務契約締結）

### 3.1 利用している第三者サービス
- **Firebase Analytics**: 匿名化された使用統計の収集
- **Firebase Crashlytics**: クラッシュレポートの収集
- **Sentry**: エラートラッキング（オプション）

## 4. データの保存期間

- **目標・クエストデータ**: ユーザーが削除するまで保存
- **使用統計データ**: 収集から180日間
- **クラッシュレポート**: 収集から90日間

## 5. ユーザーの権利

ユーザーは、以下の権利を有します：

- **アクセス権**: 自分のデータを閲覧する権利
- **訂正権**: 不正確なデータを訂正する権利
- **削除権**: 自分のデータを削除する権利（アプリ内の「データ削除」機能から実行）
- **エクスポート権**: 自分のデータをJSON/CSV形式でエクスポートする権利
- **同意撤回権**: データ収集の同意を撤回する権利

## 6. セキュリティ

本アプリは、ユーザーの情報を保護するため、以下の対策を実施しています：

- データの暗号化（通信時: TLS 1.3、保存時: AES-256）
- 認証トークンのSecure Storage保存
- 定期的なセキュリティ監査

## 7. 子供のプライバシー

本アプリは、13歳未満の子供を対象としていません。13歳未満の子供の個人情報を故意に収集することはありません。

## 8. プライバシーポリシーの変更

本プライバシーポリシーは、必要に応じて変更される場合があります。重要な変更がある場合は、アプリ内通知でお知らせします。

## 9. お問い合わせ

プライバシーに関するご質問は、以下までお問い合わせください：
- メール: privacy@climb-you.app
- Webサイト: https://climb-you.app/contact

**最終更新日**: 2025年1月15日
**バージョン**: 1.0.0
`,
};

class PrivacySettingsServiceClass {
  private settings: PrivacySettings | null = null;
  private initialized: boolean = false;

  /**
   * 初期化
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('[PrivacySettingsService] Already initialized');
      return;
    }

    try {
      await this.loadSettings();
      this.initialized = true;
      console.log('[PrivacySettingsService] Initialized');
    } catch (error) {
      console.error('[PrivacySettingsService] Failed to initialize:', error);
      // 初期化に失敗してもデフォルト設定で続行
      this.settings = { ...DEFAULT_PRIVACY_SETTINGS };
      this.initialized = true;
    }
  }

  /**
   * 設定を読み込み
   */
  private async loadSettings(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(PRIVACY_SETTINGS_KEY);
      if (stored) {
        this.settings = JSON.parse(stored);
        console.log('[PrivacySettingsService] Settings loaded');
      } else {
        this.settings = { ...DEFAULT_PRIVACY_SETTINGS };
        await this.saveSettings();
        console.log('[PrivacySettingsService] Default settings applied');
      }
    } catch (error) {
      console.error('[PrivacySettingsService] Failed to load settings:', error);
      this.settings = { ...DEFAULT_PRIVACY_SETTINGS };
    }
  }

  /**
   * 設定を保存
   */
  private async saveSettings(): Promise<void> {
    if (!this.settings) {
      return;
    }

    try {
      await AsyncStorage.setItem(PRIVACY_SETTINGS_KEY, JSON.stringify(this.settings));
      console.log('[PrivacySettingsService] Settings saved');
    } catch (error) {
      console.error('[PrivacySettingsService] Failed to save settings:', error);
      throw error;
    }
  }

  /**
   * 現在の設定を取得
   */
  getSettings(): PrivacySettings {
    if (!this.settings) {
      return { ...DEFAULT_PRIVACY_SETTINGS };
    }
    return { ...this.settings };
  }

  /**
   * 分析データ収集の同意状態を取得
   */
  hasAnalyticsConsent(): boolean {
    return this.settings?.analyticsConsent ?? true;
  }

  /**
   * クラッシュレポート送信の同意状態を取得
   */
  hasCrashReportConsent(): boolean {
    return this.settings?.crashReportConsent ?? true;
  }

  /**
   * 使用統計収集の同意状態を取得
   */
  hasUsageStatsConsent(): boolean {
    return this.settings?.usageStatsConsent ?? true;
  }

  /**
   * 分析データ収集の同意を設定
   */
  async setAnalyticsConsent(consent: boolean): Promise<void> {
    if (!this.settings) {
      await this.initialize();
    }

    if (this.settings) {
      this.settings.analyticsConsent = consent;
      this.settings.lastUpdated = new Date().toISOString();
      await this.saveSettings();
      console.log(`[PrivacySettingsService] Analytics consent: ${consent}`);
    }
  }

  /**
   * クラッシュレポート送信の同意を設定
   */
  async setCrashReportConsent(consent: boolean): Promise<void> {
    if (!this.settings) {
      await this.initialize();
    }

    if (this.settings) {
      this.settings.crashReportConsent = consent;
      this.settings.lastUpdated = new Date().toISOString();
      await this.saveSettings();
      console.log(`[PrivacySettingsService] Crash report consent: ${consent}`);
    }
  }

  /**
   * 使用統計収集の同意を設定
   */
  async setUsageStatsConsent(consent: boolean): Promise<void> {
    if (!this.settings) {
      await this.initialize();
    }

    if (this.settings) {
      this.settings.usageStatsConsent = consent;
      this.settings.lastUpdated = new Date().toISOString();
      await this.saveSettings();
      console.log(`[PrivacySettingsService] Usage stats consent: ${consent}`);
    }
  }

  /**
   * すべての同意を設定（一括更新）
   */
  async setAllConsents(
    analytics: boolean,
    crashReport: boolean,
    usageStats: boolean
  ): Promise<void> {
    if (!this.settings) {
      await this.initialize();
    }

    if (this.settings) {
      this.settings.analyticsConsent = analytics;
      this.settings.crashReportConsent = crashReport;
      this.settings.usageStatsConsent = usageStats;
      this.settings.lastUpdated = new Date().toISOString();
      await this.saveSettings();
      console.log(
        `[PrivacySettingsService] All consents updated: analytics=${analytics}, crashReport=${crashReport}, usageStats=${usageStats}`
      );
    }
  }

  /**
   * プライバシーポリシーを取得
   */
  getPrivacyPolicy(): PrivacyPolicy {
    return { ...PRIVACY_POLICY };
  }

  /**
   * 設定をリセット（デフォルトに戻す）
   */
  async resetSettings(): Promise<void> {
    this.settings = { ...DEFAULT_PRIVACY_SETTINGS };
    await this.saveSettings();
    console.log('[PrivacySettingsService] Settings reset to default');
  }

  /**
   * クリーンアップ
   */
  cleanup(): void {
    this.settings = null;
    this.initialized = false;
    console.log('[PrivacySettingsService] Cleaned up');
  }
}

// シングルトンインスタンス
export const PrivacySettingsService = new PrivacySettingsServiceClass();
