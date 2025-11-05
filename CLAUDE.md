# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**climb-you** is a goal achievement app that transforms long-term goals into daily quests using a mountain climbing metaphor. Users climb to the 10th station (goal completion) by completing daily quests that earn steps.

**Key Concept**: Long-term goal = mountain, daily quests = climbing steps, 10 stations = milestones

## Technology Stack

- **Frontend**: ChatGPT Apps SDK (TypeScript) - Conversational UI within ChatGPT
- **Backend**: Node.js / Express
- **MCP Server**: Model Context Protocol for tool definitions
- **Database**: PostgreSQL (main), Redis (cache)
- **LLM**: OpenAI GPT-4 for SMART analysis, milestone generation, quest generation
- **Authentication**: OAuth 2.1 + PKCE

## Architecture

```
ChatGPT (conversation)
  └─ Apps SDK iframe (window.openai / Widget State)
       └─ callTool() → MCP Server
            └─ Backend API (Auth + Business Logic)
                 └─ PostgreSQL Database
```

**Storage Strategy**: Durable data (goals, logs, streaks) stored in external DB. Widget State for lightweight UI state only (~4k tokens).

## Common Commands

### Development

```bash
# Install all dependencies
npm install

# Start all services (frontend, backend, MCP server)
npm run dev

# Start individual services
npm run dev:frontend  # Frontend only
npm run dev:backend   # Backend only
npm run dev:mcp       # MCP server only
```

### Build

```bash
# Build all
npm run build

# Build individual
npm run build:frontend
npm run build:backend
npm run build:mcp
```

### Testing

```bash
# Run all tests
npm test

# Run specific module tests
npm run test:frontend
npm run test:backend

# Test with coverage
npm run test:coverage

# Run specific test file
npm test -- quest-generation
```

### Database

```bash
# Run migrations
npm run db:migrate

# Rollback last migration
npm run db:rollback

# Seed database
npm run db:seed
```

### Code Quality

```bash
# Lint TypeScript/TSX files
npm run lint

# Format code with Prettier
npm run format
```

## Directory Structure

```
climb-you-appsdk/
├── frontend/           # Apps SDK frontend (TypeScript)
├── backend/            # Node.js/Express API
├── mcp-server/         # MCP server (tool definitions)
├── database/           # Migrations & seeds
├── docs/               # Documentation
│   ├── OVERVIEW.md         # System architecture
│   ├── DEVELOPMENT.md      # Development guide
│   ├── DEPLOYMENT.md       # Deployment guide
│   └── CONTRIBUTING.md     # Contribution guide
├── .kiro/specs/        # Detailed feature specs
│   ├── onboarding/
│   ├── quest-generation/
│   ├── quest-logging/
│   ├── milestone-management/
│   └── ui-design/
└── AGENTS.md           # Agent/automation guidelines
```

## Core Features & Workflows

### 1. Onboarding (5 minutes)
- User inputs long-term goal
- System performs SMART + WOOP analysis
- Auto-generates 10 milestones (stations)
- Collects user profile (7 questions: commit time, lifestyle, work environment, etc.)

### 2. Daily Quest Generation
- **Trigger**: Cron job at 4:00 AM (user timezone)
- **Inputs**: User profile, current milestone, previous day logs, success/failure patterns (last 30 days)
- **Output**: 3 quests (small 15-30min, medium 30-60min, validation 10-20min)
- **Regeneration**: Available if "different day" circumstances

### 3. Quest Logging
- Status: completed / skipped / obstructed
- Evidence submission required for completion
- Step calculation: small=50, medium=100, challenging=150, validation=30, complete bonus=+50
- Streak tracking with freeze days (1 per week)

### 4. Milestone Achievement
- Triggered when cumulative steps reach station threshold
- Achievement confirmation with evidence
- If not achieved: 3 options (continue, adjust goal, redesign milestones)
- Stagnation detection: alerts after 30 days at same station

## MCP Tools

Key tools defined in `mcp-server/`:

- `goal.analyze` - SMART analysis of user goal
- `goal.create` - Create goal with milestones
- `quest.generate` - Generate daily quest bundle
- `quest.complete` - Log quest completion/skip/obstruction
- `milestone.achieve` - Record milestone achievement
- `leaderboard.fetch` - Get weekly same-level cohort rankings

Each tool uses JSON Schema for I/O validation and OAuth scopes for minimal permissions.

## Data Model Essentials

**Core Entities**:
- `User` - Anonymous ID, consent timestamp
- `Goal` - Title, KPI, deadline, WOOP fields (Wish, Outcome, Obstacle, Plan)
- `Milestone` - 10 stations per goal, completion criteria
- `UserProfile` - Commit time, lifestyle, focus time, difficulty preference
- `QuestBundle` - Daily 3-quest set, valid until midnight
- `Quest` - Type (small/medium/validation), estimated time, completion criteria, evidence type
- `QuestLog` - Completion status, actual time, evidence, skip/obstruction reason
- `ClimbingProgress` - Total steps, current station, station progress
- `Streak` - Current/max streak, freeze days used
- `SuccessPatterns` / `FailurePatterns` - Learning data from past 30 days

## Key Technical Patterns

### Widget State Management
- Keep state minimal (~4k tokens guideline)
- Store only session-critical UI data
- Persist durable data to backend DB immediately

### Learning Engine
- Analyzes last 30 days of quest logs
- Identifies success patterns (preferred difficulty, duration, type)
- Identifies failure patterns (common obstacles, problematic quest types)
- Feeds into daily quest generation

### Quest Generation Flow
1. Fetch user profile + current milestone
2. Retrieve previous day log + 30-day patterns
3. Call LLM with context for personalized 3-quest bundle
4. Validate completions criteria & evidence requirements
5. Store bundle with expiration

### Authentication Flow
- ChatGPT client initiates OAuth 2.1 + PKCE
- MCP server validates tokens
- Backend API enforces scope-based access control
- Follows minimal permission principle

## Development Practices

### Coding Style
- **TypeScript/JavaScript**: camelCase variables/functions, PascalCase classes/components, UPPER_SNAKE_CASE constants
- **Indentation**: 2 spaces
- **Linting**: ESLint + Prettier enforced
- **JSON payloads**: snake_case keys (MCP contract consistency)

### Commit Messages (Conventional Commits)
```
feat: add new feature
fix: resolve bug
docs: update documentation
style: format code (no behavior change)
refactor: restructure code
test: add or modify tests
chore: build/tooling changes
```

Include scope tags when touching multiple modules: `feat(backend): add quest scheduler`

### Testing Guidelines
- Use Vitest for TypeScript
- Mirror file structure: `src/quests/service.ts` → `tests/quests/service.test.ts`
- Target >80% coverage for quest generation, auth adapters, MCP handlers
- Test boundary cases: token quotas, streak resets, stagnation detection

### Branch Strategy
- `main` - Production (not yet initialized)
- `develop` - Development base
- `feature/*` - Feature branches
- `fix/*` - Bug fixes

## Important Constraints

### Security (Non-Negotiable)
- **Minimal permission**: Each OAuth scope grants only necessary access
- **Explicit consent**: User must approve all data collection/tracking
- **Multi-layer defense**: Prompt injection protection, input validation, audit logs
- **Privacy**: No profiling without disclosure & consent

### Apps SDK Limitations
- Widget State size limit: ~4k tokens
- No offline mode (ChatGPT required)
- No push notifications (cron-based generation instead)
- Preview status: APIs may change

### Data Retention
- `QuestLog`: 180-day rotation
- `Goal/Milestone`: Kept until user deletion
- Provide deletion API and export API (App Store compliance)

## iOS Native App (Phase 2 - Future)

### Overview

iOS版はPhase 2として計画されており、Apps SDK版で検証したUX/データモデルを基に本格展開します。

