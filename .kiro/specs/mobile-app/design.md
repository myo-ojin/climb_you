# 設計書：モバイルアプリ版（React Native）

## 概要

climb-youのReact Nativeモバイルアプリケーションは、ChatGPT Apps SDK版で検証したUXとデータモデルを流用し、React Native + Expoを使用してクロスプラットフォーム実装する。バックエンドAPIとの通信にはMCP（Model Context Protocol）を使用し、オフライン対応のためにSQLiteとAsyncStorageでローカルデータを管理する。iOS/Android両対応の機能（プッシュ通知、ウィジェット、ヘルスデータ連携）を統合し、最適化されたモバイル体験を提供する。Windows環境での開発を前提とする。

## アーキテクチャ

### システム構成

```
┌─────────────────────────────────────────┐
│   React Nativeアプリ                     │
│   ┌───────────────────────────────────┐ │
│   │  Presentation Layer               │ │
│   │  - Screens (React Components)     │ │
│   │  - Hooks (Custom Hooks)           │ │
│   │  - Navigation (React Navigation)  │ │
│   └───────────────────────────────────┘ │
│   ┌───────────────────────────────────┐ │
│   │  State Management                 │ │
│   │  - Redux Toolkit / Zustand        │ │
│   │  - React Query (Server State)     │ │
│   └───────────────────────────────────┘ │
│   ┌───────────────────────────────────┐ │
│   │  Domain Layer                     │ │
│   │  - Use Cases                      │ │
│   │  - Entities (TypeScript Types)    │ │
│   └───────────────────────────────────┘ │
│   ┌───────────────────────────────────┐ │
│   │  Data Layer                       │ │
│   │  - Repositories                   │ │
│   │  - Data Sources (Local/Remote)    │ │
│   │  - SQLite + AsyncStorage          │ │
│   └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
              ↓ HTTPS (MCP)
┌─────────────────────────────────────────┐
│   バックエンドAPI                         │
│   - MCP Server                          │
│   - OAuth 2.1 + PKCE                    │
│   - RESTful API                         │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│   外部サービス                            │
│   - Firebase Cloud Messaging (FCM)      │
│   - HealthKit (iOS) / Google Fit (And)  │
│   - Firebase Crashlytics                │
└─────────────────────────────────────────┘
```

### アーキテクチャパターン

**Clean Architecture + Feature-Based Structure**を採用し、レイヤー間の依存関係を明確にする。



**レイヤー構成:**

1. **Presentation Layer** - UI表示とユーザー操作
   - React Components（Screens、UI Components）
   - Custom Hooks（ビジネスロジックの抽象化）
   - React Navigation（画面遷移）

2. **State Management** - アプリケーション状態管理
   - Redux Toolkit / Zustand（グローバル状態）
   - React Query（サーバー状態、キャッシング）
   - Context API（テーマ、言語設定）

3. **Domain Layer** - ビジネスロジック
   - Use Cases（ユースケース）
   - Entities（TypeScript型定義）
   - Repository Interfaces

4. **Data Layer** - データ管理
   - Repository Implementations
   - Data Sources（Local/Remote）
   - SQLite（構造化データ）
   - AsyncStorage（設定データ）
   - Network Layer（MCP Client）

### 技術スタック

- **フレームワーク**: React Native 0.73+
- **開発プラットフォーム**: Expo SDK 50+
- **言語**: TypeScript 5.0+
- **状態管理**: Redux Toolkit / Zustand
- **サーバー状態**: React Query (TanStack Query)
- **ナビゲーション**: React Navigation 6+
- **ローカルDB**: SQLite (expo-sqlite)
- **ストレージ**: AsyncStorage (@react-native-async-storage/async-storage)
- **ネットワーク**: Axios + React Query
- **通信プロトコル**: MCP (Model Context Protocol)
- **認証**: OAuth 2.1 + PKCE、Sign in with Apple、Google Sign-In
- **セキュリティ**: expo-secure-store、react-native-keychain
- **通知**: Firebase Cloud Messaging、expo-notifications
- **ウィジェット**: react-native-widget-extension
- **Health**: react-native-health (iOS)、react-native-google-fit (Android)
- **テスト**: Jest、React Native Testing Library、Detox
- **リント**: ESLint、Prettier
- **CI/CD**: GitHub Actions、EAS Build
- **エラートラッキング**: Sentry、Firebase Crashlytics
- **デバッグ**: Flipper、React Native Debugger

## フォルダ構造

```
src/
├── app/                    # アプリエントリーポイント
│   ├── App.tsx
│   └── index.ts
├── features/               # 機能別モジュール
│   ├── auth/
│   │   ├── screens/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── store/
│   │   └── types/
│   ├── onboarding/
│   ├── quest/
│   ├── progress/
│   ├── ranking/
│   └── settings/
├── shared/                 # 共通モジュール
│   ├── components/         # 共通UIコンポーネント
│   ├── hooks/              # 共通カスタムフック
│   ├── utils/              # ユーティリティ関数
│   ├── constants/          # 定数
│   ├── types/              # 共通型定義
│   └── theme/              # テーマ設定
├── core/                   # コアロジック
│   ├── domain/             # ドメインロジック
│   │   ├── entities/
│   │   ├── usecases/
│   │   └── repositories/
│   ├── data/               # データ層
│   │   ├── repositories/
│   │   ├── datasources/
│   │   └── models/
│   └── network/            # ネットワーク層
│       ├── api/
│       ├── mcp/
│       └── interceptors/
├── navigation/             # ナビゲーション設定
│   ├── RootNavigator.tsx
│   ├── AuthNavigator.tsx
│   └── MainNavigator.tsx
├── store/                  # グローバル状態管理
│   ├── slices/
│   └── store.ts
├── services/               # 外部サービス統合
│   ├── notification/
│   ├── health/
│   ├── analytics/
│   └── crashlytics/
├── locales/                # 多言語対応
│   ├── ja/
│   ├── en/
│   └── i18n.ts
└── assets/                 # 静的リソース
    ├── images/
    ├── fonts/
    └── icons/
```



