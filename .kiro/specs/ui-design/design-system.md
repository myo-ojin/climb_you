# climb-you デザインシステム

## ビジュアルコンセプト

climb-youは「山登り」をメタファーとした目標達成アプリです。夜の山を登る旅人のイメージで、静かで落ち着いた雰囲気の中、着実に前進する感覚を表現します。

## カラーパレット

### プライマリカラー

**Mountain Blue（マウンテンブルー）**
- HEX: `#3C507D`
- RGB: `60, 80, 125`
- 用途: メインカラー、山のシルエット、プライマリボタン、重要な要素

**Night Sky（ナイトスカイ）**
- HEX: `#112250`
- RGB: `17, 34, 80`
- 用途: 背景、ダークモード、深い影

### アクセントカラー

**Moonlight Gold（ムーンライトゴールド）**
- HEX: `#E0C58F`
- RGB: `224, 197, 143`
- 用途: 達成時のハイライト、月、アクセント、成功メッセージ

### ニュートラルカラー

**Cloud White（クラウドホワイト）**
- HEX: `#F5F0E9`
- RGB: `245, 240, 233`
- 用途: メインテキスト、カード背景、明るい要素

**Mist Gray（ミストグレー）**
- HEX: `#D0CBC2`
- RGB: `208, 203, 194`
- 用途: セカンダリテキスト、境界線、無効化された要素

### セマンティックカラー

**Success（成功）**
- Base: `#E0C58F` (Moonlight Gold)
- Light: `#F0D9B5`
- Dark: `#C9A96B`
- 用途: クエスト完了、合目達成、ストリーク更新

**Warning（警告）**
- Base: `#E0A85F`
- Light: `#F0C28F`
- Dark: `#C98F3F`
- 用途: 停滞アラート、期限接近

**Error（エラー）**
- Base: `#D07D7D`
- Light: `#E0A5A5`
- Dark: `#B05D5D`
- 用途: エラーメッセージ、失敗通知

**Info（情報）**
- Base: `#3C507D` (Mountain Blue)
- Light: `#5C7099`
- Dark: `#2C3F5D`
- 用途: 情報メッセージ、ヒント

## タイポグラフィ

### フォントファミリー

**プライマリフォント（日本語）**
- フォント: Noto Sans JP
- ウェイト: 300 (Light), 400 (Regular), 500 (Medium), 700 (Bold)
- 用途: 本文、見出し、UI要素

**セカンダリフォント（英数字）**
- フォント: Inter
- ウェイト: 400 (Regular), 500 (Medium), 600 (Semi-Bold), 700 (Bold)
- 用途: 数値、ボタン、ラベル

### フォントサイズ

```css
--font-size-xs: 12px;    /* 補足テキスト */
--font-size-sm: 14px;    /* セカンダリテキスト */
--font-size-base: 16px;  /* 本文 */
--font-size-lg: 18px;    /* 強調テキスト */
--font-size-xl: 20px;    /* 小見出し */
--font-size-2xl: 24px;   /* 見出し */
--font-size-3xl: 30px;   /* 大見出し */
--font-size-4xl: 36px;   /* タイトル */
```

### 行間

```css
--line-height-tight: 1.25;
--line-height-normal: 1.5;
--line-height-relaxed: 1.75;
```

## スペーシング

8pxベースのスペーシングシステム

```css
--spacing-1: 4px;
--spacing-2: 8px;
--spacing-3: 12px;
--spacing-4: 16px;
--spacing-5: 20px;
--spacing-6: 24px;
--spacing-8: 32px;
--spacing-10: 40px;
--spacing-12: 48px;
--spacing-16: 64px;
```

## ボーダー半径

```css
--radius-sm: 4px;    /* 小さな要素 */
--radius-md: 8px;    /* 標準 */
--radius-lg: 12px;   /* カード */
--radius-xl: 16px;   /* 大きなカード */
--radius-full: 9999px; /* 円形 */
```

## シャドウ

```css
--shadow-sm: 0 1px 2px rgba(17, 34, 80, 0.05);
--shadow-md: 0 4px 6px rgba(17, 34, 80, 0.1);
--shadow-lg: 0 10px 15px rgba(17, 34, 80, 0.15);
--shadow-xl: 0 20px 25px rgba(17, 34, 80, 0.2);
```

## コンポーネント

### ボタン

