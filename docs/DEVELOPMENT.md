# 開発ガイド

## 環境セットアップ

### 前提条件

**共通**
- Git

**Web版（ChatGPT Apps SDK）**
- Node.js 18+
- PostgreSQL 14+
- Redis 7+

**iOS版（ネイティブアプリ）**
- macOS 13.0+（Ventura以降）
- Xcode 15.0+
- Swift 5.9+
- iOS 15.0+対応デバイスまたはSimulator
- CocoaPods（オプション）

### インストール手順

1. **リポジトリをクローン**
   ```bash
   git clone https://github.com/your-org/climb-you.git
   cd climb-you
   ```

2. **依存関係をインストール**
   ```bash
   npm install
   cd frontend && npm install
   cd ../backend && npm install
   cd ../mcp-server && npm install
   cd ..
   ```

3. **環境変数を設定**
   ```bash
   cp .env.example .env
   # .envファイルを編集して必要な値を設定
   ```

4. **データベースをセットアップ**
   ```bash
   # PostgreSQLを起動
   # データベースを作成
   createdb climb_you
   
   # マイグレーションを実行
   npm run db:migrate
   
   # シードデータを投入（オプション）
   npm run db:seed
   ```

5. **Redisを起動**
   ```bash
   redis-server
   ```

6. **開発サーバーを起動**
   ```bash
   npm run dev
   ```

### iOS開発環境のセットアップ

#### 1. Xcodeのインストール

```bash
# App StoreからXcode 15.0以降をインストール
# または
xcode-select --install

# Xcodeのバージョン確認
xcodebuild -version
```

#### 2. プロジェクトを開く

```bash
cd ios
open ClimbYou.xcodeproj
# または
open ClimbYou.xcworkspace  # CocoaPodsを使用する場合
```

#### 3. Swift Package Managerで依存関係を解決

Xcodeで自動的に依存関係が解決されます。手動で実行する場合：

```bash
# Xcodeメニュー: File > Packages > Resolve Package Versions
# または
xcodebuild -resolvePackageDependencies
```

**主要な依存関係：**
- SwiftGen（翻訳キーの型安全な生成）
- その他のSwift Packagesは`Package.swift`に定義

#### 4. 環境変数の設定

`ios/ClimbYou/Config/Config.xcconfig`を作成：

```
// API設定
API_BASE_URL = https:/$()/api.climb-you.com
MCP_SERVER_URL = https:/$()/mcp.climb-you.com

// OAuth設定
OAUTH_CLIENT_ID = your_client_id
OAUTH_REDIRECT_URI = climbYou:/$()/oauth/callback

// APNs設定（開発環境）
APNS_ENVIRONMENT = development
```

#### 5. 署名とCapabilitiesの設定

Xcodeで以下を設定：

1. **Signing & Capabilities**タブを開く
2. **Team**を選択（Apple Developer Program）
3. **Bundle Identifier**を設定：`com.climbYou.ios`

**必要なCapabilities：**
- Push Notifications
- Background Modes
  - Background fetch
  - Remote notifications
- App Groups（ウィジェットとのデータ共有用）
  - `group.com.climbYou.shared`
- Sign in with Apple
- HealthKit
- Siri

#### 6. シミュレーターまたは実機で実行

```bash
# シミュレーターで実行
xcodebuild -scheme ClimbYou -destination 'platform=iOS Simulator,name=iPhone 15' build

# または Xcode で Cmd+R
```

**推奨シミュレーター：**
- iPhone 15（iOS 17）
- iPhone 14（iOS 16）
- iPhone SE（小画面テスト用）
- iPad Pro 12.9"（iPad対応テスト用）

#### 7. SwiftGenの実行

翻訳ファイルから型安全なコードを生成：

```bash
cd ios

# SwiftGenを実行（ビルド時に自動実行されます）
# 手動で実行する場合：
swift run swiftgen config run --config swiftgen.yml
```

生成されたファイル：`ios/Generated/Strings.swift`

#### 8. Core Dataのセットアップ

Core Dataモデルは`ios/ClimbYou/Data/CoreData/ClimbYou.xcdatamodeld`に定義されています。

**マイグレーション：**
- 初回起動時に自動的にデータベースが作成されます
- スキーマ変更時は軽量マイグレーションを使用