## コンポーネントとインターフェース

### 1. Presentation Layer

#### Screens（React Components）

**OnboardingScreen**
```typescript
// src/features/onboarding/screens/OnboardingScreen.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { useOnboarding } from '../hooks/useOnboarding';

export const OnboardingScreen: React.FC = () => {
  const {
    currentStep,
    goal,
    profile,
    milestones,
    isLoading,
    error,
    analyzeGoal,
    createGoal,
    createProfile,
    generateMilestones,
    completeOnboarding
  } = useOnboarding();

  // UI実装...
};
```

**HomeScreen**
```typescript
// src/features/quest/screens/HomeScreen.tsx
import React from 'react';
import { View, FlatList, RefreshControl } from 'react-native';
import { useQuests } from '../hooks/useQuests';
import { QuestCard } from '../components/QuestCard';

export const HomeScreen: React.FC = () => {
  const {
    todayQuests,
    progress,
    currentStreak,
    isLoading,
    error,
    refreshQuests
  } = useQuests();

  return (
    <View>
      <FlatList
        data={todayQuests}
        renderItem={({ item }) => <QuestCard quest={item} />}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refreshQuests} />
        }
      />
    </View>
  );
};
```

#### Custom Hooks

**useOnboarding**
```typescript
// src/features/onboarding/hooks/useOnboarding.ts
import { useState } from 'react';
import { useGoalUseCase } from '@/core/domain/usecases/GoalUseCase';
import { Goal, UserProfile, Milestone } from '@/core/domain/entities';

export const useOnboarding = () => {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('goal');
  const [goal, setGoal] = useState<Goal | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const goalUseCase = useGoalUseCase();

  const analyzeGoal = async (goalText: string) => {
    setIsLoading(true);
    try {
      const analysis = await goalUseCase.analyzeGoal(goalText);
      // 処理...
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    currentStep,
    goal,
    profile,
    milestones,
    isLoading,
    error,
    analyzeGoal,
    createGoal,
    createProfile,
    generateMilestones,
    completeOnboarding
  };
};
```

**useQuests**
```typescript
// src/features/quest/hooks/useQuests.ts
import { useQuery, useMutation } from '@tanstack/react-query';
import { useQuestUseCase } from '@/core/domain/usecases/QuestUseCase';

export const useQuests = () => {
  const questUseCase = useQuestUseCase();

  const {
    data: todayQuests = [],
    isLoading,
    error,
    refetch: refreshQuests
  } = useQuery({
    queryKey: ['todayQuests'],
    queryFn: () => questUseCase.getTodayQuests(),
    staleTime: 5 * 60 * 1000, // 5分
  });

  const completeQuestMutation = useMutation({
    mutationFn: (params: CompleteQuestParams) =>
      questUseCase.completeQuest(params),
    onSuccess: () => {
      refreshQuests();
    }
  });

  return {
    todayQuests,
    isLoading,
    error,
    refreshQuests,
    completeQuest: completeQuestMutation.mutate
  };
};
```

### 2. Domain Layer

#### Entities（TypeScript Types）

**Goal**
```typescript
// src/core/domain/entities/Goal.ts
export interface Goal {
  id: string;
  userId: string;
  title: string;
  kpi: string;
  duration: string;
  deadline?: Date;
  obstacles: string[];
  plans: string[];
  status: GoalStatus;
  createdAt: Date;
  updatedAt: Date;
}

export enum GoalStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ABANDONED = 'abandoned'
}
```

**Quest**
```typescript
// src/core/domain/entities/Quest.ts
export interface Quest {
  id: string;
  questBundleId: string;
  type: QuestType;
  title: string;
  description: string;
  estimatedTime: number;
  difficulty: Difficulty;
  completionCriteria: string;
  evidenceType: EvidenceType;
  contributesToStation: number;
  order: number;
  status: QuestStatus;
}

export enum QuestType {
  SMALL = 'small',
  MEDIUM = 'medium',
  VALIDATION = 'validation'
}

export enum Difficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  CHALLENGING = 'challenging'
}
```

**UserProgress**
```typescript
// src/core/domain/entities/UserProgress.ts
export interface UserProgress {
  userId: string;
  totalSteps: number;
  currentStreak: number;
  maxStreak: number;
  freezeDaysRemaining: number;
  lastActivityDate: Date;
  currentStation: number; // 1-10
}
```

#### Use Cases