**プライマリボタン**
```css
background: #3C507D;
color: #F5F0E9;
padding: 12px 24px;
border-radius: 8px;
font-weight: 500;
```

**セカンダリボタン**
```css
background: transparent;
color: #3C507D;
border: 1px solid #3C507D;
padding: 12px 24px;
border-radius: 8px;
font-weight: 500;
```

**アクセントボタン（達成時）**
```css
background: #E0C58F;
color: #112250;
padding: 12px 24px;
border-radius: 8px;
font-weight: 600;
```

### カード

```css
background: #F5F0E9;
border-radius: 12px;
padding: 20px;
box-shadow: 0 4px 6px rgba(17, 34, 80, 0.1);
```

### インプット

```css
background: #FFFFFF;
border: 1px solid #D0CBC2;
border-radius: 8px;
padding: 12px 16px;
color: #112250;
font-size: 16px;
```

**フォーカス時**
```css
border-color: #3C507D;
box-shadow: 0 0 0 3px rgba(60, 80, 125, 0.1);
```

### バッジ

**達成バッジ**
```css
background: #E0C58F;
color: #112250;
padding: 4px 12px;
border-radius: 9999px;
font-size: 12px;
font-weight: 600;
```

**ストリークバッジ**
```css
background: #3C507D;
color: #F5F0E9;
padding: 4px 12px;
border-radius: 9999px;
font-size: 12px;
font-weight: 600;
```

## アイコン

### スタイル
- ラインアイコン（2px stroke）
- 丸みのあるコーナー
- サイズ: 16px, 20px, 24px, 32px

### カラー
- デフォルト: `#3C507D`
- セカンダリ: `#D0CBC2`
- アクセント: `#E0C58F`

## アニメーション

### トランジション

```css
--transition-fast: 150ms ease-in-out;
--transition-base: 250ms ease-in-out;
--transition-slow: 350ms ease-in-out;
```

### イージング

```css
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
```

### アニメーション例

**歩数獲得アニメーション**
```css
@keyframes climb-up {
  0% {
    transform: translateY(20px);
    opacity: 0;
  }
  50% {
    transform: translateY(-10px);
    opacity: 1;
  }
  100% {
    transform: translateY(0);
    opacity: 1;
  }
}
```

**合目達成アニメーション**
```css
@keyframes summit-glow {
  0%, 100% {
    box-shadow: 0 0 20px rgba(224, 197, 143, 0.3);
  }
  50% {
    box-shadow: 0 0 40px rgba(224, 197, 143, 0.6);
  }
}
```

## レイアウト

### ブレークポイント

```css
--breakpoint-sm: 640px;   /* モバイル */
--breakpoint-md: 768px;   /* タブレット */
--breakpoint-lg: 1024px;  /* デスクトップ */
--breakpoint-xl: 1280px;  /* 大画面 */
```

### コンテナ

```css
max-width: 1200px;
margin: 0 auto;
padding: 0 16px;
```

### グリッド

```css
display: grid;
grid-template-columns: repeat(12, 1fr);
gap: 24px;
```

## 山のビジュアル

### 10合目の表現

**未達成の合目**
```css
fill: #3C507D;
opacity: 0.3;
```

**現在の合目**
```css
fill: #3C507D;
opacity: 1;
stroke: #E0C58F;
stroke-width: 2px;
```

**達成済みの合目**
```css
fill: #E0C58F;
opacity: 1;
```

### 進捗パス

```css
stroke: #E0C58F;
stroke-width: 3px;
stroke-dasharray: 5, 5;
animation: dash 1s linear infinite;
```

## アクセシビリティ

### コントラスト比

- テキスト（通常）: 最低 4.5:1
- テキスト（大）: 最低 3:1
- UI要素: 最低 3:1

### フォーカス表示

```css
outline: 2px solid #3C507D;
outline-offset: 2px;
```

### スクリーンリーダー対応

- すべてのインタラクティブ要素にaria-labelを付与
- 画像にalt属性を付与
- フォームにlabelを関連付け

## ダークモード

### カラー調整

**背景**
- Primary: `#112250`
- Secondary: `#1A2F5F`

**テキスト**
- Primary: `#F5F0E9`
- Secondary: `#D0CBC2`

**アクセント**
- 変更なし: `#E0C58F`

## モーションデザイン原則

