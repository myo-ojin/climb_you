/**
 * PowerSavingManager ユニットテスト
 */

import * as Battery from 'expo-battery';
import { BatteryMonitor } from '../BatteryMonitor';
import { PowerSavingManager } from '../PowerSavingManager';

// jest.setup.jsでモック済み

describe('PowerSavingManager', () => {
  beforeEach(async () => {
    // モックをリセット
    jest.clearAllMocks();

    // デフォルトのモック値を設定（通常バッテリー）
    (Battery.getBatteryLevelAsync as jest.Mock).mockResolvedValue(0.8);
    (Battery.getBatteryStateAsync as jest.Mock).mockResolvedValue(Battery.BatteryState.UNPLUGGED);

    // クリーンアップ
    PowerSavingManager.cleanup();
    BatteryMonitor.cleanup();
  });

  afterEach(() => {
    PowerSavingManager.cleanup();
    BatteryMonitor.cleanup();
  });

  describe('初期化', () => {
    it('initialize()でBatteryMonitorが初期化される', async () => {
      await PowerSavingManager.initialize();

      expect(Battery.getBatteryLevelAsync).toHaveBeenCalled();
      expect(Battery.getBatteryStateAsync).toHaveBeenCalled();
    });

    it('initialize()を複数回呼んでも1回のみ初期化', async () => {
      await PowerSavingManager.initialize();
      await PowerSavingManager.initialize();

      // 初回のみ呼ばれる
      expect(Battery.getBatteryLevelAsync).toHaveBeenCalledTimes(1);
    });

    it('初期状態でバッテリーが低電力モードの場合、低電力モードになる', async () => {
      // バッテリーを低電力モードに設定
      (Battery.getBatteryLevelAsync as jest.Mock).mockResolvedValue(0.15);

      await PowerSavingManager.initialize();

      expect(PowerSavingManager.isInLowPowerMode()).toBe(true);
      const settings = PowerSavingManager.getSettings();
      expect(settings.enableAnimations).toBe(false);
      expect(settings.enableBackgroundSync).toBe(false);
    });

    it('初期状態でバッテリーが通常モードの場合、通常モードになる', async () => {
      // バッテリーを通常モードに設定
      (Battery.getBatteryLevelAsync as jest.Mock).mockResolvedValue(0.8);

      await PowerSavingManager.initialize();

      expect(PowerSavingManager.isInLowPowerMode()).toBe(false);
      const settings = PowerSavingManager.getSettings();
      expect(settings.enableAnimations).toBe(true);
      expect(settings.enableBackgroundSync).toBe(true);
    });
  });

  describe('設定取得・更新', () => {
    beforeEach(async () => {
      await PowerSavingManager.initialize();
    });

    it('getSettings()で現在の設定を取得', () => {
      const settings = PowerSavingManager.getSettings();

      expect(settings).toBeDefined();
      expect(settings.enableAnimations).toBe(true);
      expect(settings.enableBackgroundSync).toBe(true);
      expect(settings.enableAutoRefresh).toBe(true);
      expect(settings.useHighQualityImages).toBe(true);
      expect(settings.enablePrefetch).toBe(true);
      expect(settings.syncInterval).toBe(5 * 60 * 1000);
    });

    it('updateSettings()で設定を更新', () => {
      PowerSavingManager.updateSettings({ enableAnimations: false });

      const settings = PowerSavingManager.getSettings();
      expect(settings.enableAnimations).toBe(false);
      expect(settings.enableBackgroundSync).toBe(true); // 他の設定は変わらない
    });

    it('updateNormalModeSettings()で通常モード設定を更新', () => {
      // 通常モード時
      PowerSavingManager.updateNormalModeSettings({ syncInterval: 10 * 60 * 1000 });

      const settings = PowerSavingManager.getSettings();
      expect(settings.syncInterval).toBe(10 * 60 * 1000);
    });

    it('updateLowPowerModeSettings()で低電力モード設定を更新', () => {
      // 低電力モードに切り替え
      PowerSavingManager.enableLowPowerMode();

      PowerSavingManager.updateLowPowerModeSettings({ syncInterval: 20 * 60 * 1000 });

      const settings = PowerSavingManager.getSettings();
      expect(settings.syncInterval).toBe(20 * 60 * 1000);
    });

    it('updateNormalModeSettings()は低電力モード時に現在の設定に影響しない', () => {
      // 低電力モードに切り替え
      PowerSavingManager.enableLowPowerMode();

      PowerSavingManager.updateNormalModeSettings({ syncInterval: 10 * 60 * 1000 });

      const settings = PowerSavingManager.getSettings();
      // 低電力モードの設定のまま
      expect(settings.syncInterval).toBe(15 * 60 * 1000);
    });
  });

  describe('低電力モード制御', () => {
    beforeEach(async () => {
      await PowerSavingManager.initialize();
    });

    it('enableLowPowerMode()で低電力モードを有効化', () => {
      expect(PowerSavingManager.isInLowPowerMode()).toBe(false);

      PowerSavingManager.enableLowPowerMode();

      expect(PowerSavingManager.isInLowPowerMode()).toBe(true);
      const settings = PowerSavingManager.getSettings();
      expect(settings.enableAnimations).toBe(false);
      expect(settings.syncInterval).toBe(15 * 60 * 1000);
    });

    it('disableLowPowerMode()で低電力モードを無効化', () => {
      PowerSavingManager.enableLowPowerMode();
      expect(PowerSavingManager.isInLowPowerMode()).toBe(true);

      PowerSavingManager.disableLowPowerMode();

      expect(PowerSavingManager.isInLowPowerMode()).toBe(false);
      const settings = PowerSavingManager.getSettings();
      expect(settings.enableAnimations).toBe(true);
      expect(settings.syncInterval).toBe(5 * 60 * 1000);
    });

    it('既に有効な場合に再度有効化しても変化なし', () => {
      PowerSavingManager.enableLowPowerMode();
      const settings1 = PowerSavingManager.getSettings();

      PowerSavingManager.enableLowPowerMode();
      const settings2 = PowerSavingManager.getSettings();

      expect(settings1).toEqual(settings2);
    });

    it('既に無効な場合に再度無効化しても変化なし', () => {
      const settings1 = PowerSavingManager.getSettings();

      PowerSavingManager.disableLowPowerMode();
      const settings2 = PowerSavingManager.getSettings();

      expect(settings1).toEqual(settings2);
    });
  });

  describe('リスナー', () => {
    beforeEach(async () => {
      await PowerSavingManager.initialize();
    });

    it('addListener()でリスナー登録', () => {
      const listener = jest.fn();

      const cleanup = PowerSavingManager.addListener(listener);

      // 登録時に現在の設定で呼ばれる
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          enableAnimations: true,
          enableBackgroundSync: true,
        })
      );

      cleanup();
    });

    it('設定変更時にリスナーが呼ばれる', () => {
      const listener = jest.fn();
      PowerSavingManager.addListener(listener);

      listener.mockClear();

      PowerSavingManager.updateSettings({ enableAnimations: false });

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          enableAnimations: false,
        })
      );
    });

    it('低電力モード切り替え時にリスナーが呼ばれる', () => {
      const listener = jest.fn();
      PowerSavingManager.addListener(listener);

      listener.mockClear();

      PowerSavingManager.enableLowPowerMode();

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          enableAnimations: false,
          enableBackgroundSync: false,
        })
      );
    });

    it('cleanup関数でリスナーを削除', () => {
      const listener = jest.fn();
      const cleanup = PowerSavingManager.addListener(listener);

      listener.mockClear();

      cleanup();

      PowerSavingManager.updateSettings({ enableAnimations: false });

      // 削除されたのでリスナーは呼ばれない
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('クリーンアップ', () => {
    it('cleanup()でリスナーをクリア', async () => {
      await PowerSavingManager.initialize();

      const listener = jest.fn();
      PowerSavingManager.addListener(listener);

      PowerSavingManager.cleanup();

      listener.mockClear();

      // クリーンアップ後はリスナーが呼ばれない
      PowerSavingManager.updateSettings({ enableAnimations: false });
      expect(listener).not.toHaveBeenCalled();
    });
  });
});
