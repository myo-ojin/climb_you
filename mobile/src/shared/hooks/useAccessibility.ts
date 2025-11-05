/**
 * useAccessibility Hook
 * アクセシビリティ機能をReactコンポーネントで使いやすくするカスタムフック
 *
 * 機能:
 * - スクリーンリーダー状態の検出（VoiceOver, TalkBack）
 * - モーション低減の検出
 * - アナウンス機能へのアクセス
 * - フォーカス管理へのアクセス
 * - アクセシビリティ状態の変更を自動的に反映
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { findNodeHandle } from 'react-native';
import {
  AccessibilityService,
  AccessibilityState,
} from '../../services/AccessibilityService';

export interface UseAccessibilityReturn {
  /**
   * 現在のアクセシビリティ状態
   */
  state: AccessibilityState;

  /**
   * スクリーンリーダーが有効か
   */
  isScreenReaderEnabled: boolean;

  /**
   * モーション低減が有効か
   */
  isReduceMotionEnabled: boolean;

  /**
   * Bold Textが有効か（iOS専用）
   */
  isBoldTextEnabled: boolean;

  /**
   * グレースケールが有効か（iOS専用）
   */
  isGrayscaleEnabled: boolean;

  /**
   * 反転色が有効か（iOS専用）
   */
  isInvertColorsEnabled: boolean;

  /**
   * 透明度を下げる設定が有効か（iOS専用）
   */
  isReduceTransparencyEnabled: boolean;

  /**
   * スクリーンリーダーにアナウンス
   */
  announce: (message: string) => void;

  /**
   * 遅延アナウンス
   */
  announceDelayed: (message: string, delay?: number) => void;

  /**
   * 要素にフォーカスを設定
   */
  setFocus: (ref: React.RefObject<any>) => void;
}

/**
 * useAccessibility
 * アクセシビリティ機能をReactで使いやすくするフック
 *
 * @example
 * ```tsx
 * const { isScreenReaderEnabled, announce, setFocus } = useAccessibility();
 *
 * // スクリーンリーダーが有効な場合は詳細な説明を表示
 * if (isScreenReaderEnabled) {
 *   return <Text>{detailedDescription}</Text>;
 * }
 *
 * // 操作完了時にアナウンス
 * const handleComplete = () => {
 *   announce('クエストが完了しました');
 * };
 *
 * // フォーカスを設定
 * const inputRef = useRef(null);
 * useEffect(() => {
 *   setFocus(inputRef);
 * }, []);
 * ```
 */