#### 9. 開発用証明書の設定

**プッシュ通知のテスト：**

1. Apple Developer Portalで開発用APNs証明書を作成
2. `.p8`キーファイルをダウンロード
3. バックエンドに設定

**TestFlightでのテスト：**

1. App Store Connectでアプリを登録
2. TestFlightビルドをアップロード
3. 内部テスターを招待

```bash
# アーカイブを作成
xcodebuild -scheme ClimbYou -archivePath ./build/ClimbYou.xcarchive archive

# App Store Connectにアップロード
xcodebuild -exportArchive -archivePath ./build/ClimbYou.xcarchive \
  -exportPath ./build -exportOptionsPlist ExportOptions.plist
```

## 開発ワークフロー

### ブランチ戦略

```
main (本番)
  └── develop (開発)
       ├── feature/onboarding
       ├── feature/quest-generation
       ├── fix/bug-name
       └── refactor/component-name
```

### 新機能の開発

1. **developブランチから新しいブランチを作成**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature-name
   ```

2. **開発**
   - コードを書く
   - テストを追加
   - ドキュメントを更新

3. **コミット**
   ```bash
   git add .
   git commit -m "feat: add your feature"
   ```

4. **Push & Pull Request**
   ```bash
   git push origin feature/your-feature-name
   ```
   - GitHubでPull Requestを作成
   - developブランチへのマージを申請

### バグ修正

1. **fixブランチを作成**
   ```bash
   git checkout -b fix/bug-description
   ```

2. **修正してテスト**
   ```bash
   npm test
   ```

3. **コミット & Push**
   ```bash
   git commit -m "fix: resolve bug description"
   git push origin fix/bug-description
   ```

## コーディング規約

### TypeScript/JavaScript

**命名規則**
- 変数・関数: `camelCase`
- クラス・コンポーネント: `PascalCase`
- 定数: `UPPER_SNAKE_CASE`
- ファイル名: `kebab-case.ts`

**例**
```typescript
// 変数・関数
const userName = 'John';
function calculateSteps() { }

// クラス・コンポーネント
class QuestGenerator { }
const QuestCard = () => { };

// 定数
const MAX_QUEST_COUNT = 3;

// ファイル名
quest-generator.ts
quest-card.tsx
```

### Swift/iOS

**命名規則**
- 変数・関数: `camelCase`
- クラス・構造体・プロトコル: `PascalCase`
- 定数: `camelCase`（Swiftの慣習）
- ファイル名: `PascalCase.swift`

**例**
```swift
// 変数・関数
let userName = "John"
func calculateSteps() { }

// クラス・構造体・プロトコル
class QuestGenerator { }
struct Quest { }
protocol QuestUseCaseProtocol { }

// 定数
let maxQuestCount = 3

// ファイル名
QuestGenerator.swift
QuestCard.swift
```

**SwiftUIの命名**
```swift
// View
struct HomeView: View { }
struct QuestCard: View { }

// ViewModel
class HomeViewModel: ObservableObject { }

// Use Case
protocol QuestUseCaseProtocol { }
class QuestUseCase: QuestUseCaseProtocol { }

// Repository
protocol QuestRepositoryProtocol { }
class QuestRepository: QuestRepositoryProtocol { }
```

**ディレクトリ構造（iOS）**
```
ios/ClimbYou/
├── Presentation/
│   ├── Views/
│   │   ├── Onboarding/
│   │   │   └── OnboardingView.swift
│   │   ├── Home/
│   │   │   └── HomeView.swift
│   │   └── Quest/
│   │       └── QuestDetailView.swift
│   └── ViewModels/
│       ├── OnboardingViewModel.swift
│       ├── HomeViewModel.swift
│       └── QuestDetailViewModel.swift
├── Domain/
│   ├── Entities/
│   │   ├── Goal.swift
│   │   ├── Quest.swift
│   │   └── UserProgress.swift
│   └── UseCases/
│       ├── GoalUseCase.swift
│       ├── QuestUseCase.swift
│       └── QuestLogUseCase.swift
├── Data/
│   ├── Repositories/
│   │   ├── GoalRepository.swift
│   │   └── QuestRepository.swift
│   ├── DataSources/
│   │   ├── Remote/
│   │   │   └── MCPClient.swift
│   │   └── Local/
│   │       └── CoreDataManager.swift
│   └── CoreData/
│       └── ClimbYou.xcdatamodeld
├── Core/
│   ├── Localization/
│   │   └── LocalizationManager.swift
│   ├── Networking/
│   │   └── NetworkSecurityManager.swift
│   └── Extensions/
│       └── String+Localized.swift
└── Resources/
    ├── ja.lproj/
    │   └── Localizable.strings
    └── en.lproj/
        └── Localizable.strings
