# プロジェクト構造：Clean Architecture + Feature-Based

## 概要

climb-youモバイルアプリケーションは、**Clean Architecture**と**Feature-Based Structure**を組み合わせた構成で実装されています。

## フォルダ構成

```
mobile/
├── src/
│   ├── app/                        # アプリエントリーポイント
│   │   ├── App.tsx                 # ルートコンポーネント
│   │   └── index.ts
│   │
│   ├── features/                   # 機能別モジュール（Feature-Based）
│   │   ├── auth/                   # 認証機能
│   │   │   ├── screens/            # 画面コンポーネント
│   │   │   ├── components/         # 機能固有コンポーネント
│   │   │   ├── hooks/              # 機能固有カスタムフック
│   │   │   ├── store/              # 機能固有状態管理
│   │   │   ├── types/              # 型定義
│   │   │   └── index.ts
│   │   ├── onboarding/             # オンボーディング機能
│   │   ├── quest/                  # クエスト機能
│   │   ├── progress/               # 進捗管理機能
│   │   ├── ranking/                # ランキング機能
│   │   ├── settings/               # 設定機能
│   │   └── index.ts
│   │
│   ├── shared/                     # 共通モジュール
│   │   ├── components/             # 共通UIコンポーネント
│   │   ├── hooks/                  # 共通カスタムフック
│   │   ├── utils/                  # ユーティリティ関数
│   │   ├── constants/              # アプリケーション定数
│   │   ├── types/                  # 共通型定義
│   │   ├── theme/                  # テーマ設定（色、タイポグラフィ等）
│   │   └── index.ts
│   │
│   ├── core/                       # コアロジック（Clean Architecture）
│   │   ├── domain/                 # ドメインレイヤー（ビジネスロジック）
│   │   │   ├── entities/           # エンティティ（ビジネスオブジェクト）
│   │   │   ├── usecases/           # ユースケース（ビジネスロジック）
│   │   │   ├── repositories/       # リポジトリインターフェース
│   │   │   └── index.ts
│   │   ├── data/                   # データレイヤー
│   │   │   ├── repositories/       # リポジトリ実装
│   │   │   ├── datasources/        # データソース（リモート/ローカル）
│   │   │   ├── models/             # データモデル（DTO）
│   │   │   └── index.ts
│   │   ├── network/                # ネットワークレイヤー
│   │   │   ├── api/                # APIクライアント設定
│   │   │   ├── mcp/                # MCPクライアント
│   │   │   ├── interceptors/       # Axiosインターセプター
│   │   │   └── index.ts
│   │   └── index.ts
│   │
│   ├── navigation/                 # ナビゲーション設定
│   │   ├── RootNavigator.tsx
│   │   ├── AuthNavigator.tsx
│   │   ├── MainNavigator.tsx
│   │   └── index.ts
│   │
│   ├── store/                      # グローバル状態管理
│   │   ├── slices/                 # Redux Slices / Zustand Stores
│   │   ├── store.ts
│   │   └── index.ts
│   │
│   ├── services/                   # 外部サービス統合
│   │   ├── notification/           # プッシュ通知サービス
│   │   ├── health/                 # ヘルスデータ連携
│   │   ├── analytics/              # アナリティクス
│   │   ├── crashlytics/            # クラッシュレポート
│   │   └── index.ts
│   │
│   ├── locales/                    # 多言語対応
│   │   ├── ja/                     # 日本語翻訳
│   │   ├── en/                     # 英語翻訳
│   │   ├── i18n.ts
│   │   └── index.ts
│   │
│   └── assets/                     # 静的リソース
│       ├── images/
│       ├── fonts/
│       └── icons/
│
├── app.json                        # Expo設定
├── package.json                    # npm依存管理
├── tsconfig.json                   # TypeScript設定
└── PROJECT_STRUCTURE.md            # このファイル
```

## アーキテクチャレイヤー

### 1. **Presentation Layer（プレゼンテーション層）**
- **所在**: `src/features/*/screens`, `src/shared/components`
- **責務**: UIの表示とユーザー操作の処理
- **例**: Screen コンポーネント、UI コンポーネント、Custom Hooks

### 2. **State Management Layer（状態管理層）**
- **所在**: `src/store`, `src/features/*/store`
- **責務**: グローバル/ローカル状態の管理
- **技術**: Redux Toolkit / Zustand, React Query

### 3. **Domain Layer（ドメイン層）**
- **所在**: `src/core/domain`
- **責務**: ビジネスロジック、エンティティ、ユースケース
- **特徴**: 外部依存がない（フレームワーク非依存）
- **構成**:
  - `entities/`: Goal, Quest, UserProgress などのビジネスオブジェクト
  - `usecases/`: ビジネスロジック（GoalUseCase, QuestUseCase など）
  - `repositories/`: リポジトリインターフェース（契約）