**GoalUseCase**
```typescript
// src/core/domain/usecases/GoalUseCase.ts
import { Goal, GoalAnalysis } from '../entities';
import { GoalRepository } from '../repositories';

export class GoalUseCase {
  constructor(private goalRepository: GoalRepository) {}

  async analyzeGoal(goalText: string): Promise<GoalAnalysis> {
    return this.goalRepository.analyzeGoal(goalText);
  }

  async createGoal(goal: Goal): Promise<Goal> {
    return this.goalRepository.createGoal(goal);
  }

  async getGoal(userId: string): Promise<Goal | null> {
    return this.goalRepository.getGoal(userId);
  }

  async updateGoal(goal: Goal): Promise<Goal> {
    return this.goalRepository.updateGoal(goal);
  }
}
```

**QuestUseCase**
```typescript
// src/core/domain/usecases/QuestUseCase.ts
import { Quest, QuestAdjustments } from '../entities';
import { QuestRepository } from '../repositories';

export class QuestUseCase {
  constructor(private questRepository: QuestRepository) {}

  async getTodayQuests(): Promise<Quest[]> {
    return this.questRepository.getTodayQuests();
  }

  async generateQuests(adjustments?: QuestAdjustments): Promise<Quest[]> {
    return this.questRepository.generateQuests(adjustments);
  }

  async completeQuest(params: CompleteQuestParams): Promise<QuestLogResult> {
    return this.questRepository.completeQuest(params);
  }
}
```



### 3. Data Layer

#### Repositories

**GoalRepository**
```typescript
// src/core/data/repositories/GoalRepository.ts
import { Goal, GoalAnalysis } from '@/core/domain/entities';
import { RemoteDataSource } from '../datasources/RemoteDataSource';
import { LocalDataSource } from '../datasources/LocalDataSource';

export class GoalRepository {
  constructor(
    private remoteDataSource: RemoteDataSource,
    private localDataSource: LocalDataSource
  ) {}

  async analyzeGoal(goalText: string): Promise<GoalAnalysis> {
    return this.remoteDataSource.callTool('analyze_goal', { goalText });
  }

  async createGoal(goal: Goal): Promise<Goal> {
    const createdGoal = await this.remoteDataSource.callTool('create_goal', goal);
    await this.localDataSource.saveGoal(createdGoal);
    return createdGoal;
  }

  async getGoal(userId: string): Promise<Goal | null> {
    // オフライン対応：ローカルから取得
    const localGoal = await this.localDataSource.getGoal(userId);
    if (localGoal) return localGoal;

    // オンライン時：サーバーから取得
    try {
      const remoteGoal = await this.remoteDataSource.callTool('get_goal', { userId });
      await this.localDataSource.saveGoal(remoteGoal);
      return remoteGoal;
    } catch (error) {
      return null;
    }
  }

  async syncGoal(): Promise<void> {
    // 同期処理...
  }
}
```

#### Data Sources

**RemoteDataSource（MCP Client）**
```typescript
// src/core/data/datasources/RemoteDataSource.ts
import axios, { AxiosInstance } from 'axios';
import { TokenManager } from '@/services/auth/TokenManager';

export class RemoteDataSource {
  private client: AxiosInstance;

  constructor(
    private baseURL: string,
    private tokenManager: TokenManager
  ) {
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // リクエストインターセプター（認証トークン追加）
    this.client.interceptors.request.use(async (config) => {
      const token = await this.tokenManager.getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // レスポンスインターセプター（エラーハンドリング）
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // トークンリフレッシュ
          await this.tokenManager.refreshToken();
          return this.client.request(error.config);
        }
        throw error;
      }
    );
  }

  async callTool<T>(toolName: string, parameters: Record<string, any>): Promise<T> {
    const response = await this.client.post('/mcp/call', {
      tool: toolName,
      parameters
    });
    return response.data;
  }

  async authenticate(code: string, codeVerifier: string): Promise<AuthToken> {
    const response = await this.client.post('/auth/token', {
      code,
      code_verifier: codeVerifier,
      grant_type: 'authorization_code'
    });
    return response.data;
  }

  async refreshToken(refreshToken: string): Promise<AuthToken> {
    const response = await this.client.post('/auth/token', {
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    });
    return response.data;
  }
}
```