```

### コミットメッセージ

**フォーマット**
```
<type>: <subject>

<body>

<footer>
```

**Type**
- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメント
- `style`: フォーマット（コード動作に影響なし）
- `refactor`: リファクタリング
- `test`: テスト追加・修正
- `chore`: ビルド・補助ツールの変更

**例**
```
feat: add quest generation scheduler

- Implement cron job for daily quest generation
- Add timezone support
- Add error handling and retry logic

Closes #123
```

## テスト

### Web版のテスト

**テストの実行**

```bash
# 全テストを実行
npm test

# 特定のテストを実行
npm test -- quest-generation

# ウォッチモード
npm test -- --watch

# カバレッジ
npm run test:coverage
```

**テストの書き方**

**単体テスト**
```typescript
describe('QuestGenerator', () => {
  it('should generate 3 quests', () => {
    const generator = new QuestGenerator();
    const quests = generator.generate();
    expect(quests).toHaveLength(3);
  });
});
```

**統合テスト**
```typescript
describe('POST /api/v1/quests/generate', () => {
  it('should return quest bundle', async () => {
    const response = await request(app)
      .post('/api/v1/quests/generate')
      .send({ userId: 'user_123' });
    
    expect(response.status).toBe(200);
    expect(response.body.quests).toHaveLength(3);
  });
});
```

### iOS版のテスト

**テストの実行**

```bash
# 全テストを実行
xcodebuild test -scheme ClimbYou -destination 'platform=iOS Simulator,name=iPhone 15'

# または Xcode で Cmd+U
```

**単体テスト（XCTest）**

```swift
import XCTest
@testable import ClimbYou

class QuestUseCaseTests: XCTestCase {
    var sut: QuestUseCase!
    var mockRepository: MockQuestRepository!
    
    override func setUp() {
        super.setUp()
        mockRepository = MockQuestRepository()
        sut = QuestUseCase(repository: mockRepository)
    }
    
    func testGetTodayQuests_Success() async throws {
        // Given
        let expectedQuests = [Quest.mock(), Quest.mock()]
        mockRepository.todayQuestsResult = .success(expectedQuests)
        
        // When
        let quests = try await sut.getTodayQuests(userId: "user_123")
        
        // Then
        XCTAssertEqual(quests.count, 2)
        XCTAssertEqual(mockRepository.getTodayQuestsCallCount, 1)
    }
}
```

**UIテスト（XCUITest）**

```swift
import XCTest

class OnboardingUITests: XCTestCase {
    var app: XCUIApplication!
    
    override func setUp() {
        super.setUp()
        continueAfterFailure = false
        app = XCUIApplication()
        app.launch()
    }
    
    func testOnboardingFlow() {
        // Given
        let goalTextField = app.textFields["goalInput"]
        let nextButton = app.buttons["nextButton"]
        
        // When
        goalTextField.tap()
        goalTextField.typeText("TOEIC 800点を取得する")
        nextButton.tap()
        
        // Then
        XCTAssertTrue(app.staticTexts["障害を特定"].exists)
    }
}
```

**テストカバレッジの確認**

```bash
# カバレッジレポートを生成
xcodebuild test -scheme ClimbYou \
  -destination 'platform=iOS Simulator,name=iPhone 15' \
  -enableCodeCoverage YES

# カバレッジレポートを表示
xcrun xccov view --report DerivedData/ClimbYou/Logs/Test/*.xcresult
```

**目標カバレッジ：80%以上**

## デバッグ

### Web版のデバッグ

**ログ**

```typescript
// 開発環境
console.log('Debug info:', data);

// 本番環境
logger.info('Info message', { data });
logger.error('Error message', { error });
```

**VSCode デバッグ設定**

`.vscode/launch.json`
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Backend",
      "program": "${workspaceFolder}/backend/src/server.ts",
      "preLaunchTask": "npm: build",
      "outFiles": ["${workspaceFolder}/backend/dist/**/*.js"]
    }
  ]
}
```

### iOS版のデバッグ

**ログ**

```swift
// 開発環境
print("Debug info: \(data)")

