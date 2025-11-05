# Implementation Plan: Tasks 4.2-4.4 Complete Implementation

**Plan ID**: IMPL-001  
**Date**: 2025-10-23  
**Status**: 🟡 Ready to Start  
**Priority**: High  
**Estimated Time**: 6-8 hours

---

## 📋 Overview

タスク4.2〜4.4の**完全実装**を行います。現在はUI層のみ実装されており、Clean Architectureに従ったドメイン層とデータ層が不足しています。

---

## 🎯 Goals

1. ✅ Clean Architectureの原則に従った実装
2. ✅ ドメイン層（UseCase、Repository Interface）の実装
3. ✅ データ層（Repository実装、LocalDataSource拡張）の実装
4. ✅ データ永続化（SQLite）の実装
5. ✅ OnboardingScreenのリファクタリング
6. ✅ テスト環境の修正

---

## 📊 Current Status

### ✅ 実装済み
- UI層（OnboardingScreen、各ステップコンポーネント）
- MCPClient統合
- プロファイル変換ユーティリティ
- マイルストーン変換ユーティリティ
- ナビゲーション制御

### ❌ 未実装
- ドメイン層（UseCase、Repository Interface）
- データ層（Repository実装、LocalDataSource拡張）
- データ永続化（SQLite）
- テスト環境修正

---

## 🗂️ Implementation Phases

### Phase 1: アーキテクチャ基盤（2-3時間）

#### 1.1 ドメイン層 - リポジトリインターフェース

**ファイル:**
```
mobile/src/core/domain/repositories/
├── GoalRepository.ts          (新規作成)
├── MilestoneRepository.ts     (新規作成)
├── ProfileRepository.ts       (新規作成)
└── index.ts                   (新規作成)
```

**実装内容:**
- `GoalRepository` インターフェース定義
- `MilestoneRepository` インターフェース定義
- `ProfileRepository` インターフェース定義

**参照:**
- [ARCHITECTURE_ISSUE_REPOSITORY_PATTERN.md](ARCHITECTURE_ISSUE_REPOSITORY_PATTERN.md) - Option A

#### 1.2 ドメイン層 - ユースケース

**ファイル:**
```
mobile/src/core/domain/usecases/
├── GoalUseCase.ts            (新規作成)
├── MilestoneUseCase.ts       (新規作成)
├── ProfileUseCase.ts         (新規作成)
└── index.ts                  (更新)
```

**実装内容:**
- `GoalUseCase` クラス実装
- `MilestoneUseCase` クラス実装
- `ProfileUseCase` クラス実装

**参照:**
- `.kiro/specs/mobile-app/design.md` - Use Cases セクション

---

### Phase 2: データ層実装（2-3時間）

#### 2.1 データベーススキーマ

**ファイル:**
```
mobile/src/core/data/schemas/
├── GoalSchema.ts             (新規作成)
├── MilestoneSchema.ts        (新規作成)
├── ProfileSchema.ts          (新規作成)
└── index.ts                  (新規作成)
```

**実装内容:**
- `milestones` テーブルスキーマ
- `user_profiles` テーブルスキーマ
- `goals` テーブルスキーマ（既存の確認）

**参照:**
- [ARCHITECTURE_ISSUE_MOBILE_DATABASE.md](ARCHITECTURE_ISSUE_MOBILE_DATABASE.md)

#### 2.2 データモデル＆マッパー

**ファイル:**
```
mobile/src/core/data/models/
├── GoalModel.ts              (新規作成)
├── MilestoneModel.ts         (新規作成)
├── ProfileModel.ts           (新規作成)
└── index.ts                  (更新)
```

**実装内容:**
- データモデル型定義
- ドメインエンティティ ↔ データモデル変換マッパー

#### 2.3 LocalDataSource拡張

**ファイル:**
```
mobile/src/core/data/datasources/LocalDataSource.ts (更新)
```

**追加メソッド:**
```typescript
// Goals
async saveGoal(goal: GoalModel): Promise<void>;
async getGoal(id: string): Promise<GoalModel | null>;
async updateGoal(goal: GoalModel): Promise<void>;
async deleteGoal(id: string): Promise<void>;
async getUserGoals(userId: string): Promise<GoalModel[]>;

// Milestones
async saveMilestone(milestone: MilestoneModel): Promise<void>;
async getMilestone(id: string): Promise<MilestoneModel | null>;
async updateMilestone(milestone: MilestoneModel): Promise<void>;
async deleteMilestone(id: string): Promise<void>;
async getGoalMilestones(goalId: string): Promise<MilestoneModel[]>;
async saveMilestones(milestones: MilestoneModel[]): Promise<void>;

// Profiles
async saveProfile(profile: ProfileModel): Promise<void>;
async getProfile(userId: string): Promise<ProfileModel | null>;
async updateProfile(profile: ProfileModel): Promise<void>;
async deleteProfile(userId: string): Promise<void>;
```