**LocalDataSource（SQLite + AsyncStorage）**
```typescript
// src/core/data/datasources/LocalDataSource.ts
import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Goal, Quest, UserProgress } from '@/core/domain/entities';

export class LocalDataSource {
  private db: SQLite.SQLiteDatabase;

  constructor() {
    this.db = SQLite.openDatabase('climb-you.db');
    this.initDatabase();
  }

  private async initDatabase() {
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS goals (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        kpi TEXT NOT NULL,
        duration TEXT NOT NULL,
        deadline TEXT,
        obstacles TEXT,
        plans TEXT,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS quests (
        id TEXT PRIMARY KEY,
        quest_bundle_id TEXT NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        estimated_time INTEGER NOT NULL,
        difficulty TEXT NOT NULL,
        completion_criteria TEXT NOT NULL,
        evidence_type TEXT NOT NULL,
        contributes_to_station INTEGER NOT NULL,
        order_num INTEGER NOT NULL,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        valid_until TEXT NOT NULL,
        is_synced INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS user_progress (
        user_id TEXT PRIMARY KEY,
        total_steps INTEGER NOT NULL,
        current_streak INTEGER NOT NULL,
        max_streak INTEGER NOT NULL,
        freeze_days_remaining INTEGER NOT NULL,
        last_activity_date TEXT NOT NULL,
        current_station INTEGER NOT NULL,
        updated_at TEXT NOT NULL,
        is_synced INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS quest_logs (
        id TEXT PRIMARY KEY,
        quest_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        status TEXT NOT NULL,
        actual_time INTEGER,
        skip_reason TEXT,
        skip_memo TEXT,
        obstacle TEXT,
        obstacle_details TEXT,
        contingency_plan TEXT,
        evidence_type TEXT,
        evidence_url TEXT,
        evidence_note TEXT,
        memo TEXT,
        steps_earned INTEGER NOT NULL,
        completed_at TEXT,
        created_at TEXT NOT NULL,
        is_synced INTEGER DEFAULT 0
      );
    `);
  }

  async saveGoal(goal: Goal): Promise<void> {
    await this.db.runAsync(
      `INSERT OR REPLACE INTO goals VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        goal.id,
        goal.userId,
        goal.title,
        goal.kpi,
        goal.duration,
        goal.deadline?.toISOString() || null,
        JSON.stringify(goal.obstacles),
        JSON.stringify(goal.plans),
        goal.status,
        goal.createdAt.toISOString(),
        goal.updatedAt.toISOString()
      ]
    );
  }

  async getGoal(userId: string): Promise<Goal | null> {
    const result = await this.db.getFirstAsync<any>(
      `SELECT * FROM goals WHERE user_id = ?`,
      [userId]
    );

    if (!result) return null;

    return {
      id: result.id,
      userId: result.user_id,
      title: result.title,
      kpi: result.kpi,
      duration: result.duration,
      deadline: result.deadline ? new Date(result.deadline) : undefined,
      obstacles: JSON.parse(result.obstacles),
      plans: JSON.parse(result.plans),
      status: result.status,
      createdAt: new Date(result.created_at),
      updatedAt: new Date(result.updated_at)
    };
  }

  async saveQuests(quests: Quest[]): Promise<void> {
    for (const quest of quests) {
      await this.db.runAsync(
        `INSERT OR REPLACE INTO quests VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          quest.id,
          quest.questBundleId,
          quest.type,
          quest.title,
          quest.description,
          quest.estimatedTime,
          quest.difficulty,
          quest.completionCriteria,
          quest.evidenceType,
          quest.contributesToStation,
          quest.order,
          quest.status,
          new Date().toISOString(),
          new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          0
        ]
      );
    }
  }

  async getTodayQuests(): Promise<Quest[]> {
    const results = await this.db.getAllAsync<any>(
      `SELECT * FROM quests WHERE date(valid_until) >= date('now') ORDER BY order_num`
    );

    return results.map(row => ({
      id: row.id,
      questBundleId: row.quest_bundle_id,
      type: row.type,
      title: row.title,
      description: row.description,
      estimatedTime: row.estimated_time,
      difficulty: row.difficulty,
      completionCriteria: row.completion_criteria,
      evidenceType: row.evidence_type,
      contributesToStation: row.contributes_to_station,
      order: row.order_num,
      status: row.status
    }));
  }

  // AsyncStorage for settings
  async saveSetting(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(key, value);
  }

  async getSetting(key: string): Promise<string | null> {
    return await AsyncStorage.getItem(key);
  }
}
```



### 4. モバイル固有機能の実装

#### プッシュ通知（Firebase Cloud Messaging）

**NotificationService**
```typescript
// src/services/notification/NotificationService.ts
import messaging from '@react-native-firebase/messaging';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export class NotificationService {
  async requestPermission(): Promise<boolean> {
    if (Platform.OS === 'ios') {
      const authStatus = await messaging().requestPermission();
      return authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
             authStatus === messaging.AuthorizationStatus.PROVISIONAL;
    } else {
      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    }
  }

  async getDeviceToken(): Promise<string> {
    return await messaging().getToken();
  }

  async scheduleLocalNotification(
    title: string,
    body: string,
    trigger: Date,
    identifier: string
  ): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        badge: 1
      },
      trigger: {
        date: trigger,
        repeats: true
      },
      identifier
    });
  }

  setupNotificationHandlers() {
    // フォアグラウンド通知の表示設定
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true
      })
    });

    // 通知タップ時の処理
    Notifications.addNotificationResponseReceivedListener(response => {
      const { data } = response.notification.request.content;
      this.handleNotificationAction(data);
    });

    // バックグラウンド通知の処理
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('Background message:', remoteMessage);
    });
  }

  private handleNotificationAction(data: any) {
    // ディープリンク処理
    if (data.screen) {
      // ナビゲーション処理...
    }
  }
}
```

#### ホーム画面ウィジェット

**iOS Widget（react-native-widget-extension）**
```typescript
// ios/QuestWidget/QuestWidget.swift
import WidgetKit
import SwiftUI

struct QuestWidgetEntry: TimelineEntry {
    let date: Date
    let quests: [Quest]
    let progress: UserProgress?
}

struct QuestWidgetEntryView: View {
    var entry: QuestWidgetEntry
    @Environment(\.widgetFamily) var family
    
    var body: some View {
        switch family {
        case .systemSmall:
            SmallWidgetView(entry: entry)
        case .systemMedium:
            MediumWidgetView(entry: entry)
        case .systemLarge:
            LargeWidgetView(entry: entry)
        default:
            EmptyView()
        }
    }
}

@main
struct QuestWidget: Widget {
    let kind: String = "QuestWidget"
    
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: QuestProvider()) { entry in
            QuestWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("今日のクエスト")
        .description("今日のクエストと進捗を表示します")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}
