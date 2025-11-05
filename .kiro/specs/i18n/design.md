# 設計書：多言語対応（国際化）

## 概要

climb-youアプリケーションの多言語対応（i18n）は、日本語と英語をサポートし、将来的な言語拡張を容易にする設計とする。翻訳ファイルはJSON形式で管理し、React（Web版）とReact Native（モバイル版）の両方で共通の翻訳キー構造を使用する。動的コンテンツの翻訳、複数形対応、日付・時刻のローカライズを実装する。

## アーキテクチャ

### システム構成

```
┌─────────────────────────────────────────┐
│   アプリケーション層                      │
│   - React (Web)                         │
│   - React Native (Mobile)               │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│   i18nライブラリ                         │
│   - react-i18next (Web & Mobile)        │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│   翻訳ファイル                           │
│   - locales/ja.json                     │
│   - locales/en.json                     │
└─────────────────────────────────────────┘
```

### 技術スタック

**Web版（React）:**
- i18next: 国際化フレームワーク
- react-i18next: React統合
- i18next-browser-languagedetector: 言語自動検出
- date-fns: 日付フォーマット
- Intl API: 数値フォーマット

**モバイル版（React Native）:**
- react-i18next: React Native統合
- expo-localization: デバイス言語検出
- AsyncStorage: 言語設定の永続化
- Intl API: 日付・数値フォーマット

## コンポーネントとインターフェース

### 1. Web版の実装

#### i18n設定

**i18n.ts**
```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import ja from './locales/ja.json';
import en from './locales/en.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ja: { translation: ja },
      en: { translation: en }
    },
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  });

export default i18n;
```


#### 翻訳フック

**useTranslation.ts**
```typescript
import { useTranslation as useI18nTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { ja, enUS } from 'date-fns/locale';

export const useTranslation = () => {
  const { t, i18n } = useI18nTranslation();
  
  const formatDate = (date: Date, formatStr: string = 'PPP') => {
    const locale = i18n.language === 'ja' ? ja : enUS;
    return format(date, formatStr, { locale });
  };
  
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat(i18n.language).format(num);
  };
  
  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return t('time_ago.just_now');
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return t('time_ago.minutes_ago', { count: minutes });
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return t('time_ago.hours_ago', { count: hours });
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return t('time_ago.days_ago', { count: days });
    }
  };
  
  return {
    t,
    i18n,
    formatDate,
    formatNumber,
    formatRelativeTime
  };
};
```

#### 言語切り替えコンポーネント

**LanguageSwitcher.tsx**
```typescript
import React from 'react';
import { useTranslation } from './useTranslation';

export const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };
  
  return (
    <div className="language-switcher">
      <button
        onClick={() => changeLanguage('ja')}
        className={i18n.language === 'ja' ? 'active' : ''}
      >
        日本語
      </button>
      <button
        onClick={() => changeLanguage('en')}
        className={i18n.language === 'en' ? 'active' : ''}
      >
        English
      </button>
    </div>
  );
};
```

### 2. モバイル版（React Native）の実装

#### i18n設定

**i18n.ts**
```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import ja from './locales/ja.json';
import en from './locales/en.json';

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

#### 翻訳フック

**useTranslation.ts**
```typescript
import { useTranslation as useI18nTranslation } from 'react-i18next';

export const useTranslation = () => {
  const { t, i18n } = useI18nTranslation();
  
  const formatDate = (date: Date, options?: Intl.DateTimeFormatOptions) => {
    return new Intl.DateTimeFormat(i18n.language, options).format(date);
  };
  
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat(i18n.language).format(num);
  };
  
  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return t('time_ago.just_now');
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return t('time_ago.minutes_ago', { count: minutes });
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return t('time_ago.hours_ago', { count: hours });
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return t('time_ago.days_ago', { count: days });
    }
  };
  
  return {
    t,
    i18n,
    formatDate,
    formatNumber,
    formatRelativeTime
  };
};
```

#### 言語切り替えコンポーネント

**LanguageSettingsScreen.tsx**
```typescript
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from './useTranslation';
import { changeLanguage } from './i18n';

const SUPPORTED_LANGUAGES = [
  { code: 'ja', name: '日本語' },
  { code: 'en', name: 'English' }
];

