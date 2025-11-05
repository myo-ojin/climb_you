/**
 * AccessibilityService
 * アクセシビリティ機能のサポート
 *
 * 機能:
 * - スクリーンリーダー状態の検出（VoiceOver, TalkBack）
 * - アナウンス機能（重要な変更の通知）
 * - フォーカス管理
 * - アクセシビリティイベントのリスナー
 */

import { AccessibilityInfo, Platform, findNodeHandle } from 'react-native';

export interface AccessibilityState {
  /**
   * スクリーンリーダーが有効か
   */
  isScreenReaderEnabled: boolean;

  /**
   * 大きなテキストが有効か（動的テキストサイズ）
   */
  isBoldTextEnabled: boolean;

  /**
   * グレースケール（色覚異常サポート）が有効か
   */
  isGrayscaleEnabled: boolean;

  /**
   * 反転色が有効か
   */
  isInvertColorsEnabled: boolean;

  /**
   * 透明度を下げる設定が有効か
   */
  isReduceTransparencyEnabled: boolean;

  /**
   * モーション低減が有効か
   */
  isReduceMotionEnabled: boolean;
}

type AccessibilityChangeListener = (state: AccessibilityState) => void;

class AccessibilityServiceClass {
  private state: AccessibilityState = {
    isScreenReaderEnabled: false,
    isBoldTextEnabled: false,
    isGrayscaleEnabled: false,
    isInvertColorsEnabled: false,
    isReduceTransparencyEnabled: false,
    isReduceMotionEnabled: false,
  };

  private listeners: Set<AccessibilityChangeListener> = new Set();
  private subscriptions: Array<{ remove: () => void }> = [];
  private initialized: boolean = false;

  /**
   * 初期化
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('[AccessibilityService] Already initialized');
      return;
    }

    try {
      // 初期状態を取得
      await this.loadAccessibilityState();

      // イベントリスナーを登録
      this.setupListeners();

      this.initialized = true;
      console.log('[AccessibilityService] Initialized');
    } catch (error) {
      console.error('[AccessibilityService] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * アクセシビリティ状態を読み込み
   */
  private async loadAccessibilityState(): Promise<void> {
    try {
      // スクリーンリーダー
      this.state.isScreenReaderEnabled = await AccessibilityInfo.isScreenReaderEnabled();

      // その他のアクセシビリティ機能（iOS専用もあり）
      if (Platform.OS === 'ios') {
        this.state.isBoldTextEnabled = await AccessibilityInfo.isBoldTextEnabled();
        this.state.isGrayscaleEnabled = await AccessibilityInfo.isGrayscaleEnabled();
        this.state.isInvertColorsEnabled = await AccessibilityInfo.isInvertColorsEnabled();
        this.state.isReduceTransparencyEnabled =
          await AccessibilityInfo.isReduceTransparencyEnabled();
      }

      this.state.isReduceMotionEnabled = await AccessibilityInfo.isReduceMotionEnabled();

      console.log('[AccessibilityService] State loaded:', this.state);
    } catch (error) {
      console.error('[AccessibilityService] Failed to load state:', error);
    }
  }

  /**
   * イベントリスナーをセットアップ
   */
  private setupListeners(): void {
    // スクリーンリーダー変更
    const screenReaderSub = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      (enabled) => {
        this.state.isScreenReaderEnabled = enabled;
        this.notifyListeners();
        console.log('[AccessibilityService] Screen reader changed:', enabled);
      }
    );
    this.subscriptions.push(screenReaderSub);

    // モーション低減変更
    const reduceMotionSub = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (enabled) => {
        this.state.isReduceMotionEnabled = enabled;
        this.notifyListeners();
        console.log('[AccessibilityService] Reduce motion changed:', enabled);
      }
    );
    this.subscriptions.push(reduceMotionSub);

    // iOS専用
    if (Platform.OS === 'ios') {
      const boldTextSub = AccessibilityInfo.addEventListener('boldTextChanged', (enabled) => {
        this.state.isBoldTextEnabled = enabled;
        this.notifyListeners();
        console.log('[AccessibilityService] Bold text changed:', enabled);
      });
      this.subscriptions.push(boldTextSub);

      const grayscaleSub = AccessibilityInfo.addEventListener('grayscaleChanged', (enabled) => {
        this.state.isGrayscaleEnabled = enabled;
        this.notifyListeners();
        console.log('[AccessibilityService] Grayscale changed:', enabled);
      });
      this.subscriptions.push(grayscaleSub);

      const invertColorsSub = AccessibilityInfo.addEventListener(
        'invertColorsChanged',
        (enabled) => {
          this.state.isInvertColorsEnabled = enabled;
          this.notifyListeners();
          console.log('[AccessibilityService] Invert colors changed:', enabled);
        }
      );
      this.subscriptions.push(invertColorsSub);

      const reduceTransparencySub = AccessibilityInfo.addEventListener(
        'reduceTransparencyChanged',
        (enabled) => {
          this.state.isReduceTransparencyEnabled = enabled;
          this.notifyListeners();
          console.log('[AccessibilityService] Reduce transparency changed:', enabled);
        }
      );
      this.subscriptions.push(reduceTransparencySub);
    }
  }

  /**
   * リスナーに通知
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      try {
        listener(this.state);
      } catch (error) {
        console.error('[AccessibilityService] Listener error:', error);
      }
    });
  }

  /**
   * 現在のアクセシビリティ状態を取得
   */
  getState(): AccessibilityState {
    return { ...this.state };
  }

  /**
   * スクリーンリーダーが有効か
   */
  isScreenReaderEnabled(): boolean {
    return this.state.isScreenReaderEnabled;
  }

  /**
   * モーション低減が有効か
   */
  isReduceMotionEnabled(): boolean {
    return this.state.isReduceMotionEnabled;
  }

  /**
   * アクセシビリティ変更のリスナーを追加
   */
  addListener(listener: AccessibilityChangeListener): () => void {
    this.listeners.add(listener);

    // 初回通知
    listener(this.state);

    // クリーンアップ関数を返す
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * スクリーンリーダーにアナウンス
   */
  announce(message: string, options?: { queue?: boolean }): void {
    try {
      AccessibilityInfo.announceForAccessibility(message);
      console.log('[AccessibilityService] Announced:', message);
    } catch (error) {
      console.error('[AccessibilityService] Failed to announce:', error);
    }
  }

  /**
   * アナウンス（遅延あり、キューをクリア）
   */
  announceDelayed(message: string, delay: number = 500): void {
    setTimeout(() => {
      this.announce(message);
    }, delay);
  }

  /**
   * 要素にフォーカスを設定
   */
  setAccessibilityFocus(reactTag: number | null): void {
    if (reactTag === null) {
      return;
    }

    try {
      AccessibilityInfo.setAccessibilityFocus(reactTag);
      console.log('[AccessibilityService] Focus set to:', reactTag);
    } catch (error) {
      console.error('[AccessibilityService] Failed to set focus:', error);
    }
  }

  /**
   * クリーンアップ
   */
  cleanup(): void {
    // リスナーを削除
    this.subscriptions.forEach((sub) => {
      sub.remove();
    });
    this.subscriptions = [];

    // カスタムリスナーをクリア
    this.listeners.clear();

    this.initialized = false;
    console.log('[AccessibilityService] Cleaned up');
  }
}

// シングルトンインスタンス
export const AccessibilityService = new AccessibilityServiceClass();