```

**Android Widget**
```kotlin
// android/app/src/main/java/com/climbYou/widget/QuestWidget.kt
class QuestWidget : AppWidgetProvider() {
    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    private fun updateAppWidget(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int
    ) {
        val views = RemoteViews(context.packageName, R.layout.quest_widget)
        
        // データ取得と表示更新
        val quests = getQuestsFromSharedPreferences(context)
        views.setTextViewText(R.id.widget_title, "今日のクエスト")
        
        // タップ時のインテント設定
        val intent = Intent(context, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(context, 0, intent, 0)
        views.setOnClickPendingIntent(R.id.widget_container, pendingIntent)
        
        appWidgetManager.updateAppWidget(appWidgetId, views)
    }
}
```

#### ヘルスデータ連携

**HealthService**
```typescript
// src/services/health/HealthService.ts
import AppleHealthKit, { HealthValue } from 'react-native-health';
import GoogleFit, { Scopes } from 'react-native-google-fit';
import { Platform } from 'react-native';

export class HealthService {
  async requestAuthorization(): Promise<boolean> {
    if (Platform.OS === 'ios') {
      return this.requestIOSAuthorization();
    } else {
      return this.requestAndroidAuthorization();
    }
  }

  private async requestIOSAuthorization(): Promise<boolean> {
    const permissions = {
      permissions: {
        read: [
          AppleHealthKit.Constants.Permissions.Steps,
          AppleHealthKit.Constants.Permissions.ActiveEnergyBurned
        ],
        write: []
      }
    };

    return new Promise((resolve) => {
      AppleHealthKit.initHealthKit(permissions, (error) => {
        resolve(!error);
      });
    });
  }

  private async requestAndroidAuthorization(): Promise<boolean> {
    const options = {
      scopes: [
        Scopes.FITNESS_ACTIVITY_READ,
        Scopes.FITNESS_BODY_READ
      ]
    };

    return new Promise((resolve) => {
      GoogleFit.authorize(options)
        .then(() => resolve(true))
        .catch(() => resolve(false));
    });
  }

  async getStepCount(date: Date): Promise<number> {
    if (Platform.OS === 'ios') {
      return this.getIOSStepCount(date);
    } else {
      return this.getAndroidStepCount(date);
    }
  }

  private async getIOSStepCount(date: Date): Promise<number> {
    const options = {
      date: date.toISOString(),
      includeManuallyAdded: false
    };

    return new Promise((resolve) => {
      AppleHealthKit.getStepCount(options, (error, results: HealthValue) => {
        if (error) {
          resolve(0);
        } else {
          resolve(results.value);
        }
      });
    });
  }

  private async getAndroidStepCount(date: Date): Promise<number> {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const options = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    };

    const result = await GoogleFit.getDailyStepCountSamples(options);
    if (result && result.length > 0) {
      return result[0].steps.reduce((sum, step) => sum + step.value, 0);
    }
    return 0;
  }
}
```



## 状態管理

### Redux Toolkit

**Store設定**
```typescript
// src/store/store.ts
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import questReducer from './slices/questSlice';
import progressReducer from './slices/progressSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    quest: questReducer,
    progress: progressReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST']
      }
    })
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

**Auth Slice**
```typescript
// src/store/slices/authSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  accessToken: null,
  refreshToken: null
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{
      user: User;
      accessToken: string;
      refreshToken: string;
    }>) => {
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
    }
  }
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
```

### React Query（サーバー状態管理）

**Query Client設定**
```typescript
// src/app/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5分
      cacheTime: 10 * 60 * 1000, // 10分
      retry: 3,
      refetchOnWindowFocus: false
    }
  }
});
```

**クエリフック**
```typescript
// src/features/quest/hooks/useQuestsQuery.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { questService } from '@/services/quest/QuestService';

export const useQuestsQuery = () => {
  const queryClient = useQueryClient();

  const questsQuery = useQuery({
    queryKey: ['quests', 'today'],
    queryFn: () => questService.getTodayQuests(),
    staleTime: 5 * 60 * 1000
  });

  const completeQuestMutation = useMutation({
    mutationFn: questService.completeQuest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quests'] });
      queryClient.invalidateQueries({ queryKey: ['progress'] });
    }
  });

  return {
    quests: questsQuery.data ?? [],
    isLoading: questsQuery.isLoading,
    error: questsQuery.error,
    refetch: questsQuery.refetch,
    completeQuest: completeQuestMutation.mutate
  };
};
```

## ナビゲーション

### React Navigation設定

**RootNavigator**
```typescript
// src/navigation/RootNavigator.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';

export const RootNavigator: React.FC = () => {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};
```

**MainNavigator（タブナビゲーション）**
```typescript
// src/navigation/MainNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '@/features/quest/screens/HomeScreen';
import { ProgressScreen } from '@/features/progress/screens/ProgressScreen';
import { RankingScreen } from '@/features/ranking/screens/RankingScreen';
import { SettingsScreen } from '@/features/settings/screens/SettingsScreen';
import Icon from 'react-native-vector-icons/Ionicons';

const Tab = createBottomTabNavigator();

export const MainNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Progress':
              iconName = focused ? 'trending-up' : 'trending-up-outline';
              break;
            case 'Ranking':
              iconName = focused ? 'trophy' : 'trophy-outline';
              break;
            case 'Settings':
              iconName = focused ? 'settings' : 'settings-outline';
              break;
            default:
              iconName = 'circle';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray'
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'ホーム' }} />
      <Tab.Screen name="Progress" component={ProgressScreen} options={{ title: '進捗' }} />
      <Tab.Screen name="Ranking" component={RankingScreen} options={{ title: 'ランキング' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: '設定' }} />
    </Tab.Navigator>
  );
};
```