// 本番環境
#if DEBUG
print("Debug info: \(data)")
#endif

// OSLogを使用（推奨）
import os.log

let logger = Logger(subsystem: "com.climbYou.ios", category: "quest")
logger.info("Info message: \(data)")
logger.error("Error message: \(error.localizedDescription)")
```

**Xcodeデバッグ**

1. **ブレークポイント**
   - コード行の左側をクリックしてブレークポイントを設定
   - 条件付きブレークポイント：右クリック > Edit Breakpoint

2. **LLDB コマンド**
   ```
   # 変数の値を表示
   po variableName
   
   # 式を評価
   expr variableName = newValue
   
   # スタックトレースを表示
   bt
   ```

3. **View Hierarchy デバッグ**
   - Debug > View Debugging > Capture View Hierarchy
   - 3DでUIの階層を確認

4. **Memory Graph デバッグ**
   - Debug > Memory Graph
   - メモリリークを検出

**Instruments でのプロファイリング**

```bash
# Instrumentsを起動
instruments -t "Time Profiler" -D trace.trace -l 10000 ClimbYou.app

# または Xcode で Cmd+I
```

**主要なInstrumentsテンプレート：**
- Time Profiler（CPU使用率）
- Allocations（メモリ使用量）
- Leaks（メモリリーク）
- Network（ネットワーク通信）
- Energy Log（バッテリー消費）

## トラブルシューティング

### Web版

**データベース接続エラー**

```bash
# PostgreSQLが起動しているか確認
pg_isready

# 接続情報を確認
psql -U user -d climb_you
```

**Redis接続エラー**

```bash
# Redisが起動しているか確認
redis-cli ping
# PONG が返ってくればOK
```

**ポートが使用中**

```bash
# ポートを使用しているプロセスを確認
lsof -i :3000

# プロセスを終了
kill -9 <PID>
```

### iOS版

**ビルドエラー**

```bash
# Derived Dataをクリーン
rm -rf ~/Library/Developer/Xcode/DerivedData

# または Xcode で Shift+Cmd+K (Clean Build Folder)
```

**Swift Package依存関係のエラー**

```bash
# パッケージキャッシュをクリア
rm -rf ~/Library/Caches/org.swift.swiftpm
rm -rf ~/Library/Developer/Xcode/DerivedData

# Xcodeで再度解決
# File > Packages > Reset Package Caches
# File > Packages > Resolve Package Versions
```

**Simulatorの問題**

```bash
# Simulatorをリセット
xcrun simctl erase all

# 特定のSimulatorをリセット
xcrun simctl erase "iPhone 15"

# Simulatorを再起動
killall Simulator
```

**Core Dataのエラー**

```bash
# アプリをアンインストールしてデータベースをリセット
xcrun simctl uninstall booted com.climbYou.ios

# または Simulatorでアプリを長押し > Remove App
```

**署名エラー**

1. Xcode > Preferences > Accounts でApple IDを確認
2. Signing & Capabilities でTeamを再選択
3. Bundle Identifierが一意であることを確認
4. 証明書が有効期限内であることを確認

**プッシュ通知が届かない**

1. Capabilitiesで Push Notifications が有効か確認
2. APNs証明書が正しく設定されているか確認
3. デバイストークンが正しく登録されているか確認
4. 実機でテスト（Simulatorではプッシュ通知は受信できない）

```swift
// デバイストークンの確認
func application(_ application: UIApplication, 
                 didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
    let token = deviceToken.map { String(format: "%02.2hhx", $0) }.joined()
    print("Device Token: \(token)")
}
```

**ウィジェットが更新されない**

```bash
# ウィジェットのタイムラインを強制更新
# デバッグメニュー > Widget > Reload All Timelines