#### 2.4 DatabaseManager更新

**ファイル:**
```
mobile/src/core/data/DatabaseManager.ts (更新)
```

**更新内容:**
- `initializeDatabase()` メソッドに新しいテーブル追加
- `milestones` テーブル作成
- `user_profiles` テーブル作成

#### 2.5 リポジトリ実装

**ファイル:**
```
mobile/src/core/data/repositories/
├── GoalRepositoryImpl.ts      (新規作成)
├── MilestoneRepositoryImpl.ts (新規作成)
├── ProfileRepositoryImpl.ts   (新規作成)
└── index.ts                   (新規作成)
```

**実装内容:**
- リポジトリインターフェースの実装
- LocalDataSourceとMCPClientの統合
- データ永続化ロジック

---

### Phase 3: UI層リファクタリング（1-2時間）

#### 3.1 カスタムフック作成

**ファイル:**
```
mobile/src/features/onboarding/hooks/
├── useGoalUseCase.ts         (新規作成)
├── useMilestoneUseCase.ts    (新規作成)
├── useProfileUseCase.ts      (新規作成)
└── index.ts                  (新規作成)
```

**実装内容:**
- DIコンテナからUseCaseを取得するフック
- メモ化による最適化

#### 3.2 OnboardingScreenリファクタリング

**ファイル:**
```
mobile/src/features/onboarding/screens/OnboardingScreen.tsx (更新)
```

**変更内容:**
- 直接MCPClientを使用している箇所を、UseCaseを使用するように変更
- カスタムフックの使用

**Before:**
```typescript
const mcpClient = new MCPClient();
const analysis = await mcpClient.analyzeGoal(goalText, context);
```

**After:**
```typescript
const goalUseCase = useGoalUseCase();
const analysis = await goalUseCase.analyzeGoal(goalText, context);
```

---

### Phase 4: テスト修正（1時間）

#### 4.1 依存関係修正

**ファイル:**
```
mobile/package.json (更新)
```

**追加:**
```json
{
  "devDependencies": {
    "react-test-renderer": "^18.2.0"
  }
}
```

**コマンド:**
```bash
cd mobile
npm install react-test-renderer --save-dev
```

#### 4.2 テスト実行

```bash
cd mobile
npm test
```

**期待結果:**
- 13個の失敗しているテストスイートが修正される
- すべてのテストが合格する

---

## 📁 File Structure (After Implementation)

```
mobile/src/
├── core/
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── Goal.ts
│   │   │   ├── Milestone.ts
│   │   │   ├── User.ts
│   │   │   └── index.ts
│   │   ├── repositories/              ← 新規
│   │   │   ├── GoalRepository.ts      ← 新規
│   │   │   ├── MilestoneRepository.ts ← 新規
│   │   │   ├── ProfileRepository.ts   ← 新規
│   │   │   └── index.ts               ← 新規
│   │   └── usecases/
│   │       ├── GoalUseCase.ts         ← 新規
│   │       ├── MilestoneUseCase.ts    ← 新規
│   │       ├── ProfileUseCase.ts      ← 新規
│   │       └── index.ts               ← 更新
│   └── data/
│       ├── schemas/                    ← 新規
│       │   ├── GoalSchema.ts          ← 新規
│       │   ├── MilestoneSchema.ts     ← 新規
│       │   ├── ProfileSchema.ts       ← 新規
│       │   └── index.ts               ← 新規
│       ├── models/
│       │   ├── GoalModel.ts           ← 新規
│       │   ├── MilestoneModel.ts      ← 新規
│       │   ├── ProfileModel.ts        ← 新規
│       │   └── index.ts               ← 更新
│       ├── repositories/               ← 新規
│       │   ├── GoalRepositoryImpl.ts  ← 新規
│       │   ├── MilestoneRepositoryImpl.ts ← 新規
│       │   ├── ProfileRepositoryImpl.ts   ← 新規
│       │   └── index.ts               ← 新規
│       ├── datasources/
│       │   └── LocalDataSource.ts     ← 更新
│       └── DatabaseManager.ts         ← 更新
└── features/
    └── onboarding/
        ├── hooks/
        │   ├── useGoalUseCase.ts      ← 新規
        │   ├── useMilestoneUseCase.ts ← 新規
        │   ├── useProfileUseCase.ts   ← 新規
        │   └── index.ts               ← 新規
        └── screens/
            └── OnboardingScreen.tsx   ← 更新
```

