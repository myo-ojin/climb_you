/**
 * NotificationNavigationHandler Unit Tests
 * NotificationNavigationHandlerのユニットテスト
 */

import { NotificationNavigationHandler } from './NotificationNavigationHandler';
import { NotificationType } from './types';
import * as Notifications from 'expo-notifications';

describe('NotificationNavigationHandler', () => {
  let handler: NotificationNavigationHandler;
  let mockNavigationRef: any;

  beforeEach(() => {
    // モックのNavigationRefを作成
    mockNavigationRef = {
      navigate: jest.fn(),
      isReady: jest.fn(() => true),
    };

    handler = NotificationNavigationHandler.getInstance();
  });

  afterEach(() => {
    handler.cleanup();
    jest.clearAllMocks();
  });

  describe('getInstance', () => {
    it('シングルトンインスタンスを返すこと', () => {
      const instance1 = NotificationNavigationHandler.getInstance();
      const instance2 = NotificationNavigationHandler.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe('initialize', () => {
    it('NavigationRefを初期化できること', () => {
      expect(() => {
        handler.initialize({ navigationRef: mockNavigationRef });
      }).not.toThrow();
    });
  });

  describe('handleNotification', () => {
    beforeEach(() => {
      handler.initialize({ navigationRef: mockNavigationRef });
    });

    it('日次クエスト生成通知 → ホーム画面に遷移', async () => {
      const mockNotification = {
        request: {
          content: {
            data: {
              type: NotificationType.DAILY_QUEST_GENERATED,
            },
          },
        },
      } as Notifications.Notification;

      await handler.handleNotification(mockNotification);

      expect(mockNavigationRef.navigate).toHaveBeenCalledWith('Main', {
        screen: 'Home',
      });
    });

    it('マイルストーン達成通知 → 進捗画面に遷移', async () => {
      const mockNotification = {
        request: {
          content: {
            data: {
              type: NotificationType.MILESTONE_ACHIEVED,
            },
          },
        },
      } as Notifications.Notification;

      await handler.handleNotification(mockNotification);

      expect(mockNavigationRef.navigate).toHaveBeenCalledWith('Main', {
        screen: 'Progress',
      });
    });

    it('週次ランキング通知 → ランキング画面に遷移', async () => {
      const mockNotification = {
        request: {
          content: {
            data: {
              type: NotificationType.WEEKLY_RANKING,
            },
          },
        },
      } as Notifications.Notification;

      await handler.handleNotification(mockNotification);

      expect(mockNavigationRef.navigate).toHaveBeenCalledWith('Main', {
        screen: 'Ranking',
      });
    });

    it('停滞アラート通知（goalId付き） → 目標編集画面に遷移', async () => {
      const mockNotification = {
        request: {
          content: {
            data: {
              type: NotificationType.STAGNATION_ALERT,
              goalId: 'goal-123',
            },
          },
        },
      } as Notifications.Notification;

      await handler.handleNotification(mockNotification);

      expect(mockNavigationRef.navigate).toHaveBeenCalledWith('Main', {
        screen: 'GoalEdit',
        params: { goalId: 'goal-123' },
      });
    });

    it('停滞アラート通知（goalIdなし） → ホーム画面に遷移', async () => {
      const mockNotification = {
        request: {
          content: {
            data: {
              type: NotificationType.STAGNATION_ALERT,
            },
          },
        },
      } as Notifications.Notification;

      await handler.handleNotification(mockNotification);

      expect(mockNavigationRef.navigate).toHaveBeenCalledWith('Main', {
        screen: 'Home',
      });
    });

    it('リマインダー通知（questId付き） → クエスト詳細画面に遷移', async () => {
      const mockNotification = {
        request: {
          content: {
            data: {
              type: NotificationType.REMINDER,
              questId: 'quest-456',
            },
          },
        },
      } as Notifications.Notification;

      await handler.handleNotification(mockNotification);

      expect(mockNavigationRef.navigate).toHaveBeenCalledWith('Main', {
        screen: 'QuestDetail',
        params: { questId: 'quest-456' },
      });
    });

    it('リマインダー通知（questIdなし） → ホーム画面に遷移', async () => {
      const mockNotification = {
        request: {
          content: {
            data: {
              type: NotificationType.REMINDER,
            },
          },
        },
      } as Notifications.Notification;

      await handler.handleNotification(mockNotification);

      expect(mockNavigationRef.navigate).toHaveBeenCalledWith('Main', {
        screen: 'Home',
      });
    });

    it('通知データがない場合、処理をスキップすること', async () => {
      const mockNotification = {
        request: {
          content: {
            data: null,
          },
        },
      } as Notifications.Notification;

      await handler.handleNotification(mockNotification);

      expect(mockNavigationRef.navigate).not.toHaveBeenCalled();
    });

    it('Navigation Refが初期化されていない場合、処理をスキップすること', async () => {
      // cleanupして状態をリセット
      handler.cleanup();

      // initialize()を呼ばずに通知を処理
      const mockNotification = {
        request: {
          content: {
            data: {
              type: NotificationType.DAILY_QUEST_GENERATED,
            },
          },
        },
      } as Notifications.Notification;

      // モックをリセット
      jest.clearAllMocks();

      await handler.handleNotification(mockNotification);

      // navigateが呼ばれないことを確認
      expect(mockNavigationRef.navigate).not.toHaveBeenCalled();
    });
  });

  describe('handleAction', () => {
    beforeEach(() => {
      handler.initialize({ navigationRef: mockNavigationRef });
    });

    it('mark_completeアクション → クエスト詳細画面に遷移', async () => {
      const mockNotification = {
        request: {
          content: {
            data: {
              questId: 'quest-789',
            },
          },
        },
      } as Notifications.Notification;

      await handler.handleAction('mark_complete', mockNotification);

      expect(mockNavigationRef.navigate).toHaveBeenCalledWith('Main', {
        screen: 'QuestDetail',
        params: { questId: 'quest-789' },
      });
    });

    it('view_progressアクション → 進捗画面に遷移', async () => {
      const mockNotification = {
        request: {
          content: {
            data: {},
          },
        },
      } as Notifications.Notification;

      await handler.handleAction('view_progress', mockNotification);

      expect(mockNavigationRef.navigate).toHaveBeenCalledWith('Main', {
        screen: 'Progress',
      });
    });

    it('adjust_goalアクション → 目標編集画面に遷移', async () => {
      const mockNotification = {
        request: {
          content: {
            data: {
              goalId: 'goal-999',
            },
          },
        },
      } as Notifications.Notification;

      await handler.handleAction('adjust_goal', mockNotification);

      expect(mockNavigationRef.navigate).toHaveBeenCalledWith('Main', {
        screen: 'GoalEdit',
        params: { goalId: 'goal-999' },
      });
    });

    it('defaultアクション → 通知タイプに応じて遷移', async () => {
      const mockNotification = {
        request: {
          content: {
            data: {
              type: NotificationType.MILESTONE_ACHIEVED,
            },
          },
        },
      } as Notifications.Notification;

      await handler.handleAction('default', mockNotification);

      expect(mockNavigationRef.navigate).toHaveBeenCalledWith('Main', {
        screen: 'Progress',
      });
    });
  });

  describe('cleanup', () => {
    it('Navigation Refをクリアできること', () => {
      handler.initialize({ navigationRef: mockNavigationRef });

      expect(() => {
        handler.cleanup();
      }).not.toThrow();
    });
  });
});