# または コードで
WidgetCenter.shared.reloadAllTimelines()
```

## パフォーマンス最適化

### データベースクエリ

- N+1問題を避ける
- 適切なインデックスを使用
- クエリ結果をキャッシュ

### API レスポンス

- ページネーションを実装
- 不要なデータを返さない
- gzip圧縮を有効化

## セキュリティ

### チェックリスト

- [ ] 入力検証を実装
- [ ] SQLインジェクション対策
- [ ] XSS対策
- [ ] CSRF対策
- [ ] 認証・認可を実装
- [ ] 機密情報をログに出力しない
- [ ] 依存関係の脆弱性をチェック

```bash
# 脆弱性チェック
npm audit
npm audit fix
```

## リリースプロセス

### Web版のリリース

1. **developブランチをテスト**
   ```bash
   npm test
   npm run lint
   ```

2. **mainブランチにマージ**
   ```bash
   git checkout main
   git merge develop
   ```

3. **バージョンを更新**
   ```bash
   npm version patch  # 0.1.0 -> 0.1.1
   npm version minor  # 0.1.0 -> 0.2.0
   npm version major  # 0.1.0 -> 1.0.0
   ```

4. **タグを作成**
   ```bash
   git tag -a v0.1.0 -m "Release v0.1.0"
   git push origin v0.1.0
   ```

5. **デプロイ**
   - CI/CDが自動実行
   - または手動デプロイ

### iOS版のリリース

#### TestFlightベータリリース

1. **テストを実行**
   ```bash
   xcodebuild test -scheme ClimbYou \
     -destination 'platform=iOS Simulator,name=iPhone 15'
   ```

2. **バージョンを更新**
   - Xcodeで Version と Build Number を更新
   - Version: 0.1.0（ユーザーに表示）
   - Build: 1（内部管理用、毎回インクリメント）

3. **アーカイブを作成**
   ```bash
   # Xcode で Product > Archive
   # または
   xcodebuild -scheme ClimbYou -archivePath ./build/ClimbYou.xcarchive archive
   ```

4. **App Store Connectにアップロード**
   ```bash
   # Organizer から Upload to App Store Connect
   # または
   xcodebuild -exportArchive \
     -archivePath ./build/ClimbYou.xcarchive \
     -exportPath ./build \
     -exportOptionsPlist ExportOptions.plist
   ```

5. **TestFlightで配信**
   - App Store Connect > TestFlight
   - ビルドを選択
   - 内部テスターまたは外部テスターに配信

#### App Store本番リリース

1. **TestFlightでの十分なテスト**
   - 内部テスター：最低1週間
   - 外部テスター：最低2週間
   - クラッシュレート < 1%
   - 主要機能の動作確認

2. **App Store Connectで設定**
   - アプリ情報（名前、説明、キーワード）
   - スクリーンショット（全デバイスサイズ）
   - プレビュー動画（オプション）
   - プライバシーポリシーURL
   - サポートURL

3. **審査に提出**
   - App Store Connect > App Store
   - ビルドを選択
   - 審査に提出

4. **審査承認後**
   - 手動リリースまたは自動リリースを選択
   - 段階的リリース（Phased Release）を推奨

5. **リリース後のモニタリング**
   - クラッシュレポートの確認
   - ユーザーレビューの確認
   - パフォーマンスメトリクスの確認

#### CI/CD（GitHub Actions / Xcode Cloud）

**GitHub Actions設定例：**

```yaml
name: iOS CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  build-and-test:
    runs-on: macos-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Xcode
      uses: maxim-lobanov/setup-xcode@v1
      with:
        xcode-version: '15.0'
    
    - name: Install dependencies
      run: |
        cd ios
        swift package resolve
    
    - name: Build
      run: |
        cd ios
        xcodebuild -scheme ClimbYou \
          -destination 'platform=iOS Simulator,name=iPhone 15' \
          build
    
    - name: Run tests
      run: |
        cd ios
        xcodebuild test -scheme ClimbYou \
          -destination 'platform=iOS Simulator,name=iPhone 15' \
          -enableCodeCoverage YES
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        files: ./ios/coverage.xml
```

## 参考リンク

- [システム全体概要](OVERVIEW.md)
- [コントリビューションガイド](CONTRIBUTING.md)
- [デプロイメントガイド](DEPLOYMENT.md)
- [仕様書](../.kiro/specs/)
