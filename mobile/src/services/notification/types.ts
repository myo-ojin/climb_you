/**
 * Notification Service Types
 * 通知サービスの型定義
 */

/**
 * 通知タイプ
 */
export enum NotificationType {
  /**
   * 日次クエスト生成完了通知
   */
  DAILY_QUEST_GENERATED = 'daily_quest_generated',

  /**
   * 合目達成祝福
   */
  MILESTONE_ACHIEVED = 'milestone_achieved',

  /**
   * 週次ランキング結果
   */
  WEEKLY_RANKING = 'weekly_ranking',

  /**
   * 停滞アラート（30日間同じ合目）
   */
  STAGNATION_ALERT = 'stagnation_alert',

  /**
   * リマインダー（カスタム）
   */
  REMINDER = 'reminder',
}

/**
 * 通知の優先度
 */
export enum NotificationPriority {
  /**
   * デフォルト
   */
  DEFAULT = 'default',

  /**
   * 低
   */
  LOW = 'low',

  /**
   * 高
   */
  HIGH = 'high',

  /**
   * 最大（音やバイブレーションが発生）
   */
  MAX = 'max',
}

/**
 * 通知データ
 */
export interface NotificationData {
  /**
   * 通知タイプ
   */
  type: NotificationType;

  /**
   * 通知ID
   */
  notificationId: string;

  /**
   * タイトル
   */
  title: string;

  /**
   * 本文
   */
  body: string;

  /**
   * サブタイトル（iOS）
   */
  subtitle?: string;

  /**
   * 画像URL（Rich Notifications）
   */
  imageUrl?: string;

  /**
   * カスタムデータ
   */
  data?: Record<string, any>;

  /**
   * 優先度
   */
  priority?: NotificationPriority;

  /**
   * バッジ数
   */
  badge?: number;

  /**
   * サウンド
   */
  sound?: boolean | string;

  /**
   * バイブレーション
   */
  vibrate?: boolean;

  /**
   * カテゴリー（Actionable Notifications）
   */
  categoryIdentifier?: string;
}

/**
 * スケジュール通知データ
 */
export interface ScheduledNotificationData extends NotificationData {
  /**
   * トリガー日時（Unix timestamp）
   */
  trigger: number | Date;

  /**
   * 繰り返し設定
   */
  repeat?: {
    /**
     * 繰り返し間隔（秒）
     */
    seconds?: number;

    /**
     * 繰り返し間隔（分）
     */
    minutes?: number;

    /**
     * 繰り返し間隔（時間）
     */
    hours?: number;

    /**
     * 繰り返し間隔（日）
     */
    days?: number;

    /**
     * 曜日指定（0=日曜, 6=土曜）
     */
    weekday?: number;
  };
}

/**
 * 通知許可ステータス
 */
export enum NotificationPermissionStatus {
  /**
   * 許可
   */
  GRANTED = 'granted',

  /**
   * 拒否
   */
  DENIED = 'denied',

  /**
   * 未決定
   */
  UNDETERMINED = 'undetermined',
}

/**
 * 通知設定
 */
export interface NotificationSettings {
  /**
   * 通知の有効/無効
   */
  enabled: boolean;

  /**
   * 日次クエスト通知
   */
  dailyQuestEnabled: boolean;

  /**
   * 日次クエスト通知時刻（HHMM形式）
   */
  dailyQuestTime?: string;

  /**
   * 合目達成通知
   */
  milestoneEnabled: boolean;

  /**
   * ランキング通知
   */
  rankingEnabled: boolean;

  /**
   * 停滞アラート通知
   */
  stagnationEnabled: boolean;

  /**
   * リマインダー通知
   */
  reminderEnabled: boolean;

  /**
   * サウンドの有効/無効
   */
  soundEnabled: boolean;

  /**
   * バイブレーションの有効/無効
   */
  vibrationEnabled: boolean;
}

/**
 * プッシュトークン
 */
export interface PushToken {
  /**
   * Expoプッシュトークン
   */
  expoPushToken?: string;

  /**
   * FCMトークン（Android）
   */
  fcmToken?: string;

  /**
   * APNsトークン（iOS）
   */
  apnsToken?: string;

  /**
   * デバイスID
   */
  deviceId: string;

  /**
   * プラットフォーム
   */
  platform: 'ios' | 'android' | 'web';

  /**
   * 取得日時
   */
  obtainedAt: Date;
}

/**
 * 通知応答データ
 */
export interface NotificationResponse {
  /**
   * 通知データ
   */
  notification: NotificationData;

  /**
   * アクションID（Actionable Notifications）
   */
  actionIdentifier?: string;

  /**
   * ユーザー入力テキスト
   */
  userText?: string;
}

/**
 * 通知アクション
 */
export interface NotificationAction {
  /**
   * アクション識別子
   */
  identifier: string;

  /**
   * ボタンタイトル
   */
  buttonTitle: string;

  /**
   * オプション
   */
  options?: {
    /**
     * 破壊的アクション（赤色で表示）
     */
    isDestructive?: boolean;

    /**
     * 認証が必要
     */
    isAuthenticationRequired?: boolean;

    /**
     * アプリをフォアグラウンドで開く
     */
    opensAppToForeground?: boolean;
  };
}

/**
 * 通知カテゴリ
 */
export interface NotificationCategory {
  /**
   * カテゴリ識別子
   */
  identifier: string;

  /**
   * アクション配列
   */
  actions: NotificationAction[];

  /**
   * オプション
   */
  options?: {
    /**
     * プレビューテキスト（iOS）
     */
    previewPlaceholder?: string;

    /**
     * インテント識別子（iOS）
     */
    intentIdentifiers?: string[];

    /**
     * カテゴリサマリーフォーマット（iOS）
     */
    categorySummaryFormat?: string;
  };
}

/**
 * 通知カテゴリ識別子
 */
export enum NotificationCategoryIdentifier {
  /**
   * クエストリマインダー
   */
  QUEST_REMINDER = 'quest_reminder',

  /**
   * クエスト完了
   */
  QUEST_COMPLETE = 'quest_complete',

  /**
   * マイルストーン達成
   */
  MILESTONE_ACHIEVED = 'milestone_achieved',

  /**
   * ランキング更新
   */
  RANKING_UPDATE = 'ranking_update',

  /**
   * 停滞アラート
   */
  STAGNATION_ALERT = 'stagnation_alert',
}

/**
 * 通知アクション識別子
 */
export enum NotificationActionIdentifier {
  /**
   * 完了をマーク
   */
  MARK_COMPLETE = 'mark_complete',

  /**
   * スヌーズ（後で通知）
   */
  SNOOZE = 'snooze',

  /**
   * クエストを表示
   */
  VIEW_QUEST = 'view_quest',

  /**
   * 進捗を表示
   */
  VIEW_PROGRESS = 'view_progress',

  /**
   * 目標を調整
   */
  ADJUST_GOAL = 'adjust_goal',

  /**
   * 閉じる
   */
  DISMISS = 'dismiss',
}
