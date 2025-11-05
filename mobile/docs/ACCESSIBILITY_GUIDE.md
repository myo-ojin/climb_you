# アクセシビリティ実装ガイド

Climb You モバイルアプリの開発者向けアクセシビリティ実装ガイドです。
新しいコンポーネントや画面を追加する際は、このガイドに従ってください。

## 目次

1. [基本原則](#基本原則)
2. [利用可能なフック](#利用可能なフック)
3. [利用可能なユーティリティ](#利用可能なユーティリティ)
4. [コンポーネント実装例](#コンポーネント実装例)
5. [テストの書き方](#テストの書き方)
6. [チェックリスト](#チェックリスト)

---

## 基本原則

### 1. すべてのインタラクティブ要素にラベルを付ける

```tsx
// ❌ 悪い例
<TouchableOpacity onPress={handlePress}>
  <Icon name="close" />
</TouchableOpacity>

// ✅ 良い例
<TouchableOpacity
  onPress={handlePress}
  accessibilityLabel="閉じる"
  accessibilityRole="button"
>
  <Icon name="close" />
</TouchableOpacity>
```

### 2. セマンティックなroleを使用する

```tsx
// 使用可能なaccessibilityRole
'none' | 'button' | 'link' | 'search' | 'image' | 'keyboardkey' |
'text' | 'adjustable' | 'imagebutton' | 'header' | 'summary' |
'alert' | 'checkbox' | 'combobox' | 'menu' | 'menubar' |
'menuitem' | 'progressbar' | 'radio' | 'radiogroup' |
'scrollbar' | 'spinbutton' | 'switch' | 'tab' | 'tablist' |
'timer' | 'toolbar'
```

### 3. 動的テキストサイズに対応する

```tsx
import { ScaledText } from '@/shared/components';

// ❌ 悪い例
<Text style={{ fontSize: 16 }}>Hello</Text>

// ✅ 良い例
<ScaledText baseFontSize={16}>Hello</ScaledText>
```

### 4. 色だけでなく、アイコンやテキストで情報を伝える

```tsx
// ✅ 良い例: 色 + アイコン + テキスト
<View style={styles.statusContainer}>
  <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
  <Icon name={statusIcon} />
  <ScaledText>{statusLabel}</ScaledText>
</View>
```

### 5. タッチターゲットサイズは44x44pt以上

```tsx
import { ensureTouchTargetSize } from '@/shared/utils';

const buttonStyle = ensureTouchTargetSize({
  width: 30,
  height: 30,
  backgroundColor: '#007AFF',
});
```

---

## 利用可能なフック

### 1. useAccessibility

フル機能版のアクセシビリティフック。

```tsx
import { useAccessibility } from '@/shared/hooks';

const MyComponent = () => {
  const {
    isScreenReaderEnabled,
    isReduceMotionEnabled,
    isBoldTextEnabled,
    isReduceTransparencyEnabled,
    announce,
    setFocus,
  } = useAccessibility();

  // スクリーンリーダーが有効な場合は詳細な説明を表示
  if (isScreenReaderEnabled) {
    return <DetailedView />;
  }

  return <StandardView />;
};
```

### 2. useAccessibleTheme

アクセシビリティ設定を考慮したテーマ選択。

```tsx
import { useAccessibleTheme } from '@/shared/hooks';

const MyComponent = () => {
  const theme = useAccessibleTheme();
  // ハイコントラストモードが有効な場合、自動的にHighContrastテーマを返す

  return (
    <View style={{ backgroundColor: theme.background }}>
      <ScaledText style={{ color: theme.text }}>Hello</ScaledText>
    </View>
  );
};
```

### 3. useReduceMotion

モーション低減設定のチェック。

```tsx
import { useReduceMotion } from '@/shared/hooks';
import { adjustAnimationDuration } from '@/shared/utils';

const MyComponent = () => {
  const isReduceMotionEnabled = useReduceMotion();
  const animationDuration = adjustAnimationDuration(300, isReduceMotionEnabled);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
      }}
      // animationDurationが0の場合はアニメーションなし
    />
  );
};
```

### 4. useDynamicTextSize

動的テキストサイズのスケーリング。

```tsx
import { useDynamicTextSize } from '@/shared/hooks';

const MyComponent = () => {
  const { scaleFont, isLargeTextEnabled } = useDynamicTextSize({
    maxScale: 1.5,
    minScale: 0.85,
  });

  const scaledFontSize = scaleFont(16);

  return <Text style={{ fontSize: scaledFontSize }}>Hello</Text>;
};
```

### 5. useHighContrast

ハイコントラストモードの検知。

```tsx
import { useHighContrast } from '@/shared/hooks';

const MyComponent = () => {
  const isHighContrast = useHighContrast();

  return (
    <View
      style={{
        borderWidth: isHighContrast ? 2 : 1,
        borderColor: isHighContrast ? '#000' : '#ccc',
      }}
    >
      <Text>Content</Text>
    </View>
  );
};
```

---

## 利用可能なユーティリティ

### 1. タッチターゲットサイズ

```tsx
import {
  MIN_TOUCH_TARGET_SIZE,
  checkTouchTargetSize,
  ensureTouchTargetSize,
} from '@/shared/utils';

// チェック
const check = checkTouchTargetSize({ width: 30, height: 30 });
if (!check.isValid) {
  console.warn('タッチターゲットが小さすぎます', check.warnings);
}

// 自動調整
const buttonStyle = ensureTouchTargetSize({
  width: 30,
  height: 30,
});
// 結果: { width: 30, height: 30, minWidth: 44, minHeight: 44 }
```

### 2. コントラスト比チェック

```tsx
import {
  checkContrast,
  meetsWCAG_AA_NormalText,
  calculateContrastRatio,
} from '@/shared/utils';

// シンプルなチェック
const isAccessible = meetsWCAG_AA_NormalText('#3C507D', '#FFFFFF');
// true（コントラスト比が4.5:1以上）

// 詳細チェック
const result = checkContrast('#3C507D', '#FFFFFF');
console.log(result);
// {
//   ratio: 5.8,
//   aa_normalText: true,
//   aa_largeText: true,
//   aa_uiComponent: true,
//   aaa_normalText: false,
//   aaa_largeText: true,
// }

// コントラスト比の計算
const ratio = calculateContrastRatio('#FFFFFF', '#000000');
console.log(ratio); // 21
```

### 3. ハイコントラスト対応

```tsx
import { adjustForHighContrast } from '@/shared/utils';

const isHighContrast = useHighContrast();
const style = adjustForHighContrast(
  { borderWidth: 1, borderColor: '#ccc' },
  isHighContrast
);
// ハイコントラスト時: { borderWidth: 2, borderColor: '#ccc' }
```

### 4. 透明度削減対応

```tsx
import { adjustForReduceTransparency } from '@/shared/utils';

const isReduceTransparency = useReduceTransparency();
const overlayColor = adjustForReduceTransparency(
  'rgba(0, 0, 0, 0.5)',
  isReduceTransparency
);
// 透明度削減時: 'rgba(0, 0, 0, 0.9)'
```

### 5. 色の区別可能性チェック

```tsx
import { checkColorDistinguishability } from '@/shared/utils';

// 色だけでなく、アイコンやラベルがあるか確認
const hasIcon = true;
const hasLabel = false;
const isDistinguishable = checkColorDistinguishability(hasIcon, hasLabel);
// true（アイコンがあるので区別可能）
```

---

## コンポーネント実装例

### ボタンコンポーネント

```tsx
import React from 'react';
import { TouchableOpacity, ViewStyle } from 'react-native';
import { ScaledText } from '@/shared/components';
import { useAccessibleTheme, useReduceMotion } from '@/shared/hooks';
import { ensureTouchTargetSize, adjustAnimationDuration } from '@/shared/utils';

interface ButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  accessibilityHint?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  disabled = false,
  accessibilityHint,
}) => {
  const theme = useAccessibleTheme();
  const isReduceMotionEnabled = useReduceMotion();

  const buttonStyle = ensureTouchTargetSize({
    backgroundColor: disabled ? theme.colors.gray[400] : theme.colors.mountainBlue,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  });

  const activeOpacity = isReduceMotionEnabled ? 1 : 0.7;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={buttonStyle}
      activeOpacity={activeOpacity}
      accessibilityLabel={title}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      accessibilityHint={accessibilityHint}
    >
      <ScaledText
        baseFontSize={16}
        style={{ color: theme.colors.white, textAlign: 'center' }}
      >
        {title}
      </ScaledText>
    </TouchableOpacity>
  );
};
```

### リストアイテムコンポーネント

```tsx
import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { ScaledText, ScaledCaption } from '@/shared/components';
import { useAccessibleTheme, useBorderStyle } from '@/shared/hooks';
import { ensureTouchTargetSize } from '@/shared/utils';

interface ListItemProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  onPress: () => void;
}

export const ListItem: React.FC<ListItemProps> = ({
  title,
  subtitle,
  icon,
  onPress,
}) => {
  const theme = useAccessibleTheme();
  const borderStyle = useBorderStyle();

  const accessibilityLabel = subtitle
    ? `${title}、${subtitle}`
    : title;

  const containerStyle = ensureTouchTargetSize({
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: theme.surface,
    ...borderStyle,
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      style={containerStyle}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
    >
      {icon && (
        <View style={{ marginRight: 12 }} accessibilityElementsHidden={true}>
          {icon}
        </View>
      )}
      <View style={{ flex: 1 }}>
        <ScaledText baseFontSize={16} style={{ color: theme.text }}>
          {title}
        </ScaledText>
        {subtitle && (
          <ScaledCaption baseFontSize={14} style={{ color: theme.textSecondary }}>
            {subtitle}
          </ScaledCaption>
        )}
      </View>
    </TouchableOpacity>
  );
};
```

---

## テストの書き方

### アクセシビリティプロパティのテスト

```tsx
import { render } from '@testing-library/react-native';
import { Button } from '../Button';

describe('Button - Accessibility', () => {
  it('accessibilityLabelが設定されている', () => {
    const { getByRole } = render(<Button title="送信" onPress={() => {}} />);

    const button = getByRole('button');
    expect(button.props.accessibilityLabel).toBe('送信');
  });

  it('accessibilityRoleがbuttonとして設定されている', () => {
    const { getByRole } = render(<Button title="送信" onPress={() => {}} />);

    const button = getByRole('button');
    expect(button.props.accessibilityRole).toBe('button');
  });

  it('disabled状態がaccessibilityStateに反映される', () => {
    const { getByRole } = render(
      <Button title="送信" onPress={() => {}} disabled={true} />
    );

    const button = getByRole('button');
    expect(button.props.accessibilityState.disabled).toBe(true);
  });
});
```

### コントラスト比のテスト

```tsx
import { checkContrast } from '@/shared/utils';

describe('Button - Color Contrast', () => {
  it('ボタンのテキストと背景のコントラスト比がWCAG AA基準を満たす', () => {
    const textColor = '#FFFFFF';
    const backgroundColor = '#3C507D';

    const result = checkContrast(textColor, backgroundColor);
    expect(result.aa_normalText).toBe(true);
  });
});
```

---

## チェックリスト

新しいコンポーネントを作成する際は、以下をチェックしてください。

### 必須項目

- [ ] すべてのインタラクティブ要素に `accessibilityLabel` を設定
- [ ] 適切な `accessibilityRole` を設定
- [ ] タッチターゲットサイズが44x44pt以上
- [ ] `ScaledText` / `ScaledBody` / `ScaledCaption` を使用
- [ ] `useAccessibleTheme` でテーマを取得
- [ ] 色だけでなく、アイコンやテキストで情報を伝達
- [ ] コントラスト比がWCAG AA基準を満たす（4.5:1以上）

### 推奨項目

- [ ] `accessibilityHint` で追加の説明を提供
- [ ] `accessibilityState` で状態を伝達（checked、disabled、selected など）
- [ ] モーション低減設定を尊重（`useReduceMotion`）
- [ ] ハイコントラストモードに対応（`useHighContrast`）
- [ ] `testID` を設定してテストを容易に

### テスト項目

- [ ] アクセシビリティプロパティのテストを追加
- [ ] スクリーンリーダーでの動作を確認（VoiceOver / TalkBack）
- [ ] 動的テキストサイズでの表示を確認（50%〜200%）
- [ ] ハイコントラストモードでの表示を確認

---

## 参考資料

### 内部ドキュメント
- [アクセシビリティ監査チェックリスト](./ACCESSIBILITY_AUDIT.md)

### 外部リソース
- [React Native Accessibility](https://reactnative.dev/docs/accessibility)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [iOS Human Interface Guidelines - Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)
- [Material Design - Accessibility](https://material.io/design/usability/accessibility.html)

---

**最終更新日**: 2025-11-03
