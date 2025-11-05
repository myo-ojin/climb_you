/**
 * BatteryMonitor Service
 * バッテリー状態を監視し、低電力モードを管理
 *
 * 機能:
 * - バッテリーレベルの監視
 * - 充電状態の監視
 * - 低電力モードの検出
 * - バッテリー状態変化のコールバック
 * - 省電力設定の自動適用
 */

import * as Battery from 'expo-battery';
import { Platform } from 'react-native';

export interface BatteryState {
  /**
   * バッテリーレベル（0-1）
   */
  level: number;

  /**
   * バッテリーレベル（パーセント）
   */
  levelPercent: number;

  /**
   * 充電状態
   */
  batteryState: Battery.BatteryState;

  /**
   * 充電中かどうか
   */
  isCharging: boolean;

  /**
   * 低電力モードかどうか
   */
  isLowPowerMode: boolean;
}

export interface BatteryMonitorConfig {
  /**
   * 低電力モードと判定するバッテリーレベル（デフォルト: 20%）
   */
  lowPowerThreshold?: number;

  /**
   * バッテリー状態更新の間隔（ミリ秒、デフォルト: 60000 = 1分）
   */
  updateInterval?: number;
}

type BatteryStateListener = (state: BatteryState) => void;
type LowPowerModeListener = (enabled: boolean) => void;

const DEFAULT_CONFIG: Required<BatteryMonitorConfig> = {
  lowPowerThreshold: 20,
  updateInterval: 60000, // 1分
};

class BatteryMonitorService {
  private config: Required<BatteryMonitorConfig>;
  private batteryState: BatteryState | null = null;
  private listeners: Set<BatteryStateListener> = new Set();
  private lowPowerModeListeners: Set<LowPowerModeListener> = new Set();
  private initialized: boolean = false;
  private updateTimer: NodeJS.Timeout | null = null;

  constructor(config: BatteryMonitorConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 初期化
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('[BatteryMonitor] Already initialized');
      return;
    }

    try {
      // 初回のバッテリー状態を取得
      await this.updateBatteryState();

      // 定期的に更新
      this.startPeriodicUpdate();

      // バッテリー状態変化のリスナーを登録
      this.registerNativeListeners();

      this.initialized = true;
      console.log('[BatteryMonitor] Initialized');
    } catch (error) {
      console.error('[BatteryMonitor] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * クリーンアップ
   */
  cleanup(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }

    this.listeners.clear();
    this.lowPowerModeListeners.clear();
    this.batteryState = null;
    this.initialized = false;

    console.log('[BatteryMonitor] Cleaned up');
  }

  /**
   * 現在のバッテリー状態を取得
   */
  getBatteryState(): BatteryState | null {
    return this.batteryState;
  }

  /**
   * 低電力モードかどうか
   */
  isLowPowerMode(): boolean {
    return this.batteryState?.isLowPowerMode ?? false;
  }

  /**
   * バッテリー状態変化のリスナーを登録
   */
  addListener(listener: BatteryStateListener): () => void {
    this.listeners.add(listener);

    // クリーンアップ関数を返す
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * 低電力モード変化のリスナーを登録
   */
  addLowPowerModeListener(listener: LowPowerModeListener): () => void {
    this.lowPowerModeListeners.add(listener);

    // クリーンアップ関数を返す
    return () => {
      this.lowPowerModeListeners.delete(listener);
    };
  }

  /**
   * バッテリー状態を更新
   */
  private async updateBatteryState(): Promise<void> {
    try {
      const [level, batteryState] = await Promise.all([
        Battery.getBatteryLevelAsync(),
        Battery.getBatteryStateAsync(),
      ]);

      const levelPercent = Math.round(level * 100);
      const isCharging =
        batteryState === Battery.BatteryState.CHARGING ||
        batteryState === Battery.BatteryState.FULL;

      // 低電力モード判定（充電中でない かつ バッテリーレベルが閾値以下）
      const isLowPowerMode = !isCharging && levelPercent <= this.config.lowPowerThreshold;

      const newState: BatteryState = {
        level,
        levelPercent,
        batteryState,
        isCharging,
        isLowPowerMode,
      };

      // 低電力モード状態が変化したかチェック
      const previousLowPowerMode = this.batteryState?.isLowPowerMode ?? false;
      const lowPowerModeChanged = previousLowPowerMode !== isLowPowerMode;

      this.batteryState = newState;

      // リスナーに通知
      this.notifyListeners(newState);

      // 低電力モード変化をリスナーに通知
      if (lowPowerModeChanged) {
        this.notifyLowPowerModeListeners(isLowPowerMode);
        console.log(`[BatteryMonitor] Low power mode ${isLowPowerMode ? 'enabled' : 'disabled'}`);
      }

      console.log(
        `[BatteryMonitor] Battery: ${levelPercent}%, ${isCharging ? 'Charging' : 'Not charging'}, Low power: ${isLowPowerMode}`
      );
    } catch (error) {
      console.error('[BatteryMonitor] Failed to update battery state:', error);
    }
  }

  /**
   * 定期的な更新を開始
   */
  private startPeriodicUpdate(): void {
    if (this.updateTimer) {
      return;
    }

    this.updateTimer = setInterval(() => {
      this.updateBatteryState();
    }, this.config.updateInterval);
  }

  /**
   * ネイティブリスナーを登録
   */
  private registerNativeListeners(): void {
    // バッテリーレベル変化
    Battery.addBatteryLevelListener(() => {
      this.updateBatteryState();
    });

    // バッテリー状態変化（充電開始・停止など）
    Battery.addBatteryStateListener(() => {
      this.updateBatteryState();
    });
  }

  /**
   * リスナーに通知
   */
  private notifyListeners(state: BatteryState): void {
    this.listeners.forEach((listener) => {
      try {
        listener(state);
      } catch (error) {
        console.error('[BatteryMonitor] Listener error:', error);
      }
    });
  }

  /**
   * 低電力モードリスナーに通知
   */
  private notifyLowPowerModeListeners(enabled: boolean): void {
    this.lowPowerModeListeners.forEach((listener) => {
      try {
        listener(enabled);
      } catch (error) {
        console.error('[BatteryMonitor] Low power mode listener error:', error);
      }
    });
  }
}

// シングルトンインスタンス
export const BatteryMonitor = new BatteryMonitorService();
