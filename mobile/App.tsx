/**
 * App.tsx
 * アプリケーションのエントリーポイント
 */

import React, { useEffect, useState, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ActivityIndicator, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { Provider } from 'react-redux';
import * as Notifications from 'expo-notifications';
import { store } from '@/store';
import { RootNavigator } from '@/navigation';
import { DatabaseManager } from '@/core/data/DatabaseManager';
import {
  NotificationService,
  NotificationNavigationHandler,
  DeepLinkHandler,
  NotificationActionIdentifier,
} from '@/services/notification';
import { PerformanceMonitor } from '@/utils/PerformanceMonitor';
import { LazyLoadManager } from '@/utils/LazyLoadManager';
import { SyncManager } from '@/features/sync/services/SyncManager';
import { logHermesInfo, logOptimizationHints } from '@/utils/HermesDetector';
import '@/core/i18n'; // i18n初期化

export default function App() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const navigationRef = useRef<NavigationContainerRef<any>>(null);

  useEffect(() => {
    initializeApp();
    registerLazyServices();
  }, []);

  useEffect(() => {
    // Navigation Refが利用可能になったら通知ハンドラーを初期化
    if (navigationRef.current && !isInitializing) {
      initializeNotificationHandlers();

      // UIが表示された後、非クリティカルなサービスをバックグラウンドで初期化
      LazyLoadManager.initializeInBackground();
    }

    return () => {
      cleanupNotificationHandlers();
    };
  }, [isInitializing]);

  /**
   * 遅延初期化するサービスを登録
   */
  const registerLazyServices = () => {
    // SyncManagerの初期化を遅延（低優先度）
    LazyLoadManager.register(
      'sync-manager',
      async () => {
        const syncManager = SyncManager.getInstance();
        await syncManager.initialize();
        console.log('[App] SyncManager initialized (lazy)');
      },
      'low'
    );

    // 他の非クリティカルなサービスもここに登録
    // 例: AnalyticsService、CacheCleanupService など
  };

  /**
   * アプリ初期化処理
   */
  const initializeApp = async () => {
    try {
      PerformanceMonitor.start('app-initialization');
      console.log('[App] Starting app initialization...');

      // Hermes エンジン情報を出力（開発環境のみ）
      if (__DEV__) {
        logHermesInfo();
        logOptimizationHints();
      }

      // 並列初期化: データベース + 通知サービス
      PerformanceMonitor.start('parallel-initialization');

      const dbManager = DatabaseManager.getInstance();
      const notificationService = NotificationService.getInstance();

      await Promise.all([
        PerformanceMonitor.measureAsync('database-initialization', async () => {
          await dbManager.initialize();
          console.log('[App] Database initialized');
        }),
        PerformanceMonitor.measureAsync('notification-initialization', async () => {
          await notificationService.initialize();
          console.log('[App] Notification service initialized');
        }),
      ]);

      PerformanceMonitor.end('parallel-initialization');
      console.log('[App] Parallel initialization completed');

      // その他の初期化処理
      // - SyncManager初期化は後でバックグラウンドで行う
      // - アプリの起動を遅延させないため

      PerformanceMonitor.end('app-initialization');
      PerformanceMonitor.recordMemoryUsage();

      console.log('[App] App initialization completed');
      console.log(`[App] Total startup time: ${PerformanceMonitor.getStartupTime()}ms`);

      // パフォーマンスレポート出力（開発環境のみ）
      if (__DEV__) {
        PerformanceMonitor.report();
      }

      setIsInitializing(false);
    } catch (error) {
      console.error('[App] App initialization failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setInitError(errorMessage);
      setIsInitializing(false);
    }
  };

  /**
   * 通知ハンドラー初期化
   */
  const initializeNotificationHandlers = () => {
    if (!navigationRef.current) {
      return;
    }

    try {
      console.log('[App] Initializing notification handlers...');

      // NotificationNavigationHandlerの初期化
      const navigationHandler = NotificationNavigationHandler.getInstance();
      navigationHandler.initialize({ navigationRef: navigationRef.current });

      // DeepLinkHandlerの初期化
      const deepLinkHandler = DeepLinkHandler.getInstance();
      deepLinkHandler.initialize({ navigationRef: navigationRef.current });

      // NotificationServiceに通知リスナーを登録
      const notificationService = NotificationService.getInstance();

      // 通知受信リスナー（フォアグラウンド）
      notificationService.addNotificationReceivedListener((notification) => {
        console.log('[App] Notification received:', notification.request.identifier);
      });

      // 通知応答リスナー（通知タップ時）
      notificationService.addNotificationResponseReceivedListener(async (response) => {
        console.log('[App] Notification response received');

        const actionIdentifier = response.actionIdentifier;

        if (actionIdentifier) {
          // アクションがある場合
          await navigationHandler.handleAction(actionIdentifier, response.notification);
        } else {
          // アクションがない場合（通知タップ）
          await navigationHandler.handleNotification(response.notification);
        }
      });

      // カスタムアクションハンドラーを登録
      notificationService.registerActionHandler(
        NotificationActionIdentifier.MARK_COMPLETE,
        async (actionIdentifier, notification) => {
          console.log('[App] Mark complete action');
          // クエスト完了処理はここで実装
          // 実際のロジックはQuestUseCaseを呼び出す
          await navigationHandler.handleAction(actionIdentifier, notification);
        }
      );

      notificationService.registerActionHandler(
        NotificationActionIdentifier.SNOOZE,
        async (actionIdentifier, notification) => {
          console.log('[App] Snooze action');
          // 1時間後に再通知（デフォルト実装がNotificationActionHandlerにある）
        }
      );

      console.log('[App] Notification handlers initialized');
    } catch (error) {
      console.error('[App] Failed to initialize notification handlers:', error);
    }
  };

  /**
   * 通知ハンドラークリーンアップ
   */
  const cleanupNotificationHandlers = () => {
    try {
      const notificationService = NotificationService.getInstance();
      notificationService.cleanup();

      const navigationHandler = NotificationNavigationHandler.getInstance();
      navigationHandler.cleanup();

      const deepLinkHandler = DeepLinkHandler.getInstance();
      deepLinkHandler.cleanup();

      console.log('[App] Notification handlers cleaned up');
    } catch (error) {
      console.error('[App] Failed to cleanup notification handlers:', error);
    }
  };

  /**
   * 初期化中のローディング画面
   */
  if (isInitializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3C507D" />
        <Text style={styles.loadingText}>初期化中...</Text>
        <StatusBar style="auto" />
      </View>
    );
  }

  /**
   * 初期化エラー画面
   */
  if (initError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>初期化エラー</Text>
        <Text style={styles.errorMessage}>{initError}</Text>
        <Text style={styles.errorHint}>アプリを再起動してください</Text>
        <StatusBar style="auto" />
      </View>
    );
  }

  /**
   * メインアプリ
   */
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <NavigationContainer ref={navigationRef}>
          <RootNavigator />
          <StatusBar style="auto" />
        </NavigationContainer>
      </SafeAreaProvider>
    </Provider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#333',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#D32F2F',
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorHint: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
});