export const LanguageSettingsScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  
  const handleLanguageChange = async (languageCode: string) => {
    await changeLanguage(languageCode);
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('settings.language')}</Text>
      {SUPPORTED_LANGUAGES.map(({ code, name }) => (
        <TouchableOpacity
          key={code}
          style={styles.languageButton}
          onPress={() => handleLanguageChange(code)}
        >
          <Text style={styles.languageName}>{name}</Text>
          {i18n.language === code && (
            <Text style={styles.checkmark}>✓</Text>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16
  },
  languageButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  languageName: {
    fontSize: 18
  },
  checkmark: {
    fontSize: 20,
    color: '#007AFF'
  }
});
```

#### RTL対応の準備

**RTLSupport.ts**
```typescript
import { I18nManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RTL_LANGUAGES = ['ar', 'he', 'fa'];

export const isRTL = (languageCode: string): boolean => {
  return RTL_LANGUAGES.includes(languageCode);
};

export const setupRTL = async (languageCode: string) => {
  const shouldBeRTL = isRTL(languageCode);
  
  if (I18nManager.isRTL !== shouldBeRTL) {
    I18nManager.forceRTL(shouldBeRTL);
    // RTL変更にはアプリの再起動が必要
    await AsyncStorage.setItem('rtl_enabled', shouldBeRTL.toString());
    // ユーザーにアプリ再起動を促す
  }
};
```

**RTL対応のスタイル**
```typescript
import { StyleSheet, I18nManager } from 'react-native';

export const createRTLStyles = () => {
  return StyleSheet.create({
    container: {
      flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
      paddingStart: 16, // 自動的にRTLで反転
      paddingEnd: 16
    },
    text: {
      textAlign: I18nManager.isRTL ? 'right' : 'left'
    }
  });
};
```

## 翻訳ファイル構造

### 共通の翻訳キー構造

```json
{
  "common": {
    "app_name": "climb-you",
    "ok": "OK",
    "cancel": "キャンセル",
    "save": "保存",
    "delete": "削除",
    "edit": "編集",
    "back": "戻る",
    "next": "次へ",
    "done": "完了",
    "loading": "読み込み中...",
    "error": "エラーが発生しました"
  },
  "auth": {
    "login": "ログイン",
    "logout": "ログアウト",
    "sign_in_with_apple": "Appleでサインイン",
    "sign_in_with_google": "Googleでサインイン"
  },
  "onboarding": {
    "welcome": "climb-youへようこそ",
    "welcome_message": "目標達成を支援するアプリです",
    "goal_input": "目標を入力してください",
    "goal_placeholder": "例：TOEIC 800点を取得する",
    "obstacles": "障害を特定",
    "duration": "期間を選択",
    "profile": "プロファイル設定",
    "milestones": "マイルストーン"
  },
  "quest": {
    "today_quests": "今日のクエスト",
    "quest_detail": "クエスト詳細",
    "complete": "完了",
    "skip": "見送り",
    "obstruct": "阻害",
    "small_quest": "小クエスト",
    "medium_quest": "中クエスト",
    "validation_quest": "検証クエスト",
    "estimated_time": "所要時間：{{time}}分",
    "difficulty": {
      "easy": "簡単",
      "medium": "普通",
      "challenging": "挑戦的"
    }
  },
  "progress": {
    "current_station": "現在：{{station}}合目",
    "total_steps": "累計：{{steps}}歩",
    "current_streak": "{{count}}日連続",
    "steps_to_next": "次の合目まであと{{steps}}歩",
    "milestone_achieved": "{{station}}合目達成！"
  },
  "ranking": {
    "weekly_ranking": "週次ランキング",
    "your_rank": "あなたの順位：{{rank}}位",
    "same_level": "同レベル帯"
  },
  "settings": {
    "title": "設定",
    "language": "言語",
    "notifications": "通知",
    "profile": "プロファイル",
    "data_management": "データ管理",
    "privacy": "プライバシー",
    "about": "アプリについて"
  },
  "notification": {
    "quest_ready": "今日のクエストが準備できました",
    "milestone_achieved": "{{station}}合目達成おめでとうございます！",
    "streak_reminder": "今日のクエストを忘れずに",
    "ranking_update": "週次ランキングが更新されました"
  },
  "error": {
    "network_error": "ネットワークエラーが発生しました",
    "auth_error": "認証エラーが発生しました",
    "unknown_error": "予期しないエラーが発生しました",
    "try_again": "もう一度お試しください"
  },
  "time_ago": {
    "just_now": "たった今",
    "minutes_ago": "{{count}}分前",
    "hours_ago": "{{count}}時間前",
    "days_ago": "{{count}}日前"
  },
  "date_format": {
    "short": "yyyy/MM/dd",
    "medium": "yyyy年MM月dd日",
    "long": "yyyy年MM月dd日 HH:mm"
  }
}
```

## 複数形対応

### Web版（i18next）

```json
{
  "steps_earned": "{{count}}歩獲得しました！",
  "days_streak": "{{count}}日連続",
  "quests_completed": {
    "one": "{{count}}個のクエストを完了",
    "other": "{{count}}個のクエストを完了"
  }
}
```

### iOS版（Stringsdict）

**ja.lproj/Localizable.stringsdict**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>quests_completed</key>
    <dict>
        <key>NSStringLocalizedFormatKey</key>
        <string>%#@count@個のクエストを完了</string>
        <key>count</key>
        <dict>
            <key>NSStringFormatSpecTypeKey</key>
            <string>NSStringPluralRuleType</string>
            <key>NSStringFormatValueTypeKey</key>
            <string>d</string>
            <key>other</key>
            <string>%d</string>
        </dict>
    </dict>
</dict>
</plist>
```


## 翻訳管理ワークフロー

### 開発フロー

1. **翻訳キーの追加**
   - 新機能開発時に翻訳キーを定義
   - en.jsonに英語翻訳を追加（デフォルト）
   - ja.jsonに日本語翻訳を追加

2. **翻訳の検証**
   - 翻訳キーの欠落チェック
   - 未使用キーの検出
   - フォーマット文字列の検証

3. **レビュー**
   - ネイティブスピーカーによるレビュー
   - 文脈の確認
   - 用語の統一

### 翻訳検証ツール（強化版）

#### Web版検証ツール

**translation-validator.ts**
```typescript
import fs from 'fs';
import path from 'path';

interface TranslationFile {
  [key: string]: any;
}

class TranslationValidator {
  private baseLanguage = 'en';
  private languages = ['ja', 'en'];
  private errors: string[] = [];
  private warnings: string[] = [];
  
  validate(): boolean {
    console.log('🔍 Starting translation validation...\n');
    
    const baseTranslations = this.loadTranslations(this.baseLanguage);
    const baseKeys = this.flattenKeys(baseTranslations);
    
    for (const lang of this.languages) {
      if (lang === this.baseLanguage) continue;
      
      console.log(`Checking ${lang}...`);
      
      const translations = this.loadTranslations(lang);
      const keys = this.flattenKeys(translations);
      
      // 欠落キーのチェック
      const missingKeys = baseKeys.filter(key => !keys.includes(key));
      if (missingKeys.length > 0) {
        this.errors.push(`Missing keys in ${lang}:`);
        missingKeys.forEach(key => this.errors.push(`  - ${key}`));
      }
      
      // 余分なキーのチェック
      const extraKeys = keys.filter(key => !baseKeys.includes(key));
      if (extraKeys.length > 0) {
        this.warnings.push(`Extra keys in ${lang}:`);
        extraKeys.forEach(key => this.warnings.push(`  - ${key}`));
      }
      
      // 変数補間のチェック
      this.validateInterpolation(baseTranslations, translations, lang);
    }
    
    this.printResults();
    return this.errors.length === 0;
  }
  
  private validateInterpolation(base: any, target: any, lang: string, prefix = '') {
    for (const key in base) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof base[key] === 'string' && typeof target[key] === 'string') {
        const baseVars = this.extractVariables(base[key]);
        const targetVars = this.extractVariables(target[key]);
        
        if (baseVars.length !== targetVars.length || 
            !baseVars.every(v => targetVars.includes(v))) {
          this.warnings.push(
            `Variable mismatch in ${lang} for key "${fullKey}": ` +
            `expected ${JSON.stringify(baseVars)}, got ${JSON.stringify(targetVars)}`
          );
        }
      } else if (typeof base[key] === 'object' && typeof target[key] === 'object') {
        this.validateInterpolation(base[key], target[key], lang, fullKey);
      }
    }
  }
  
  private extractVariables(str: string): string[] {
    const matches = str.match(/\{\{(\w+)\}\}/g);
    return matches ? matches.map(m => m.slice(2, -2)) : [];
  }
  
  private loadTranslations(lang: string): TranslationFile {
    const filePath = path.join(__dirname, `../locales/${lang}.json`);
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }
  
  private flattenKeys(obj: any, prefix = ''): string[] {
    let keys: string[] = [];
    
    for (const key in obj) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
        keys = keys.concat(this.flattenKeys(obj[key], fullKey));
      } else {
        keys.push(fullKey);
      }
    }
    
    return keys;
  }
  
  private printResults() {
    console.log('\n' + '='.repeat(50));
    
    if (this.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      this.errors.forEach(err => console.log(err));
    }
    
    if (this.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      this.warnings.forEach(warn => console.log(warn));
    }
    
    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('\n✅ All translations are valid!');
    }
    
    console.log('\n' + '='.repeat(50));
  }
}

// 実行
const validator = new TranslationValidator();
const isValid = validator.validate();
process.exit(isValid ? 0 : 1);
```

#### モバイル版検証ツール

**translation-validator-mobile.ts**
```typescript
import fs from 'fs';
import path from 'path';

interface TranslationFile {
  [key: string]: any;
}

class MobileTranslationValidator {
  private baseLanguage = 'en';
  private languages = ['ja', 'en'];
  private errors: string[] = [];
  private warnings: string[] = [];
  
  validate(): boolean {
    console.log('🔍 Starting mobile translation validation...\n');
    
    const baseTranslations = this.loadTranslations(this.baseLanguage);
    const baseKeys = this.flattenKeys(baseTranslations);
    
    for (const lang of this.languages) {
      if (lang === this.baseLanguage) continue;
      
      console.log(`Checking ${lang}...`);
      
      const translations = this.loadTranslations(lang);
      const keys = this.flattenKeys(translations);
      
      // 欠落キーのチェック
      const missingKeys = baseKeys.filter(key => !keys.includes(key));
      if (missingKeys.length > 0) {
        this.errors.push(`Missing keys in ${lang}:`);
        missingKeys.forEach(key => this.errors.push(`  - ${key}`));
      }
      
      // 余分なキーのチェック
      const extraKeys = keys.filter(key => !baseKeys.includes(key));
      if (extraKeys.length > 0) {
        this.warnings.push(`Extra keys in ${lang}:`);
        extraKeys.forEach(key => this.warnings.push(`  - ${key}`));
      }
      
      // 変数補間のチェック
      this.validateInterpolation(baseTranslations, translations, lang);
    }
    
    this.printResults();
    return this.errors.length === 0;
  }
  
  private validateInterpolation(base: any, target: any, lang: string, prefix = '') {
    for (const key in base) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof base[key] === 'string' && typeof target[key] === 'string') {
        const baseVars = this.extractVariables(base[key]);
        const targetVars = this.extractVariables(target[key]);
        
        if (baseVars.length !== targetVars.length || 
            !baseVars.every(v => targetVars.includes(v))) {
          this.warnings.push(
            `Variable mismatch in ${lang} for key "${fullKey}": ` +
            `expected ${JSON.stringify(baseVars)}, got ${JSON.stringify(targetVars)}`
          );
        }
      } else if (typeof base[key] === 'object' && typeof target[key] === 'object') {
        this.validateInterpolation(base[key], target[key], lang, fullKey);
      }
    }
  }
  
  private extractVariables(str: string): string[] {
    const matches = str.match(/\{\{(\w+)\}\}/g);
    return matches ? matches.map(m => m.slice(2, -2)) : [];
  }
  
  private loadTranslations(lang: string): TranslationFile {
    const filePath = path.join(__dirname, `../locales/${lang}.json`);
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }
  
  private flattenKeys(obj: any, prefix = ''): string[] {
    let keys: string[] = [];
    
    for (const key in obj) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
        keys = keys.concat(this.flattenKeys(obj[key], fullKey));
      } else {
        keys.push(fullKey);
      }
    }
    
    return keys;
  }
  
  private printResults() {
    console.log('\n' + '='.repeat(50));
    
    if (this.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      this.errors.forEach(err => console.log(err));
    }
    
    if (this.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      this.warnings.forEach(warn => console.log(warn));
    }
    
    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('\n✅ All mobile translations are valid!');
    }
    
    console.log('\n' + '='.repeat(50));
  }
}

// 実行
const validator = new MobileTranslationValidator();
const isValid = validator.validate();
process.exit(isValid ? 0 : 1);
```

## テスト戦略

### 翻訳のテスト

**translation.test.ts**
```typescript
import { describe, it, expect } from 'vitest';
import i18n from './i18n';
import ja from './locales/ja.json';
import en from './locales/en.json';

describe('Translation Tests', () => {
  it('should have all keys in both languages', () => {
    const jaKeys = Object.keys(flattenObject(ja));
    const enKeys = Object.keys(flattenObject(en));
    
    expect(jaKeys.sort()).toEqual(enKeys.sort());
  });
  
  it('should translate common keys', () => {
    i18n.changeLanguage('ja');
    expect(i18n.t('common.ok')).toBe('OK');
    
    i18n.changeLanguage('en');
    expect(i18n.t('common.ok')).toBe('OK');
  });
  
  it('should handle interpolation', () => {
    i18n.changeLanguage('ja');
    expect(i18n.t('steps.earned', { count: 100 })).toBe('100歩獲得しました！');
    
    i18n.changeLanguage('en');
    expect(i18n.t('steps.earned', { count: 100 })).toBe('Earned 100 steps!');
  });
  
  it('should fallback to default language', () => {
    i18n.changeLanguage('ja');
    expect(i18n.t('non.existent.key')).toBe('non.existent.key');
  });
});

function flattenObject(obj: any, prefix = ''): any {
  return Object.keys(obj).reduce((acc: any, key: string) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
      Object.assign(acc, flattenObject(obj[key], fullKey));
    } else {
      acc[fullKey] = obj[key];
    }
    
    return acc;
  }, {});
}
```

### モバイル版翻訳のテスト

**i18n.test.ts**
```typescript
import { describe, it, expect, beforeEach } from '@jest/globals';
import i18n, { changeLanguage } from './i18n';
import ja from './locales/ja.json';
import en from './locales/en.json';

describe('Mobile I18n Tests', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
  });

  it('should have all keys in both languages', () => {
    const jaKeys = Object.keys(flattenObject(ja));
    const enKeys = Object.keys(flattenObject(en));
    
    expect(jaKeys.sort()).toEqual(enKeys.sort());
  });
  
  it('should translate common keys', async () => {
    await changeLanguage('ja');
    expect(i18n.t('common.ok')).toBe('OK');
    
    await changeLanguage('en');
    expect(i18n.t('common.ok')).toBe('OK');
  });
  
  it('should handle interpolation', async () => {
    await changeLanguage('ja');
    expect(i18n.t('progress.current_station', { station: 3 })).toBe('現在：3合目');
    
    await changeLanguage('en');
    expect(i18n.t('progress.current_station', { station: 3 })).toBe('Current: Station 3');
  });
  
  it('should persist language selection', async () => {
    await changeLanguage('ja');
    expect(i18n.language).toBe('ja');
    
    // AsyncStorageに保存されることを確認
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const savedLanguage = await AsyncStorage.getItem('app_language');
    expect(savedLanguage).toBe('ja');
  });
});

function flattenObject(obj: any, prefix = ''): any {
  return Object.keys(obj).reduce((acc: any, key: string) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
      Object.assign(acc, flattenObject(obj[key], fullKey));
    } else {
      acc[fullKey] = obj[key];
    }
    
    return acc;
  }, {});
}
```

## パフォーマンス最適化

### 翻訳のキャッシング

```typescript
class TranslationCache {
  private cache = new Map<string, string>();
  
  get(key: string, lang: string): string | undefined {
    return this.cache.get(`${lang}:${key}`);
  }
  
  set(key: string, lang: string, value: string): void {
    this.cache.set(`${lang}:${key}`, value);
  }
  
  clear(): void {
    this.cache.clear();
  }
}
```

### 遅延読み込み

```typescript
// 大きな翻訳ファイルを分割
const loadTranslations = async (lang: string, namespace: string) => {
  const translations = await import(`./locales/${lang}/${namespace}.json`);
  return translations.default;
};
```

## 将来の拡張性

### 新言語の追加

1. 新しい翻訳ファイルを作成（例：zh.json）
2. i18n設定に言語を追加
3. 翻訳を実施
4. テストを実行
5. 言語切り替えUIに追加

### RTL対応（詳細）

#### Web版RTL対応

```typescript
// RTL言語の検出
const isRTL = (lang: string) => {
  return ['ar', 'he', 'fa'].includes(lang);
};

// CSSクラスの適用
document.documentElement.dir = isRTL(currentLanguage) ? 'rtl' : 'ltr';
document.documentElement.lang = currentLanguage;

// RTL対応のCSSクラス
document.body.classList.toggle('rtl', isRTL(currentLanguage));
```

**RTL対応CSS**
```css
/* 論理プロパティの使用 */
.container {
  padding-inline-start: 16px;
  padding-inline-end: 16px;
  margin-inline-start: auto;
  margin-inline-end: auto;
}

/* RTL時のアイコン反転 */
.rtl .icon-arrow {
  transform: scaleX(-1);
}

/* テキスト方向 */
.text {
  text-align: start; /* left/rightの代わりにstart/endを使用 */
}
```

#### iOS版RTL対応

```swift
// iOS RTL対応
extension View {
    func applyRTL() -> some View {
        self.environment(\.layoutDirection, 
            LocalizationManager.shared.isRTL ? .rightToLeft : .leftToRight)
    }
}

// RTL対応のレイアウト例
struct RTLAwareView: View {
    var body: some View {
        HStack {
            // leading/trailingを使用（自動的にRTLで反転）
            Image(systemName: "star.fill")
                .padding(.leading, 8)
            
            VStack(alignment: .leading) {
                Text("Title")
                Text("Description")
            }
            
            Spacer()
            
            Image(systemName: "chevron.forward")
                .padding(.trailing, 8)
        }
        .applyRTL()
    }
}

// RTL時のアイコン反転
extension Image {
    func mirrorForRTL() -> some View {
        self.rotationEffect(.degrees(LocalizationManager.shared.isRTL ? 180 : 0))
    }
}
```

## CI/CD統合

### package.jsonスクリプト

```json
{
  "scripts": {
    "i18n:validate": "ts-node scripts/translation-validator.ts",
    "i18n:extract": "i18next-scanner --config i18next-scanner.config.js",
    "test:i18n": "vitest run src/**/*.i18n.test.ts"
  }
}
```

### GitHub Actions統合

**.github/workflows/i18n-validation.yml**
```yaml
name: I18n Validation

on:
  pull_request:
    paths:
      - 'locales/**'
      - 'src/**/*.ts'
      - 'src/**/*.tsx'

jobs:
  validate:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Validate translations
      run: npm run i18n:validate
    
    - name: Run i18n tests
      run: npm run test:i18n
```

## ベストプラクティス

### 翻訳キーの命名規則

1. **階層構造を使用**
   ```
   common.ok
   quest.today_quests
   error.network_error
   ```

2. **動詞は命令形**
   ```
   common.save (保存)
   common.delete (削除)
   quest.complete (完了)
   ```

3. **変数は明確に**
   ```
   progress.current_station (現在：{{station}}合目)
   steps.earned ({{steps}}歩獲得)
   ```

### 翻訳のコンテキスト

翻訳ファイルにコメントを追加してコンテキストを明確にする：

```json
{
  "quest": {
    "complete": "完了", // ボタンラベル
    "complete_message": "クエストを完了しました", // 成功メッセージ
    "complete_confirmation": "このクエストを完了しますか？" // 確認ダイアログ
  }
}
```

### パフォーマンスの考慮

1. **翻訳のキャッシング** - 頻繁に使用される翻訳をキャッシュ
2. **遅延読み込み** - 大きな翻訳ファイルを分割
3. **バンドルサイズの最適化** - 未使用キーの削除

## まとめ

本設計書では、climb-youアプリケーションの多言語対応（i18n）の実装方針を定義した。Web版とモバイル版（React Native）の両方でreact-i18nextを使用し、共通の翻訳キー構造を維持する。

**主要な実装内容：**

1. **動的な言語切り替え** - アプリ再起動不要
2. **階層的な翻訳キー構造** - 機能ごとにグループ化
3. **動的コンテンツの翻訳** - 変数補間、複数形対応
4. **日付・時刻のローカライズ** - 地域に応じたフォーマット
5. **翻訳検証ツール** - 欠落キーの検出、変数補間のチェック
6. **RTL対応の準備** - 将来のアラビア語・ヘブライ語対応
7. **CI/CD統合** - 自動検証とテスト

翻訳品質を保証するための検証ツールとテストを提供し、将来的な言語拡張を容易にする設計とする。新しい言語を追加する際は、翻訳ファイルを作成し、検証ツールで確認するだけで対応可能。