export const useAccessibility = (): UseAccessibilityReturn => {
  const [state, setState] = useState<AccessibilityState>(
    AccessibilityService.getState()
  );

  useEffect(() => {
    // AccessibilityServiceの初期化
    const initializeService = async () => {
      try {
        await AccessibilityService.initialize();
        setState(AccessibilityService.getState());
      } catch (error) {
        console.error('[useAccessibility] Failed to initialize:', error);
      }
    };

    initializeService();

    // アクセシビリティ状態の変更をリッスン
    const unsubscribe = AccessibilityService.addListener((newState) => {
      setState(newState);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  /**
   * アナウンス
   */
  const announce = useCallback((message: string) => {
    AccessibilityService.announce(message);
  }, []);

  /**
   * 遅延アナウンス
   */
  const announceDelayed = useCallback((message: string, delay: number = 500) => {
    AccessibilityService.announceDelayed(message, delay);
  }, []);

  /**
   * フォーカス設定
   */
  const setFocus = useCallback((ref: React.RefObject<any>) => {
    if (ref.current) {
      const reactTag = findNodeHandle(ref.current);
      AccessibilityService.setAccessibilityFocus(reactTag);
    }
  }, []);

  return {
    state,
    isScreenReaderEnabled: state.isScreenReaderEnabled,
    isReduceMotionEnabled: state.isReduceMotionEnabled,
    isBoldTextEnabled: state.isBoldTextEnabled,
    isGrayscaleEnabled: state.isGrayscaleEnabled,
    isInvertColorsEnabled: state.isInvertColorsEnabled,
    isReduceTransparencyEnabled: state.isReduceTransparencyEnabled,
    announce,
    announceDelayed,
    setFocus,
  };
};

/**
 * useScreenReader
 * スクリーンリーダーの状態のみを取得する軽量版フック
 *
 * @example
 * ```tsx
 * const isScreenReaderEnabled = useScreenReader();
 *
 * if (isScreenReaderEnabled) {
 *   // スクリーンリーダー専用の処理
 * }
 * ```
 */
export const useScreenReader = (): boolean => {
  const [isEnabled, setIsEnabled] = useState<boolean>(
    AccessibilityService.isScreenReaderEnabled()
  );

  useEffect(() => {
    // AccessibilityServiceの初期化
    const initializeService = async () => {
      try {
        await AccessibilityService.initialize();
        setIsEnabled(AccessibilityService.isScreenReaderEnabled());
      } catch (error) {
        console.error('[useScreenReader] Failed to initialize:', error);
      }
    };

    initializeService();

    // スクリーンリーダー状態の変更をリッスン
    const unsubscribe = AccessibilityService.addListener((newState) => {
      setIsEnabled(newState.isScreenReaderEnabled);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return isEnabled;
};

/**
 * useReduceMotion
 * モーション低減設定のみを取得する軽量版フック
 *
 * @example
 * ```tsx
 * const isReduceMotionEnabled = useReduceMotion();
 *
 * const animationConfig = {
 *   duration: isReduceMotionEnabled ? 0 : 300,
 * };
 * ```
 */
export const useReduceMotion = (): boolean => {
  const [isEnabled, setIsEnabled] = useState<boolean>(
    AccessibilityService.isReduceMotionEnabled()
  );

  useEffect(() => {
    // AccessibilityServiceの初期化
    const initializeService = async () => {
      try {
        await AccessibilityService.initialize();
        setIsEnabled(AccessibilityService.isReduceMotionEnabled());
      } catch (error) {
        console.error('[useReduceMotion] Failed to initialize:', error);
      }
    };

    initializeService();

    // モーション低減状態の変更をリッスン
    const unsubscribe = AccessibilityService.addListener((newState) => {
      setIsEnabled(newState.isReduceMotionEnabled);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return isEnabled;
};

/**
 * useAnnounce
 * アナウンス機能のみを提供する軽量版フック
 *
 * @example
 * ```tsx
 * const announce = useAnnounce();
 *
 * const handleSubmit = () => {
 *   // 処理...
 *   announce('フォームが送信されました');
 * };
 * ```
 */
export const useAnnounce = (): ((message: string) => void) => {
  const announceRef = useRef<(message: string) => void>(() => {});

  useEffect(() => {
    // AccessibilityServiceの初期化
    const initializeService = async () => {
      try {
        await AccessibilityService.initialize();
      } catch (error) {
        console.error('[useAnnounce] Failed to initialize:', error);
      }
    };

    initializeService();

    announceRef.current = (message: string) => {
      AccessibilityService.announce(message);
    };
  }, []);

  return useCallback((message: string) => {
    announceRef.current(message);
  }, []);
};

/**
 * useReduceTransparency
 * 透明度削減設定のみを取得する軽量版フック（iOS専用）
 *
 * @example
 * ```tsx
 * const isReduceTransparencyEnabled = useReduceTransparency();
 *
 * const overlayStyle = {
 *   backgroundColor: isReduceTransparencyEnabled
 *     ? 'rgba(0, 0, 0, 0.9)'  // ほぼ不透明
 *     : 'rgba(0, 0, 0, 0.5)', // 半透明
 * };
 * ```
 */
export const useReduceTransparency = (): boolean => {
  const [isEnabled, setIsEnabled] = useState<boolean>(
    AccessibilityService.getState().isReduceTransparencyEnabled
  );

  useEffect(() => {
    // AccessibilityServiceの初期化
    const initializeService = async () => {
      try {
        await AccessibilityService.initialize();
        setIsEnabled(AccessibilityService.getState().isReduceTransparencyEnabled);
      } catch (error) {
        console.error('[useReduceTransparency] Failed to initialize:', error);
      }
    };

    initializeService();

    // 透明度削減状態の変更をリッスン
    const unsubscribe = AccessibilityService.addListener((newState) => {
      setIsEnabled(newState.isReduceTransparencyEnabled);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return isEnabled;
};

/**
 * useBoldText
 * 太字テキスト設定のみを取得する軽量版フック（iOS専用）
 *
 * @example
 * ```tsx
 * const isBoldTextEnabled = useBoldText();
 *
 * const textStyle = {
 *   fontWeight: isBoldTextEnabled ? '700' : '400',
 * };
 * ```
 */
export const useBoldText = (): boolean => {
  const [isEnabled, setIsEnabled] = useState<boolean>(
    AccessibilityService.getState().isBoldTextEnabled
  );

  useEffect(() => {
    // AccessibilityServiceの初期化
    const initializeService = async () => {
      try {
        await AccessibilityService.initialize();
        setIsEnabled(AccessibilityService.getState().isBoldTextEnabled);
      } catch (error) {
        console.error('[useBoldText] Failed to initialize:', error);
      }
    };

    initializeService();

    // 太字テキスト状態の変更をリッスン
    const unsubscribe = AccessibilityService.addListener((newState) => {
      setIsEnabled(newState.isBoldTextEnabled);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return isEnabled;
};

/**
 * useGrayscale
 * グレースケール設定のみを取得する軽量版フック（iOS専用）
 *
 * @example
 * ```tsx
 * const isGrayscaleEnabled = useGrayscale();
 *
 * if (isGrayscaleEnabled) {
 *   // グレースケール時は色に頼らない表示にする
 * }
 * ```
 */
export const useGrayscale = (): boolean => {
  const [isEnabled, setIsEnabled] = useState<boolean>(
    AccessibilityService.getState().isGrayscaleEnabled
  );

  useEffect(() => {
    // AccessibilityServiceの初期化
    const initializeService = async () => {
      try {
        await AccessibilityService.initialize();
        setIsEnabled(AccessibilityService.getState().isGrayscaleEnabled);
      } catch (error) {
        console.error('[useGrayscale] Failed to initialize:', error);
      }
    };

    initializeService();

    // グレースケール状態の変更をリッスン
    const unsubscribe = AccessibilityService.addListener((newState) => {
      setIsEnabled(newState.isGrayscaleEnabled);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return isEnabled;
};

/**
 * useInvertColors
 * 反転色設定のみを取得する軽量版フック（iOS専用）
 *
 * @example
 * ```tsx
 * const isInvertColorsEnabled = useInvertColors();
 *
 * if (isInvertColorsEnabled) {
 *   // 反転色時の処理
 * }
 * ```
 */
export const useInvertColors = (): boolean => {
  const [isEnabled, setIsEnabled] = useState<boolean>(
    AccessibilityService.getState().isInvertColorsEnabled
  );

  useEffect(() => {
    // AccessibilityServiceの初期化
    const initializeService = async () => {
      try {
        await AccessibilityService.initialize();
        setIsEnabled(AccessibilityService.getState().isInvertColorsEnabled);
      } catch (error) {
        console.error('[useInvertColors] Failed to initialize:', error);
      }
    };

    initializeService();

    // 反転色状態の変更をリッスン
    const unsubscribe = AccessibilityService.addListener((newState) => {
      setIsEnabled(newState.isInvertColorsEnabled);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return isEnabled;
};

/**
 * useHighContrast
 * ハイコントラストモードが有効かを判定する軽量版フック
 *
 * 以下のいずれかが有効な場合にtrueを返します:
 * - 太字テキスト
 * - グレースケール
 * - 反転色
 *
 * @example
 * ```tsx
 * const isHighContrastEnabled = useHighContrast();
 *
 * const buttonStyle = {
 *   borderWidth: isHighContrastEnabled ? 2 : 1,
 *   borderColor: isHighContrastEnabled ? '#000' : '#ccc',
 * };
 * ```
 */
export const useHighContrast = (): boolean => {
  const [isEnabled, setIsEnabled] = useState<boolean>(false);

  useEffect(() => {
    // AccessibilityServiceの初期化
    const initializeService = async () => {
      try {
        await AccessibilityService.initialize();
        const state = AccessibilityService.getState();
        const highContrast =
          state.isBoldTextEnabled ||
          state.isGrayscaleEnabled ||
          state.isInvertColorsEnabled;
        setIsEnabled(highContrast);
      } catch (error) {
        console.error('[useHighContrast] Failed to initialize:', error);
      }
    };

    initializeService();

    // アクセシビリティ状態の変更をリッスン
    const unsubscribe = AccessibilityService.addListener((newState) => {
      const highContrast =
        newState.isBoldTextEnabled ||
        newState.isGrayscaleEnabled ||
        newState.isInvertColorsEnabled;
      setIsEnabled(highContrast);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return isEnabled;
};