## セキュリティ実装

### 認証とトークン管理

**TokenManager**
```typescript
// src/services/auth/TokenManager.ts
import * as SecureStore from 'expo-secure-store';

export class TokenManager {
  private static ACCESS_TOKEN_KEY = 'access_token';
  private static REFRESH_TOKEN_KEY = 'refresh_token';

  async saveTokens(accessToken: string, refreshToken: string): Promise<void> {
    await SecureStore.setItemAsync(TokenManager.ACCESS_TOKEN_KEY, accessToken);
    await SecureStore.setItemAsync(TokenManager.REFRESH_TOKEN_KEY, refreshToken);
  }

  async getAccessToken(): Promise<string | null> {
    return await SecureStore.getItemAsync(TokenManager.ACCESS_TOKEN_KEY);
  }

  async getRefreshToken(): Promise<string | null> {
    return await SecureStore.getItemAsync(TokenManager.REFRESH_TOKEN_KEY);
  }

  async deleteTokens(): Promise<void> {
    await SecureStore.deleteItemAsync(TokenManager.ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(TokenManager.REFRESH_TOKEN_KEY);
  }

  async refreshToken(): Promise<{ accessToken: string; refreshToken: string }> {
    const refreshToken = await this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    // リフレッシュトークンでアクセストークンを更新
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken })
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    await this.saveTokens(data.access_token, data.refresh_token);

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token
    };
  }
}
```

### 生体認証

**BiometricAuth**
```typescript
// src/services/auth/BiometricAuth.ts
import * as LocalAuthentication from 'expo-local-authentication';

export class BiometricAuth {
  async isAvailable(): Promise<boolean> {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    return hasHardware && isEnrolled;
  }

  async authenticate(): Promise<boolean> {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'ログインするには認証が必要です',
      fallbackLabel: 'パスコードを使用',
      cancelLabel: 'キャンセル'
    });

    return result.success;
  }

  async getSupportedTypes(): Promise<string[]> {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    return types.map(type => {
      switch (type) {
        case LocalAuthentication.AuthenticationType.FINGERPRINT:
          return 'Fingerprint';
        case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
          return 'Face ID';
        case LocalAuthentication.AuthenticationType.IRIS:
          return 'Iris';
        default:
          return 'Unknown';
      }
    });
  }
}
```



## エラーハンドリング

### エラー定義

```typescript
// src/shared/errors/AppError.ts
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NetworkError extends AppError {
  constructor(message: string, statusCode?: number) {
    super(message, 'NETWORK_ERROR', statusCode);
    this.name = 'NetworkError';
  }
}

export class AuthError extends AppError {
  constructor(message: string) {
    super(message, 'AUTH_ERROR', 401);
    this.name = 'AuthError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}
```

### エラーハンドリング戦略

```typescript
// src/shared/hooks/useErrorHandler.ts
import { useCallback } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { NetworkError, AuthError, ValidationError } from '@/shared/errors';

export const useErrorHandler = () => {
  const { t } = useTranslation();

  const handleError = useCallback((error: Error) => {
    if (error instanceof NetworkError) {
      Alert.alert(
        t('error.network_error'),
        t('error.check_connection'),
        [{ text: t('common.ok') }]
      );
    } else if (error instanceof AuthError) {
      Alert.alert(
        t('error.auth_error'),
        t('error.please_login_again'),
        [{ text: t('common.ok'), onPress: () => {
          // ログイン画面に遷移
        }}]
      );
    } else if (error instanceof ValidationError) {
      Alert.alert(
        t('error.validation_error'),
        error.message,
        [{ text: t('common.ok') }]
      );
    } else {
      Alert.alert(
        t('error.unknown_error'),
        t('error.try_again'),
        [{ text: t('common.ok') }]
      );
    }
  }, [t]);

  return { handleError };
};
```

## テスト戦略

### 単体テスト（Jest）

**UseCaseのテスト**
```typescript
// src/core/domain/usecases/__tests__/QuestUseCase.test.ts
import { QuestUseCase } from '../QuestUseCase';
import { QuestRepository } from '../../repositories/QuestRepository';

jest.mock('../../repositories/QuestRepository');

describe('QuestUseCase', () => {
  let questUseCase: QuestUseCase;
  let mockQuestRepository: jest.Mocked<QuestRepository>;

  beforeEach(() => {
    mockQuestRepository = new QuestRepository() as jest.Mocked<QuestRepository>;
    questUseCase = new QuestUseCase(mockQuestRepository);
  });

  describe('getTodayQuests', () => {
    it('should return today quests successfully', async () => {
      const mockQuests = [
        { id: '1', title: 'Quest 1', type: 'small' },
        { id: '2', title: 'Quest 2', type: 'medium' }
      ];

      mockQuestRepository.getTodayQuests.mockResolvedValue(mockQuests);

      const result = await questUseCase.getTodayQuests();

      expect(result).toEqual(mockQuests);
      expect(mockQuestRepository.getTodayQuests).toHaveBeenCalledTimes(1);
    });

    it('should throw error when repository fails', async () => {
      mockQuestRepository.getTodayQuests.mockRejectedValue(
        new Error('Network error')
      );

      await expect(questUseCase.getTodayQuests()).rejects.toThrow('Network error');
    });
  });
});
```