### 4. **Data Layer（データレイヤー）**
- **所在**: `src/core/data`
- **責務**: データアクセスの実装
- **構成**:
  - `repositories/`: ドメインのリポジトリインターフェースを実装
  - `datasources/`: RemoteDataSource（API/MCP）、LocalDataSource（SQLite/AsyncStorage）
  - `models/`: データ転送オブジェクト（DTO）

### 5. **Network Layer（ネットワーク層）**
- **所在**: `src/core/network`
- **責務**: APIやMCP通信
- **構成**:
  - `api/`: Axiosインスタンス設定
  - `mcp/`: MCPクライアント実装
  - `interceptors/`: リクエスト/レスポンスインターセプター

### 6. **Services Layer（サービス層）**
- **所在**: `src/services`
- **責務**: 外部サービス統合（Firebase, HealthKit, など）
- **例**: NotificationService, HealthService, AnalyticsService

## Feature-Based Structure

各機能（Feature）は自己完結した構造で実装されます：

```
features/quest/
├── screens/          # 画面コンポーネント（QuestListScreen, QuestDetailScreen など）
├── components/       # Quest固有のコンポーネント（QuestCard, QuestTimer など）
├── hooks/           # Quest固有のカスタムフック（useQuests, useQuestCompletion など）
├── store/           # Quest固有の状態管理（Redux Slice または Zustand Store）
├── types/           # Quest機能の型定義
└── index.ts         # 公開インターフェース
```

**利点**:
- 機能ごとに独立した開発が可能
- 機能の追加・削除が容易
- テストがしやすい
- チーム開発で競合が少ない

## TypeScript パスエイリアス

相対パスの代わりに、短いエイリアスパスを使用可能：

```typescript
// ❌ 相対パス（推奨しない）
import { useQuests } from '../../../core/domain/usecases';

// ✅ エイリアスパス（推奨）
import { useQuests } from '@/core/domain/usecases';
```

設定は `tsconfig.json` に記載：
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

## 依存関係フロー

```
Presentation Layer
    ↓
State Management Layer (Redux/Zustand/React Query)
    ↓
Domain Layer (Use Cases)
    ↓
Data Layer (Repositories)
    ↓
Network Layer + Services
    ↓
External APIs (Backend, Firebase, HealthKit, etc.)
```

**重要**: 依存関係は**一方向**に流れます。上位レイヤーは下位レイヤーに依存しますが、逆はありません。

## 実装時のガイドライン

### 1. エンティティの定義（Domain層）
```typescript
// src/core/domain/entities/Quest.ts
export interface Quest {
  id: string;
  title: string;
  description: string;
  estimatedTime: number;
  status: 'pending' | 'completed' | 'skipped';
}
```

### 2. リポジトリインターフェースの定義（Domain層）
```typescript
// src/core/domain/repositories/IQuestRepository.ts
export interface IQuestRepository {
  getTodayQuests(): Promise<Quest[]>;
  completeQuest(id: string): Promise<void>;
}
```

### 3. ユースケースの実装（Domain層）
```typescript
// src/core/domain/usecases/QuestUseCase.ts
export class QuestUseCase {
  constructor(private repository: IQuestRepository) {}

  async getTodayQuests(): Promise<Quest[]> {
    return this.repository.getTodayQuests();
  }
}
```

### 4. リポジトリの実装（Data層）
```typescript
// src/core/data/repositories/QuestRepository.ts
export class QuestRepository implements IQuestRepository {
  constructor(
    private remoteDataSource: RemoteDataSource,
    private localDataSource: LocalDataSource
  ) {}

  async getTodayQuests(): Promise<Quest[]> {
    // ローカルから取得、なければリモートから取得
  }
}
```

### 5. カスタムフックの実装（Feature層）
```typescript
// src/features/quest/hooks/useQuests.ts
export const useQuests = () => {
  const questUseCase = useQuestUseCase();

  const { data: quests, isLoading } = useQuery({
    queryKey: ['quests'],
    queryFn: () => questUseCase.getTodayQuests()
  });

  return { quests, isLoading };
};
```

### 6. スクリーンの実装（Feature層）
```typescript
// src/features/quest/screens/HomeScreen.tsx
export const HomeScreen: React.FC = () => {
  const { quests, isLoading } = useQuests();

  return (
    <View>
      <FlatList
        data={quests}
        renderItem={({ item }) => <QuestCard quest={item} />}
      />
    </View>
  );
};
```

## 次のステップ

次のタスク（1.3）では、SQLite と AsyncStorage のセットアップを行います：
- Expo SQLite の初期化
- AsyncStorage の設定
- データベーススキーマの定義
- マイグレーション機構の構築

---

**作成日**: 2025-10-22
**タスク**: 1.2 プロジェクト構造の構築（Clean Architecture + Feature-Based Structure）
**ステータス**: ✅ 完了