**技術スタック:**
- SwiftUI (iOS 15+)
- Clean Architecture + MVVM
- Core Data (ローカルDB、オフライン対応)
- CloudKit (iCloud同期、オプション)
- Swift Package Manager (依存管理)

### Apps SDK版との主な違い

| 機能 | Apps SDK版 | iOS版 |
|------|-----------|-------|
| **オフライン動作** | ❌ 不可 | ✅ Core Dataで可能 |
| **プッシュ通知** | ❌ 不可 | ✅ APNs対応 |
| **ホーム画面ウィジェット** | ❌ 不可 | ✅ WidgetKit対応 |
| **Siri統合** | ❌ 不可 | ✅ Shortcuts対応 |
| **Apple Health連携** | ❌ 不可 | ✅ HealthKit対応 |
| **会話型UI** | ✅ ChatGPT内 | ❌ ネイティブUI |
| **認証** | OAuth 2.1 + PKCE | Sign in with Apple |

### iOS固有機能

**1. プッシュ通知 (APNs)**
- 日次クエスト生成完了通知（AM 4:00頃）
- 合目達成祝福（即座）
- 週次ランキング結果（月曜 AM 9:00）
- 停滞アラート（30日間同じ合目）
- Rich Notifications（画像付き）
- Actionable Notifications（通知から直接アクション）

**2. ホーム画面ウィジェット (WidgetKit)**
- **Small**: 現在の合目、今日の進捗（歩数）、現在のストリーク
- **Medium**: 合目と進捗率、今日のクエスト概要（3つ）、完了状況
- **Large**: 10合目の山のビジュアル、今日のクエスト詳細、週次ランキング順位
- 15分ごとに自動更新、ダークモード対応

**3. Siri Shortcuts**
- 「今日のクエストを教えて」
- 「進捗を教えて」
- 「クエストを完了にして」
- 「ストリークを確認して」
- カスタムショートカット作成可能

**4. Apple Health連携 (HealthKit)**
- 歩数データの読み取り（climb-youの歩数システムと連携可能）
- アクティブエネルギー、エクササイズ時間の読み取り
- マインドフルネスセッションの書き込み（クエスト完了時）
- Healthデータに基づくクエスト提案

**5. オフライン対応**
- Core Dataによるローカルデータ管理
- オフライン時の機能：既存クエスト閲覧、完了記録、進捗確認
- ネットワーク復旧時の自動同期
- バックグラウンド同期（Background App Refresh）
- 競合解決（サーバー優先）

### iOS版のアーキテクチャ

```
┌─────────────────────────────┐
│  SwiftUI Views              │
│  - HomeView                 │
│  - QuestDetailView          │
│  - MilestoneView            │
└─────────────────────────────┘
         ↓ MVVM
┌─────────────────────────────┐
│  ViewModels                 │
│  - HomeViewModel            │
│  - QuestViewModel           │
└─────────────────────────────┘
         ↓ Use Cases
┌─────────────────────────────┐
│  Domain Layer               │
│  - QuestUseCase             │
│  - GoalUseCase              │
│  - Entities                 │
└─────────────────────────────┘
         ↓ Repository
┌─────────────────────────────┐
│  Data Layer                 │
│  - MCPClient (Remote)       │
│  - CoreDataManager (Local)  │
└─────────────────────────────┘
         ↓ MCP + HTTPS
┌─────────────────────────────┐
│  Backend API                │
│  (Apps SDK版と共通)         │
└─────────────────────────────┘
```

### iOS版を見据えた設計指針

**Backend API設計:**
- ✅ **コアビジネスロジックはバックエンドに集約**（iOS/Apps SDK両対応）
- ✅ **MCPツールはオンライン/オフライン両対応を想定**
- ✅ **データ同期API**: 増分同期、競合解決、最終更新タイムスタンプ
- ✅ **通知システム**: Cron（Apps SDK）とAPNs（iOS）の両対応

**データモデル設計:**
- ✅ Core Dataモデルは PostgreSQL スキーマと整合性を保つ
- ✅ `last_synced_at` フィールドで同期管理
- ✅ オフライン時の楽観的更新（Optimistic Update）をサポート