### コンポーネントテスト（React Native Testing Library）

**画面コンポーネントのテスト**
```typescript
// src/features/quest/screens/__tests__/HomeScreen.test.tsx
import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import { HomeScreen } from '../HomeScreen';
import { useQuests } from '../../hooks/useQuests';

jest.mock('../../hooks/useQuests');

describe('HomeScreen', () => {
  const mockUseQuests = useQuests as jest.MockedFunction<typeof useQuests>;

  beforeEach(() => {
    mockUseQuests.mockReturnValue({
      todayQuests: [
        { id: '1', title: 'Quest 1', description: 'Description 1' },
        { id: '2', title: 'Quest 2', description: 'Description 2' }
      ],
      isLoading: false,
      error: null,
      refreshQuests: jest.fn()
    });
  });

  it('should render quest list', async () => {
    const { getByText } = render(<HomeScreen />);

    await waitFor(() => {
      expect(getByText('Quest 1')).toBeTruthy();
      expect(getByText('Quest 2')).toBeTruthy();
    });
  });

  it('should show loading indicator when loading', () => {
    mockUseQuests.mockReturnValue({
      todayQuests: [],
      isLoading: true,
      error: null,
      refreshQuests: jest.fn()
    });

    const { getByTestId } = render(<HomeScreen />);
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  it('should call refreshQuests when pull to refresh', async () => {
    const mockRefresh = jest.fn();
    mockUseQuests.mockReturnValue({
      todayQuests: [],
      isLoading: false,
      error: null,
      refreshQuests: mockRefresh
    });

    const { getByTestId } = render(<HomeScreen />);
    const flatList = getByTestId('quest-list');

    fireEvent(flatList, 'refresh');

    expect(mockRefresh).toHaveBeenCalled();
  });
});
```

### E2Eテスト（Detox）

**オンボーディングフローのテスト**
```typescript
// e2e/onboarding.test.ts
describe('Onboarding Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should complete onboarding successfully', async () => {
    // 目標入力
    await element(by.id('goal-input')).typeText('TOEIC 800点を取得する');
    await element(by.id('next-button')).tap();

    // 障害入力
    await waitFor(element(by.text('障害を特定')))
      .toBeVisible()
      .withTimeout(2000);
    await element(by.id('obstacle-input')).typeText('時間がない');
    await element(by.id('next-button')).tap();

    // マイルストーン生成
    await waitFor(element(by.text('マイルストーン')))
      .toBeVisible()
      .withTimeout(5000);
    await element(by.id('complete-button')).tap();

    // ホーム画面に遷移
    await waitFor(element(by.text('今日のクエスト')))
      .toBeVisible()
      .withTimeout(2000);
  });
});
```

## パフォーマンス最適化

### メモリ管理

**画像キャッシング**
```typescript
// src/shared/utils/ImageCache.ts
import { Image } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { sha256 } from 'react-native-sha256';

export class ImageCache {
  private static cacheDir = `${FileSystem.cacheDirectory}images/`;

  static async getCachedImage(uri: string): Promise<string | null> {
    const filename = await sha256(uri);
    const path = `${this.cacheDir}${filename}`;

    const fileInfo = await FileSystem.getInfoAsync(path);
    if (fileInfo.exists) {
      return path;
    }

    return null;
  }

  static async cacheImage(uri: string): Promise<string> {
    const filename = await sha256(uri);
    const path = `${this.cacheDir}${filename}`;

    // ディレクトリ作成
    await FileSystem.makeDirectoryAsync(this.cacheDir, { intermediates: true });

    // ダウンロード
    const downloadResult = await FileSystem.downloadAsync(uri, path);
    return downloadResult.uri;
  }

  static async clearCache(): Promise<void> {
    await FileSystem.deleteAsync(this.cacheDir, { idempotent: true });
  }
}
```

**遅延読み込み**
```typescript
// src/shared/components/LazyImage.tsx
import React, { useState, useEffect } from 'react';
import { Image, ActivityIndicator, View } from 'react-native';
import { ImageCache } from '@/shared/utils/ImageCache';

interface LazyImageProps {
  uri: string;
  style?: any;
}

export const LazyImage: React.FC<LazyImageProps> = ({ uri, style }) => {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadImage();
  }, [uri]);

  const loadImage = async () => {
    try {
      // キャッシュから取得
      let cachedUri = await ImageCache.getCachedImage(uri);

      if (!cachedUri) {
        // キャッシュにない場合はダウンロード
        cachedUri = await ImageCache.cacheImage(uri);
      }

      setImageUri(cachedUri);
    } catch (error) {
      console.error('Image loading error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[style, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator />
      </View>
    );
  }

  return <Image source={{ uri: imageUri || uri }} style={style} />;
};
```



## アクセシビリティ実装

### スクリーンリーダー対応