1. **意図的**: すべてのアニメーションに目的がある
2. **迅速**: 250ms以内で完了
3. **自然**: イージング関数で滑らかに
4. **控えめ**: 過度なアニメーションは避ける
5. **アクセシブル**: prefers-reduced-motionに対応

## ブランドボイス

### トーン
- 励まし的
- 落ち着いた
- 前向き
- サポート的

### メッセージング
- 「登りましょう」ではなく「一緒に登りましょう」
- 「失敗」ではなく「次のチャンス」
- 「目標」ではなく「山頂」
- 「タスク」ではなく「クエスト」

## 実装ガイドライン

### Web版（CSS変数の使用）

```css
:root {
  /* Colors */
  --color-mountain-blue: #3C507D;
  --color-night-sky: #112250;
  --color-moonlight-gold: #E0C58F;
  --color-cloud-white: #F5F0E9;
  --color-mist-gray: #D0CBC2;
  
  /* Spacing */
  --spacing-unit: 8px;
  
  /* Typography */
  --font-primary: 'Noto Sans JP', sans-serif;
  --font-secondary: 'Inter', sans-serif;
}
```

### コンポーネント命名規則（Web版）

BEM（Block Element Modifier）を使用

```css
.quest-card { }
.quest-card__title { }
.quest-card__title--completed { }
```

### レスポンシブデザイン（Web版）

モバイルファースト

```css
/* Mobile first */
.container {
  padding: 16px;
}

/* Tablet and up */
@media (min-width: 768px) {
  .container {
    padding: 24px;
  }
}

/* Desktop and up */
@media (min-width: 1024px) {
  .container {
    padding: 32px;
  }
}
```

## iOS実装ガイドライン

### SwiftUIカラーシステム

```swift
import SwiftUI

extension Color {
    // Primary Colors
    static let mountainBlue = Color(hex: "3C507D")
    static let nightSky = Color(hex: "112250")
    
    // Accent Colors
    static let moonlightGold = Color(hex: "E0C58F")
    
    // Neutral Colors
    static let cloudWhite = Color(hex: "F5F0E9")
    static let mistGray = Color(hex: "D0CBC2")
    
    // Semantic Colors
    static let questSuccess = Color(hex: "E0C58F")
    static let questWarning = Color(hex: "E0A85F")
    static let questError = Color(hex: "D07D7D")
    static let questInfo = Color(hex: "3C507D")
    
    // Helper
    init(hex: String) {
        let scanner = Scanner(string: hex)
        var rgbValue: UInt64 = 0
        scanner.scanHexInt64(&rgbValue)
        
        let r = Double((rgbValue & 0xFF0000) >> 16) / 255.0
        let g = Double((rgbValue & 0x00FF00) >> 8) / 255.0
        let b = Double(rgbValue & 0x0000FF) / 255.0
        
        self.init(red: r, green: g, blue: b)
    }
}
```

### SwiftUIタイポグラフィ

```swift
extension Font {
    // Font Sizes
    static let xs = Font.system(size: 12)
    static let sm = Font.system(size: 14)
    static let base = Font.system(size: 16)
    static let lg = Font.system(size: 18)
    static let xl = Font.system(size: 20)
    static let xxl = Font.system(size: 24)
    static let xxxl = Font.system(size: 30)
    static let xxxxl = Font.system(size: 36)
    
    // Semantic Fonts
    static let questTitle = Font.system(size: 20, weight: .semibold)
    static let questDescription = Font.system(size: 16, weight: .regular)
    static let stationNumber = Font.system(size: 36, weight: .bold)
    static let stepCount = Font.system(size: 24, weight: .medium)
}
```

### SwiftUIスペーシング

```swift
extension CGFloat {
    static let spacing1: CGFloat = 4
    static let spacing2: CGFloat = 8
    static let spacing3: CGFloat = 12
    static let spacing4: CGFloat = 16
    static let spacing5: CGFloat = 20
    static let spacing6: CGFloat = 24
    static let spacing8: CGFloat = 32
    static let spacing10: CGFloat = 40
    static let spacing12: CGFloat = 48
    static let spacing16: CGFloat = 64
}
```

### SwiftUIボーダー半径

```swift
extension CGFloat {
    static let radiusSm: CGFloat = 4
    static let radiusMd: CGFloat = 8
    static let radiusLg: CGFloat = 12
    static let radiusXl: CGFloat = 16
    static let radiusFull: CGFloat = 9999
}
```

