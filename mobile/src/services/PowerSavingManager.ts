/**
 * PowerSavingManager Service
 * 省電力設定を管理し、低電力モード時の動作を最適化
 *
 * 機能:
 * - アニメーションの有効/無効
 * - バックグラウンド同期の制御
 * - ネットワークリクエストの最適化
 * - 画像品質の調整
 * - 自動リフレッシュの制御
 */

import { BatteryMonitor } from './BatteryMonitor';

export interface PowerSavingSettings {
  /**
   * アニメーションを有効にするか
   */
  enableAnimations: boolean;

  /**
   * バックグラウンド同期を有効にするか
   */
  enableBackgroundSync: boolean;

  /**
   * 自動リフレッシュを有効にするか
   */
  enableAutoRefresh: boolean;

  /**
   * 高品質画像を使用するか
   */
  useHighQualityImages: boolean;

  /**
   * プリフェッチを有効にするか
   */
  enablePrefetch: boolean;

  /**
   * 同期間隔（ミリ秒）
   */
  syncInterval: number;
}

export interface PowerSavingConfig {
  /**
   * 通常時の設定
   */
  normalMode?: Partial<PowerSavingSettings>;

  /**
   * 低電力モード時の設定
   */
  lowPowerMode?: Partial<PowerSavingSettings>;

  /**
   * 自動的に低電力モードに切り替えるか
   */
  autoSwitch?: boolean;
}

const DEFAULT_NORMAL_MODE: PowerSavingSettings = {
  enableAnimations: true,
  enableBackgroundSync: true,
  enableAutoRefresh: true,
  useHighQualityImages: true,
  enablePrefetch: true,
  syncInterval: 5 * 60 * 1000, // 5分
};

const DEFAULT_LOW_POWER_MODE: PowerSavingSettings = {
  enableAnimations: false,
  enableBackgroundSync: false,
  enableAutoRefresh: false,
  useHighQualityImages: false,
  enablePrefetch: false,
  syncInterval: 15 * 60 * 1000, // 15分
};

type SettingsChangeListener = (settings: PowerSavingSettings) => void;

class PowerSavingManagerService {
  private normalModeSettings: PowerSavingSettings;
  private lowPowerModeSettings: PowerSavingSettings;
  private currentSettings: PowerSavingSettings;
  private isLowPowerMode: boolean = false;
  private autoSwitch: boolean = true;
  private listeners: Set<SettingsChangeListener> = new Set();
  private initialized: boolean = false;
  private cleanupBatteryListener: (() => void) | null = null;

  constructor(config: PowerSavingConfig = {}) {
    this.normalModeSettings = {
      ...DEFAULT_NORMAL_MODE,
      ...config.normalMode,
    };

    this.lowPowerModeSettings = {
      ...DEFAULT_LOW_POWER_MODE,
      ...config.lowPowerMode,
    };

    this.autoSwitch = config.autoSwitch ?? true;
    this.currentSettings = this.normalModeSettings;
  }

  /**
   * 初期化
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('[PowerSavingManager] Already initialized');
      return;
    }

    try {
      // BatteryMonitorを初期化
      await BatteryMonitor.initialize();

      // 初期状態を設定
      const batteryState = BatteryMonitor.getBatteryState();
      if (batteryState?.isLowPowerMode) {
        this.enableLowPowerMode();
      }

      // バッテリー状態変化のリスナーを登録
      if (this.autoSwitch) {
        this.cleanupBatteryListener = BatteryMonitor.addLowPowerModeListener((enabled) => {
          if (enabled) {
            this.enableLowPowerMode();
          } else {
            this.disableLowPowerMode();
          }
        });
      }

      this.initialized = true;
      console.log('[PowerSavingManager] Initialized');
    } catch (error) {
      console.error('[PowerSavingManager] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * クリーンアップ
   */
  cleanup(): void {
    if (this.cleanupBatteryListener) {
      this.cleanupBatteryListener();
      this.cleanupBatteryListener = null;
    }

    this.listeners.clear();
    this.initialized = false;

    // 設定を初期状態に戻す
    this.isLowPowerMode = false;
    this.normalModeSettings = { ...DEFAULT_NORMAL_MODE };
    this.lowPowerModeSettings = { ...DEFAULT_LOW_POWER_MODE };
    this.currentSettings = this.normalModeSettings;

    console.log('[PowerSavingManager] Cleaned up');
  }

  /**
   * 現在の設定を取得
   */
  getSettings(): PowerSavingSettings {
    return { ...this.currentSettings };
  }

  /**
   * 低電力モードかどうか
   */
  isInLowPowerMode(): boolean {
    return this.isLowPowerMode;
  }

  /**
   * 低電力モードを有効化
   */
  enableLowPowerMode(): void {
    if (this.isLowPowerMode) {
      return;
    }

    console.log('[PowerSavingManager] Enabling low power mode...');
    this.isLowPowerMode = true;
    this.currentSettings = this.lowPowerModeSettings;
    this.notifyListeners();
  }

  /**
   * 低電力モードを無効化
   */
  disableLowPowerMode(): void {
    if (!this.isLowPowerMode) {
      return;
    }

    console.log('[PowerSavingManager] Disabling low power mode...');
    this.isLowPowerMode = false;
    this.currentSettings = this.normalModeSettings;
    this.notifyListeners();
  }

  /**
   * 設定を手動で更新
   */
  updateSettings(settings: Partial<PowerSavingSettings>): void {
    this.currentSettings = {
      ...this.currentSettings,
      ...settings,
    };

    this.notifyListeners();
    console.log('[PowerSavingManager] Settings updated');
  }

  /**
   * 通常モードの設定を更新
   */
  updateNormalModeSettings(settings: Partial<PowerSavingSettings>): void {
    this.normalModeSettings = {
      ...this.normalModeSettings,
      ...settings,
    };

    if (!this.isLowPowerMode) {
      this.currentSettings = this.normalModeSettings;
      this.notifyListeners();
    }
  }

  /**
   * 低電力モードの設定を更新
   */
  updateLowPowerModeSettings(settings: Partial<PowerSavingSettings>): void {
    this.lowPowerModeSettings = {
      ...this.lowPowerModeSettings,
      ...settings,
    };

    if (this.isLowPowerMode) {
      this.currentSettings = this.lowPowerModeSettings;
      this.notifyListeners();
    }
  }

  /**
   * 設定変更のリスナーを登録
   */
  addListener(listener: SettingsChangeListener): () => void {
    this.listeners.add(listener);

    // 初回の通知
    listener(this.currentSettings);

    // クリーンアップ関数を返す
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * 自動切り替えを有効化/無効化
   */
  setAutoSwitch(enabled: boolean): void {
    if (this.autoSwitch === enabled) {
      return;
    }

    this.autoSwitch = enabled;

    if (enabled && !this.cleanupBatteryListener) {
      // リスナーを登録
      this.cleanupBatteryListener = BatteryMonitor.addLowPowerModeListener((lowPowerEnabled) => {
        if (lowPowerEnabled) {
          this.enableLowPowerMode();
        } else {
          this.disableLowPowerMode();
        }
      });
    } else if (!enabled && this.cleanupBatteryListener) {
      // リスナーを解除
      this.cleanupBatteryListener();
      this.cleanupBatteryListener = null;
    }

    console.log(`[PowerSavingManager] Auto switch ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * リスナーに通知
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      try {
        listener(this.currentSettings);
      } catch (error) {
        console.error('[PowerSavingManager] Listener error:', error);
      }
    });
  }
}

// シングルトンインスタンス
export const PowerSavingManager = new PowerSavingManagerService();
