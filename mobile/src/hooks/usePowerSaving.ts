/**
 * usePowerSaving Hook
 * 省電力設定を取得し、低電力モードに対応
 *
 * 機能:
 * - 現在の省電力設定を取得
 * - 設定変更の監視
 * - 低電力モード状態の取得
 * - バッテリー状態の取得
 */

import { useEffect, useState, useCallback } from 'react';
import { PowerSavingManager, PowerSavingSettings } from '@/services/PowerSavingManager';
import { BatteryMonitor, BatteryState } from '@/services/BatteryMonitor';

export interface PowerSavingHookResult {
  /**
   * 現在の省電力設定
   */
  settings: PowerSavingSettings;

  /**
   * 低電力モードかどうか
   */
  isLowPowerMode: boolean;

  /**
   * バッテリー状態
   */
  batteryState: BatteryState | null;

  /**
   * 低電力モードを手動で有効化
   */
  enableLowPowerMode: () => void;

  /**
   * 低電力モードを手動で無効化
   */
  disableLowPowerMode: () => void;

  /**
   * 設定を更新
   */
  updateSettings: (settings: Partial<PowerSavingSettings>) => void;
}

/**
 * usePowerSaving Hook
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { settings, isLowPowerMode, batteryState } = usePowerSaving();
 *
 *   return (
 *     <View>
 *       <Text>Battery: {batteryState?.levelPercent}%</Text>
 *       <Text>Low Power Mode: {isLowPowerMode ? 'ON' : 'OFF'}</Text>
 *       {settings.enableAnimations && <Animated.View />}
 *     </View>
 *   );
 * }
 * ```
 */
export function usePowerSaving(): PowerSavingHookResult {
  const [settings, setSettings] = useState<PowerSavingSettings>(
    PowerSavingManager.getSettings()
  );
  const [isLowPowerMode, setIsLowPowerMode] = useState(PowerSavingManager.isInLowPowerMode());
  const [batteryState, setBatteryState] = useState<BatteryState | null>(
    BatteryMonitor.getBatteryState()
  );

  useEffect(() => {
    // PowerSavingManagerの設定変更を監視
    const cleanupSettings = PowerSavingManager.addListener((newSettings) => {
      setSettings(newSettings);
      setIsLowPowerMode(PowerSavingManager.isInLowPowerMode());
    });

    // BatteryMonitorのバッテリー状態変更を監視
    const cleanupBattery = BatteryMonitor.addListener((newBatteryState) => {
      setBatteryState(newBatteryState);
    });

    return () => {
      cleanupSettings();
      cleanupBattery();
    };
  }, []);

  const enableLowPowerMode = useCallback(() => {
    PowerSavingManager.enableLowPowerMode();
  }, []);

  const disableLowPowerMode = useCallback(() => {
    PowerSavingManager.disableLowPowerMode();
  }, []);

  const updateSettings = useCallback((newSettings: Partial<PowerSavingSettings>) => {
    PowerSavingManager.updateSettings(newSettings);
  }, []);

  return {
    settings,
    isLowPowerMode,
    batteryState,
    enableLowPowerMode,
    disableLowPowerMode,
    updateSettings,
  };
}

/**
 * useBatteryState Hook
 * バッテリー状態のみを取得
 *
 * @example
 * ```tsx
 * const batteryState = useBatteryState();
 * ```
 */
export function useBatteryState(): BatteryState | null {
  const [batteryState, setBatteryState] = useState<BatteryState | null>(
    BatteryMonitor.getBatteryState()
  );

  useEffect(() => {
    const cleanup = BatteryMonitor.addListener((newBatteryState) => {
      setBatteryState(newBatteryState);
    });

    return cleanup;
  }, []);

  return batteryState;
}

/**
 * useLowPowerMode Hook
 * 低電力モード状態のみを取得
 *
 * @example
 * ```tsx
 * const isLowPowerMode = useLowPowerMode();
 * ```
 */
export function useLowPowerMode(): boolean {
  const [isLowPowerMode, setIsLowPowerMode] = useState(PowerSavingManager.isInLowPowerMode());

  useEffect(() => {
    const cleanup = PowerSavingManager.addListener(() => {
      setIsLowPowerMode(PowerSavingManager.isInLowPowerMode());
    });

    return cleanup;
  }, []);

  return isLowPowerMode;
}

/**
 * useConditionalFeature Hook
 * 特定の機能を低電力モード時に無効化
 *
 * @example
 * ```tsx
 * const shouldAnimate = useConditionalFeature('enableAnimations');
 * const shouldPrefetch = useConditionalFeature('enablePrefetch');
 * ```
 */
export function useConditionalFeature(
  settingKey: keyof PowerSavingSettings
): boolean | number {
  const [value, setValue] = useState(PowerSavingManager.getSettings()[settingKey]);

  useEffect(() => {
    const cleanup = PowerSavingManager.addListener((newSettings) => {
      setValue(newSettings[settingKey]);
    });

    return cleanup;
  }, [settingKey]);

  return value;
}