### SwiftUIコンポーネント例

**プライマリボタン**
```swift
struct PrimaryButton: View {
    let title: String
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.base)
                .fontWeight(.medium)
                .foregroundColor(.cloudWhite)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 12)
                .padding(.horizontal, 24)
                .background(Color.mountainBlue)
                .cornerRadius(.radiusMd)
        }
    }
}
```

**クエストカード**
```swift
struct QuestCard: View {
    let quest: Quest
    
    var body: some View {
        VStack(alignment: .leading, spacing: .spacing3) {
            HStack {
                Image(systemName: questTypeIcon(quest.type))
                    .foregroundColor(.mountainBlue)
                Text(quest.title)
                    .font(.questTitle)
                    .foregroundColor(.nightSky)
                Spacer()
            }
            
            Text(quest.description)
                .font(.questDescription)
                .foregroundColor(.mistGray)
            
            HStack {
                Label("\(quest.estimatedTime)分", systemImage: "clock")
                    .font(.sm)
                    .foregroundColor(.mistGray)
                Spacer()
                Text(quest.difficulty.rawValue)
                    .font(.xs)
                    .fontWeight(.semibold)
                    .foregroundColor(.nightSky)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 4)
                    .background(Color.moonlightGold.opacity(0.3))
                    .cornerRadius(.radiusFull)
            }
        }
        .padding(.spacing5)
        .background(Color.cloudWhite)
        .cornerRadius(.radiusLg)
        .shadow(color: Color.nightSky.opacity(0.1), radius: 4, x: 0, y: 4)
    }
    
    private func questTypeIcon(_ type: QuestType) -> String {
        switch type {
        case .small: return "star.fill"
        case .medium: return "star.circle.fill"
        case .validation: return "checkmark.circle.fill"
        }
    }
}
```

### iOS Human Interface Guidelines準拠

**タップターゲットサイズ**
- 最小44x44pt（Appleの推奨）
- 重要なボタンは48x48pt以上

**セーフエリア**
```swift
.padding(.horizontal, .spacing4)
.safeAreaInset(edge: .bottom) {
    // ボトムバーなど
}
```

**ナビゲーション**
```swift
NavigationView {
    ContentView()
        .navigationTitle("今日のクエスト")
        .navigationBarTitleDisplayMode(.large)
}
```

**アクセシビリティ**
```swift
Text("クエスト完了")
    .accessibilityLabel("クエストを完了しました")
    .accessibilityHint("タップして詳細を表示")
    .accessibilityAddTraits(.isButton)
```

**Dynamic Type対応**
```swift
Text("タイトル")
    .font(.title)
    .dynamicTypeSize(...DynamicTypeSize.xxxLarge)
```

**ダークモード対応**
```swift
@Environment(\.colorScheme) var colorScheme

var backgroundColor: Color {
    colorScheme == .dark ? .nightSky : .cloudWhite
}
```

### アニメーション（SwiftUI）

**歩数獲得アニメーション**
```swift
@State private var isAnimating = false

Text("+100歩")
    .offset(y: isAnimating ? -20 : 0)
    .opacity(isAnimating ? 0 : 1)
    .onAppear {
        withAnimation(.easeOut(duration: 0.5)) {
            isAnimating = true
        }
    }
```

**合目達成アニメーション**
```swift
@State private var isGlowing = false

Circle()
    .fill(Color.moonlightGold)
    .frame(width: 60, height: 60)
    .shadow(color: .moonlightGold, radius: isGlowing ? 20 : 10)
    .onAppear {
        withAnimation(.easeInOut(duration: 1.0).repeatForever(autoreverses: true)) {
            isGlowing = true
        }
    }
```

### プラットフォーム別の考慮事項

**Web版（ChatGPT Apps SDK）**
- 会話型UIとの統合
- Widget Stateの制約（約4kトークン）
- カスタムコンポーネントの制限

**iOS版（SwiftUI）**
- iOS Human Interface Guidelines準拠
- ネイティブコンポーネントの活用
- システムフォント、システムカラーとの調和
- ダークモード完全対応
- Dynamic Type完全対応
- VoiceOver完全対応
- ハプティックフィードバック
- ジェスチャー（スワイプ、ロングプレス等）
