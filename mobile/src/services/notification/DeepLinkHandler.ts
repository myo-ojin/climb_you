/**
 * DeepLinkHandler
 * ディープリンク処理
 *
 * アプリ外部からの通知やリンクからアプリ内の特定画面に遷移します
 */

import * as Linking from 'expo-linking';
import { NavigationContainerRef } from '@react-navigation/native';

/**
 * Deep Link Handler Options
 */
export interface DeepLinkHandlerOptions {
  /**
   * Navigation Reference
   */
  navigationRef: NavigationContainerRef<any>;
}

/**
 * Deep Link Route
 */
export interface DeepLinkRoute {
  /**
   * スクリーン名
   */
  screen: string;

  /**
   * パラメータ
   */
  params?: Record<string, any>;
}

/**
 * DeepLinkHandler
 */
export class DeepLinkHandler {
  private static instance: DeepLinkHandler | null = null;
  private navigationRef: NavigationContainerRef<any> | null = null;
  private urlSubscription: ReturnType<typeof Linking.addEventListener> | null = null;

  private constructor() {}

  /**
   * インスタンス取得（シングルトン）
   */
  public static getInstance(): DeepLinkHandler {
    if (!DeepLinkHandler.instance) {
      DeepLinkHandler.instance = new DeepLinkHandler();
    }
    return DeepLinkHandler.instance;
  }

  /**
   * 初期化
   */
  public initialize(options: DeepLinkHandlerOptions): void {
    this.navigationRef = options.navigationRef;

    // 初期URLを処理（アプリが閉じている状態から起動された場合）
    this.handleInitialURL();

    // URLイベントリスナーを設定（アプリが起動中にディープリンクを受け取った場合）
    this.urlSubscription = Linking.addEventListener('url', this.handleUrlEvent.bind(this));

    console.log('DeepLinkHandler initialized');
  }

  /**
   * 初期URLを処理
   */
  private async handleInitialURL(): Promise<void> {
    try {
      const url = await Linking.getInitialURL();

      if (url) {
        console.log('Initial URL:', url);
        await this.handleURL(url);
      }
    } catch (error) {
      console.error('Error handling initial URL:', error);
    }
  }

  /**
   * URLイベントを処理
   */
  private async handleUrlEvent(event: { url: string }): Promise<void> {
    try {
      console.log('URL event:', event.url);
      await this.handleURL(event.url);
    } catch (error) {
      console.error('Error handling URL event:', error);
    }
  }

  /**
   * URLを処理
   */
  private async handleURL(url: string): Promise<void> {
    try {
      if (!this.navigationRef) {
        console.warn('Navigation ref not initialized');
        return;
      }

      // URLをパース
      const { hostname, path, queryParams } = Linking.parse(url);

      console.log('Parsed URL:', { hostname, path, queryParams });

      // パスに基づいてルートを決定
      const route = this.getRouteFromPath(path, queryParams);

      if (route) {
        await this.navigate(route);
      } else {
        console.warn('No route found for path:', path);
      }
    } catch (error) {
      console.error('Error handling URL:', error);
    }
  }

  /**
   * パスからルートを取得
   */
  private getRouteFromPath(
    path: string | null,
    queryParams: Record<string, string> | null
  ): DeepLinkRoute | null {
    if (!path) {
      return null;
    }

    // パスを / で分割
    const segments = path.split('/').filter((s) => s.length > 0);

    if (segments.length === 0) {
      return { screen: 'Home' };
    }

    const [mainPath, ...rest] = segments;

    switch (mainPath) {
      case 'home':
        return { screen: 'Home' };

      case 'quest':
        // /quest/:questId
        if (rest.length > 0) {
          return {
            screen: 'QuestDetail',
            params: { questId: rest[0] },
          };
        }
        return { screen: 'Home' };

      case 'progress':
        return { screen: 'Progress' };

      case 'ranking':
        return { screen: 'Ranking' };

      case 'goal':
        // /goal/:goalId または /goal/:goalId/edit
        if (rest.length > 0) {
          const goalId = rest[0];
          if (rest.length > 1 && rest[1] === 'edit') {
            return {
              screen: 'GoalEdit',
              params: { goalId },
            };
          }
          return {
            screen: 'GoalDetail',
            params: { goalId },
          };
        }
        return { screen: 'Home' };

      case 'settings':
        // /settings, /settings/notifications, /settings/privacy
        if (rest.length > 0) {
          if (rest[0] === 'notifications') {
            return { screen: 'NotificationSettings' };
          } else if (rest[0] === 'privacy') {
            return { screen: 'PrivacyPolicy' };
          }
        }
        return { screen: 'Settings' };

      default:
        console.warn('Unknown path:', mainPath);
        return null;
    }
  }

  /**
   * ナビゲーション実行
   */
  private async navigate(route: DeepLinkRoute): Promise<void> {
    if (!this.navigationRef || !this.navigationRef.isReady()) {
      console.warn('Navigation not ready');
      return;
    }

    try {
      // Main Navigatorのスクリーンに遷移
      this.navigationRef.navigate('Main', {
        screen: route.screen,
        params: route.params,
      });

      console.log('Navigated to:', route.screen, route.params);
    } catch (error) {
      console.error('Error navigating:', error);
    }
  }

  /**
   * ディープリンクURLを生成
   */
  public createDeepLink(screen: string, params?: Record<string, any>): string {
    const prefix = Linking.createURL('');

    switch (screen) {
      case 'Home':
        return `${prefix}home`;

      case 'QuestDetail':
        if (params?.questId) {
          return `${prefix}quest/${params.questId}`;
        }
        break;

      case 'Progress':
        return `${prefix}progress`;

      case 'Ranking':
        return `${prefix}ranking`;

      case 'GoalDetail':
        if (params?.goalId) {
          return `${prefix}goal/${params.goalId}`;
        }
        break;

      case 'GoalEdit':
        if (params?.goalId) {
          return `${prefix}goal/${params.goalId}/edit`;
        }
        break;

      case 'Settings':
        return `${prefix}settings`;

      case 'NotificationSettings':
        return `${prefix}settings/notifications`;

      case 'PrivacyPolicy':
        return `${prefix}settings/privacy`;

      default:
        console.warn('Unknown screen for deep link:', screen);
    }

    // デフォルトはホーム
    return `${prefix}home`;
  }

  /**
   * ディープリンクURLを開く
   */
  public async openDeepLink(url: string): Promise<void> {
    try {
      const canOpen = await Linking.canOpenURL(url);

      if (canOpen) {
        await Linking.openURL(url);
        console.log('Opened deep link:', url);
      } else {
        console.warn('Cannot open URL:', url);
      }
    } catch (error) {
      console.error('Error opening deep link:', error);
    }
  }

  /**
   * クリーンアップ
   */
  public cleanup(): void {
    if (this.urlSubscription) {
      this.urlSubscription.remove();
      this.urlSubscription = null;
    }

    this.navigationRef = null;
    console.log('DeepLinkHandler cleaned up');
  }
}

/**
 * デフォルトエクスポート
 */
export default DeepLinkHandler.getInstance();