```typescript
// src/shared/components/AccessibleButton.tsx
import React from 'react';
import { TouchableOpacity, Text, AccessibilityProps } from 'react-native';

interface AccessibleButtonProps extends AccessibilityProps {
  onPress: () => void;
  title: string;
  disabled?: boolean;
}

export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  onPress,
  title,
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
  ...accessibilityProps
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      {...accessibilityProps}
    >
      <Text>{title}</Text>
    </TouchableOpacity>
  );
};
```

### 動的テキストサイズ対応

```typescript
// src/shared/theme/typography.ts
import { Platform, PixelRatio } from 'react-native';

const scale = (size: number) => {
  const ratio = PixelRatio.getFontScale();
  return size * ratio;
};

export const typography = {
  h1: {
    fontSize: scale(32),
    fontWeight: 'bold' as const,
    lineHeight: scale(40)
  },
  h2: {
    fontSize: scale(24),
    fontWeight: 'bold' as const,
    lineHeight: scale(32)
  },
  body: {
    fontSize: scale(16),
    lineHeight: scale(24)
  },
  caption: {
    fontSize: scale(12),
    lineHeight: scale(16)
  }
};
```

## 多言語対応（i18n）

### react-i18next設定

**i18n設定**
```typescript
// src/locales/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import ja from './ja/translation.json';
import en from './en/translation.json';

const LANGUAGE_KEY = 'app_language';

const initI18n = async () => {
  const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
  const deviceLanguage = Localization.locale.split('-')[0];

  i18n
    .use(initReactI18next)
    .init({
      resources: {
        ja: { translation: ja },
        en: { translation: en }
      },
      lng: savedLanguage || deviceLanguage || 'en',
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false
      }
    });
};

export const changeLanguage = async (language: string) => {
  await AsyncStorage.setItem(LANGUAGE_KEY, language);
  await i18n.changeLanguage(language);
};

initI18n();

export default i18n;
```

**翻訳ファイル**
```json
// src/locales/ja/translation.json
{
  "common": {
    "app_name": "climb-you",
    "ok": "OK",
    "cancel": "キャンセル",
    "save": "保存",
    "delete": "削除",
    "loading": "読み込み中..."
  },
  "auth": {
    "login": "ログイン",
    "logout": "ログアウト",
    "sign_in_with_apple": "Appleでサインイン",
    "sign_in_with_google": "Googleでサインイン"
  },
  "quest": {
    "today_quests": "今日のクエスト",
    "complete": "完了",
    "skip": "見送り",
    "estimated_time": "所要時間：{{time}}分"
  },
  "progress": {
    "current_station": "現在：{{station}}合目",
    "total_steps": "累計：{{steps}}歩",
    "current_streak": "{{days}}日連続"
  }
}
```

**使用例**
```typescript
// src/features/quest/screens/HomeScreen.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';

export const HomeScreen: React.FC = () => {
  const { t } = useTranslation();

  return (
    <View>
      <Text>{t('quest.today_quests')}</Text>
      <Text>{t('quest.estimated_time', { time: 30 })}</Text>
    </View>
  );
};
```

## CI/CD パイプライン

### GitHub Actions設定

**.github/workflows/mobile.yml**
```yaml
name: Mobile CI/CD

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Run type check
        run: npm run type-check
      
      - name: Run tests
        run: npm test -- --coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  build-ios:
    runs-on: macos-latest
    needs: test
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Setup Expo
        uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build iOS
        run: eas build --platform ios --non-interactive

  build-android:
    runs-on: ubuntu-latest
    needs: test
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Setup Expo
        uses: expo/expo-github-action@v8
        with:
          expo-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build Android
        run: eas build --platform android --non-interactive
```

## ストア提出準備

### EAS Build設定

**eas.json**
```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "production": {
      "ios": {
        "bundleIdentifier": "com.climbYou.mobile"
      },
      "android": {
        "buildType": "apk"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "1234567890",
        "appleTeamId": "ABCDE12345"
      },
      "android": {
        "serviceAccountKeyPath": "./service-account-key.json",
        "track": "internal"
      }
    }
  }
}
```

### App Store Connect設定

**必要な情報:**
- アプリ名: climb-you
- バンドルID: com.climbYou.mobile
- プライバシーポリシーURL
- 利用規約URL
- サポートURL

**スクリーンショット要件:**
- iPhone 6.7" (1290 x 2796)
- iPhone 6.5" (1242 x 2688)
- iPad Pro 12.9" (2048 x 2732)

### Google Play Console設定

**必要な情報:**
- アプリ名: climb-you
- パッケージ名: com.climbYou.mobile
- プライバシーポリシーURL
- 利用規約URL

**スクリーンショット要件:**
- Phone (1080 x 1920)
- 7-inch Tablet (1200 x 1920)
- 10-inch Tablet (1600 x 2560)

## まとめ

本設計書では、climb-youのReact Nativeモバイルアプリケーションの技術的な実装方針を定義した。Clean Architecture + Feature-Based Structureを採用し、React Native + Expoでクロスプラットフォーム開発を実現する。SQLite + AsyncStorageによるオフライン対応、MCPによるバックエンド通信、iOS/Android両対応の機能（プッシュ通知、ウィジェット、ヘルスデータ連携）の統合により、最適化されたモバイル体験を提供する。

Windows環境での開発を前提とし、セキュリティ、パフォーマンス、アクセシビリティ、多言語対応を考慮した実装を行う。テスト戦略とCI/CDパイプラインにより、品質の高いアプリケーションを継続的にリリースする。