**認証設計:**
- ✅ Auth Adapter パターンで認証方式を抽象化
- ✅ OAuth 2.1 + PKCE（Apps SDK）と Sign in with Apple（iOS）の切り替え可能
- ✅ トークン管理: Keychain（iOS）、セキュアストレージ

### iOS開発コマンド（将来）

```bash
# プロジェクトを開く
cd ios
open ClimbYou.xcodeproj

# ビルド
xcodebuild -scheme ClimbYou -destination 'platform=iOS Simulator,name=iPhone 15' build

# テスト実行
xcodebuild test -scheme ClimbYou -destination 'platform=iOS Simulator,name=iPhone 15'

# カバレッジレポート生成
xcodebuild test -scheme ClimbYou -enableCodeCoverage YES

# SwiftGen実行（翻訳キー生成）
cd ios
swift run swiftgen config run --config swiftgen.yml

# アーカイブ作成（TestFlight/App Store）
xcodebuild -scheme ClimbYou -archivePath ./build/ClimbYou.xcarchive archive
```

### コーディングスタイル（iOS）

```swift
// 命名規則
let userName = "John"              // camelCase
class QuestGenerator { }           // PascalCase
struct Quest { }                   // PascalCase
protocol QuestUseCaseProtocol { }  // PascalCase

// ディレクトリ構造
ios/ClimbYou/
├── Presentation/
│   ├── Views/          # SwiftUI Views
│   └── ViewModels/     # ObservableObject ViewModels
├── Domain/
│   ├── Entities/       # ドメインモデル
│   └── UseCases/       # ビジネスロジック
├── Data/
│   ├── Repositories/   # データアクセス抽象化
│   ├── DataSources/    # Remote (MCP) / Local (Core Data)
│   └── CoreData/       # .xcdatamodeld
└── Resources/
    ├── ja.lproj/       # 日本語リソース
    └── en.lproj/       # 英語リソース
```

### App Store対応

- App Store Review Guidelines 完全準拠
- Privacy Manifest (iOS 17+)
- TestFlight ベータテスト
- 段階的リリース（Phased Release）
- App Store最適化（ASO）

### 多言語対応

- 日本語・英語サポート
- 動的な言語切り替え（アプリ再起動不要）
- SwiftGenによる型安全な翻訳キー
- RTL言語対応の準備（将来のアラビア語・ヘブライ語対応）

### テストカバレッジ目標

- 単体テスト: **80%以上**
- UIテスト: 主要フローをカバー
- 統合テスト: MCP通信、Core Data同期
- CI/CD: GitHub Actions / Xcode Cloud

### 詳細ドキュメント

iOS版の詳細は `docs/OVERVIEW.md` の「iOSネイティブアプリ版」セクションを参照。

---

## Future Considerations

- **Sign in with ChatGPT**: Auth adapter ready for future official OAuth
- **External Clients**: MCP protocol enables adoption by other platforms beyond iOS

## Localization