---

## 📊 Implementation Checklist

### Phase 1: アーキテクチャ基盤
- [ ] 1.1.1 `GoalRepository` インターフェース作成
- [ ] 1.1.2 `MilestoneRepository` インターフェース作成
- [ ] 1.1.3 `ProfileRepository` インターフェース作成
- [ ] 1.1.4 `repositories/index.ts` 作成
- [ ] 1.2.1 `GoalUseCase` クラス実装
- [ ] 1.2.2 `MilestoneUseCase` クラス実装
- [ ] 1.2.3 `ProfileUseCase` クラス実装
- [ ] 1.2.4 `usecases/index.ts` 更新

### Phase 2: データ層実装
- [ ] 2.1.1 `GoalSchema.ts` 作成
- [ ] 2.1.2 `MilestoneSchema.ts` 作成
- [ ] 2.1.3 `ProfileSchema.ts` 作成
- [ ] 2.1.4 `schemas/index.ts` 作成
- [ ] 2.2.1 `GoalModel.ts` 作成
- [ ] 2.2.2 `MilestoneModel.ts` 作成
- [ ] 2.2.3 `ProfileModel.ts` 作成
- [ ] 2.2.4 `models/index.ts` 更新
- [ ] 2.3.1 `LocalDataSource` にGoalメソッド追加
- [ ] 2.3.2 `LocalDataSource` にMilestoneメソッド追加
- [ ] 2.3.3 `LocalDataSource` にProfileメソッド追加
- [ ] 2.4.1 `DatabaseManager` のスキーマ初期化更新
- [ ] 2.5.1 `GoalRepositoryImpl` 実装
- [ ] 2.5.2 `MilestoneRepositoryImpl` 実装
- [ ] 2.5.3 `ProfileRepositoryImpl` 実装
- [ ] 2.5.4 `repositories/index.ts` 作成

### Phase 3: UI層リファクタリング
- [ ] 3.1.1 `useGoalUseCase` フック作成
- [ ] 3.1.2 `useMilestoneUseCase` フック作成
- [ ] 3.1.3 `useProfileUseCase` フック作成
- [ ] 3.1.4 `hooks/index.ts` 作成
- [ ] 3.2.1 `OnboardingScreen` リファクタリング
- [ ] 3.2.2 診断エラーチェック

### Phase 4: テスト修正
- [ ] 4.1.1 `react-test-renderer` インストール
- [ ] 4.2.1 テスト実行・確認

---

## 🎯 Success Criteria

### 機能要件
- ✅ 目標をSQLiteに保存できる
- ✅ マイルストーンをSQLiteに保存できる
- ✅ プロファイルをSQLiteに保存できる
- ✅ オフラインでもデータが永続化される
- ✅ MCPとの同期が正常に動作する

### 技術要件
- ✅ Clean Architectureの原則に従っている
- ✅ 依存性逆転の原則（DIP）を遵守
- ✅ テスタビリティが高い（モック可能）
- ✅ すべてのテストが合格する
- ✅ TypeScript型安全性が保たれている

### コード品質
- ✅ ESLint準拠
- ✅ 診断エラー0件
- ✅ ドキュメント整備
- ✅ コメント適切

---

## 📚 References

- [ARCHITECTURE_ISSUE_REPOSITORY_PATTERN.md](ARCHITECTURE_ISSUE_REPOSITORY_PATTERN.md)
- [ARCHITECTURE_ISSUE_MOBILE_DATABASE.md](ARCHITECTURE_ISSUE_MOBILE_DATABASE.md)
- [.kiro/specs/mobile-app/design.md](../.kiro/specs/mobile-app/design.md)
- [.kiro/specs/mobile-app/tasks.md](../.kiro/specs/mobile-app/tasks.md)
- [Clean Architecture by Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)

---

## 🚀 Next Steps

1. **レビュー**: この実装計画をレビュー
2. **承認**: 実装方針の承認
3. **実装開始**: Phase 1から順次実装
4. **テスト**: 各Phaseごとにテスト
5. **完了**: タスク4.2〜4.4を完了としてマーク

---

**Last Updated**: 2025-10-23  
**Author**: Development Team  
**Status**: 🟡 Ready to Start
