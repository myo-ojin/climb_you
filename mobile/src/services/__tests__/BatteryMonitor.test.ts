/**
 * BatteryMonitor ユニットテスト
 */

import * as Battery from 'expo-battery';
import { BatteryMonitor } from '../BatteryMonitor';

// jest.setup.jsでモック済み

describe('BatteryMonitor', () => {
  beforeEach(async () => {
    // モックをリセット
    jest.clearAllMocks();

    // デフォルトのモック値を設定
    (Battery.getBatteryLevelAsync as jest.Mock).mockResolvedValue(0.8);
    (Battery.getBatteryStateAsync as jest.Mock).mockResolvedValue(Battery.BatteryState.UNPLUGGED);

    // クリーンアップ
    BatteryMonitor.cleanup();
  });

  afterEach(() => {
    BatteryMonitor.cleanup();
  });

  describe('初期化', () => {
    it('initialize()でバッテリー状態を取得', async () => {
      await BatteryMonitor.initialize();

      expect(Battery.getBatteryLevelAsync).toHaveBeenCalled();
      expect(Battery.getBatteryStateAsync).toHaveBeenCalled();

      const state = BatteryMonitor.getBatteryState();
      expect(state).not.toBeNull();
      expect(state?.level).toBe(0.8);
      expect(state?.levelPercent).toBe(80);
      expect(state?.isCharging).toBe(false);
    });

    it('initialize()を複数回呼んでも1回のみ初期化', async () => {
      await BatteryMonitor.initialize();
      await BatteryMonitor.initialize();

      // 初回のみ呼ばれる（2回目は「Already initialized」ログのみ）
      expect(Battery.getBatteryLevelAsync).toHaveBeenCalledTimes(1);
    });
  });

  describe('バッテリー状態', () => {
    it('getBatteryState()で現在の状態を取得', async () => {
      await BatteryMonitor.initialize();

      const state = BatteryMonitor.getBatteryState();
      expect(state).toMatchObject({
        level: 0.8,
        levelPercent: 80,
        batteryState: Battery.BatteryState.UNPLUGGED,
        isCharging: false,
        isLowPowerMode: false,
      });
    });

    it('充電中の場合、isChargingがtrue', async () => {
      (Battery.getBatteryStateAsync as jest.Mock).mockResolvedValue(Battery.BatteryState.CHARGING);

      await BatteryMonitor.initialize();

      const state = BatteryMonitor.getBatteryState();
      expect(state?.isCharging).toBe(true);
    });

    it('満充電の場合、isChargingがtrue', async () => {
      (Battery.getBatteryLevelAsync as jest.Mock).mockResolvedValue(1.0);
      (Battery.getBatteryStateAsync as jest.Mock).mockResolvedValue(Battery.BatteryState.FULL);

      await BatteryMonitor.initialize();

      const state = BatteryMonitor.getBatteryState();
      expect(state?.isCharging).toBe(true);
      expect(state?.levelPercent).toBe(100);
    });
  });

  describe('低電力モード', () => {
    it('バッテリーレベルが20%以下で充電中でない場合、低電力モード', async () => {
      (Battery.getBatteryLevelAsync as jest.Mock).mockResolvedValue(0.15);
      (Battery.getBatteryStateAsync as jest.Mock).mockResolvedValue(Battery.BatteryState.UNPLUGGED);

      await BatteryMonitor.initialize();

      expect(BatteryMonitor.isLowPowerMode()).toBe(true);
    });

    it('バッテリーレベルが20%以下でも充電中なら低電力モードではない', async () => {
      (Battery.getBatteryLevelAsync as jest.Mock).mockResolvedValue(0.15);
      (Battery.getBatteryStateAsync as jest.Mock).mockResolvedValue(Battery.BatteryState.CHARGING);

      await BatteryMonitor.initialize();

      expect(BatteryMonitor.isLowPowerMode()).toBe(false);
    });

    it('バッテリーレベルが20%より高い場合、低電力モードではない', async () => {
      (Battery.getBatteryLevelAsync as jest.Mock).mockResolvedValue(0.5);
      (Battery.getBatteryStateAsync as jest.Mock).mockResolvedValue(Battery.BatteryState.UNPLUGGED);

      await BatteryMonitor.initialize();

      expect(BatteryMonitor.isLowPowerMode()).toBe(false);
    });
  });

  describe('リスナー', () => {
    it('addListener()でバッテリー状態変化を監視', async () => {
      await BatteryMonitor.initialize();

      const listener = jest.fn();
      const cleanup = BatteryMonitor.addListener(listener);

      // 現時点では呼ばれない（状態変化時のみ）
      expect(listener).not.toHaveBeenCalled();

      cleanup();
    });

    it('addLowPowerModeListener()で低電力モード変化を監視', async () => {
      await BatteryMonitor.initialize();

      const listener = jest.fn();
      const cleanup = BatteryMonitor.addLowPowerModeListener(listener);

      // 現時点では呼ばれない（状態変化時のみ）
      expect(listener).not.toHaveBeenCalled();

      cleanup();
    });

    it('cleanup()でリスナーをクリア', async () => {
      await BatteryMonitor.initialize();

      const listener = jest.fn();
      BatteryMonitor.addListener(listener);
      BatteryMonitor.addLowPowerModeListener(jest.fn());

      BatteryMonitor.cleanup();

      // クリーンアップ後はリスナーが空
      const state = BatteryMonitor.getBatteryState();
      expect(state).toBeNull();
    });
  });

  describe('クリーンアップ', () => {
    it('cleanup()で状態をクリア', async () => {
      await BatteryMonitor.initialize();

      expect(BatteryMonitor.getBatteryState()).not.toBeNull();

      BatteryMonitor.cleanup();

      expect(BatteryMonitor.getBatteryState()).toBeNull();
    });
  });
});