- Primary language: Japanese
- UI text, quest prompts, milestone descriptions in Japanese
- Design system: Mountain-themed colors (Mountain Blue #3C507D, Night Sky #112250, Moonlight Gold #E0C58F)

## Key Reference Documents

- **MVP Spec**: `climb-you_MVP_spec_AppsSDK.md` - Complete feature requirements
- **System Overview**: `docs/OVERVIEW.md` - Architecture, workflows, tech stack
- **Development Guide**: `docs/DEVELOPMENT.md` - Setup, testing, debugging
- **Agent Guidelines**: `AGENTS.md` - Automation scripts and repository conventions

## Prerequisites Check

Before development, run:
```powershell
pwsh .\.specify\scripts\powershell\check-prerequisites.ps1
```
Confirms Node >=20, pnpm, Git availability.

## Notes for AI Assistants

### 🚨 実装前の必須チェック

**いかなる機能実装・変更を行う前に、必ず以下のドキュメントを確認すること:**

1. **`.kiro/specs/` の関連仕様書を読む**
   - オンボーディング: `.kiro/specs/onboarding/`
   - クエスト生成: `.kiro/specs/quest-generation/`
   - クエストログ: `.kiro/specs/quest-logging/`
   - マイルストーン管理: `.kiro/specs/milestone-management/`
   - UIデザイン: `.kiro/specs/ui-design/`
   - その他の機能: `.kiro/specs/` 配下の該当ディレクトリ

2. **`docs/` の関連ドキュメントを読む**
   - システム全体概要: `docs/OVERVIEW.md`
   - 開発ガイド: `docs/DEVELOPMENT.md`
   - データベース設計: `docs/DATABASE.md`
   - デプロイメント: `docs/DEPLOYMENT.md`

3. **仕様書が存在しない場合**
   - `climb-you_MVP_spec_AppsSDK.md` を確認
   - 不明点があればユーザーに質問する
   - **推測で実装しない**

**実装開始の手順:**
```
1. タスクを受け取る
2. `.kiro/specs/` で関連仕様書を検索
3. 仕様書を読み、要件を理解
4. `docs/` で関連アーキテクチャ/設計を確認
5. 不明点をユーザーに質問
6. 実装開始
7. 仕様書との整合性を確認
```

**例:**
- クエスト生成機能を実装する場合:
  1. `.kiro/specs/quest-generation/` を読む
  2. `docs/OVERVIEW.md` の「日次クエスト生成機能」を確認
  3. データモデルを `docs/DATABASE.md` で確認
  4. 実装開始

### 開発時の注意事項

1. **Date-stamp spec edits** in `climb-you_MVP_spec_AppsSDK.md`
2. **Keep diagrams in sync** with MCP channel/tool definitions
3. **Widget State discipline**: Only store lightweight session state
4. **Learning from logs**: Always consider 30-day patterns in quest generation logic
5. **Evidence-based completion**: Never allow ambiguous quest completion without proof
6. **Health-first ranking**: Same-level cohort only, no global leaderboard (prevents unhealthy competition)
7. **仕様ファーストの原則**: 実装前に必ず `.kiro/specs/` と `docs/` を確認

### 🎯 タスク完了時の必須作業

**開発タスクを完了した際は、必ず以下を実行すること:**

1. **該当するROADMAP.mdにチェックを付ける**
   - **iOS版**: `.kiro/specs/ios-app/ROADMAP.md`
   - **Apps SDK版**: 該当する仕様書内のチェックリスト
   - 完了したタスクの `[ ]` を `[x]` に変更
   - 例: `- [ ] 1.1 Xcodeプロジェクトの作成` → `- [x] 1.1 Xcodeプロジェクトの作成`

2. **マイルストーン到達時の確認**
   - 各週・各フェーズの終わりに「マイルストーン」が達成できているか確認
   - 例: Week 1終了時に「✅ ユーザーがログインできる」を確認

3. **進捗報告**
   - タスク完了時にユーザーに報告
   - 完了内容を簡潔に説明
   - 次のタスクを提示

**作業フロー:**
```
1. タスク開始前: ROADMAP.md（または該当仕様書）で該当タスクを確認
2. 仕様書・ドキュメント確認: `.kiro/specs/` と `docs/` を読む
3. 実装: コードを書く
4. テスト: 動作確認・ユニットテスト
5. タスク完了時: ROADMAP.mdにチェック [x] を付ける
6. ユーザーに報告: 完了内容と次のタスクを提示
```

**報告例:**
```markdown
✅ タスク 1.1 完了: Xcodeプロジェクトの作成

完了内容:
- Clean Architecture + MVVM構造でプロジェクトを作成
- ディレクトリ構造: Presentation / Domain / Data / Core
- 基本的なファイル構成を配置

次のタスク: 1.2 プロジェクト構造の構築

📝 ROADMAP.mdを更新: [x] 1.1 Xcodeプロジェクトの作成
```
