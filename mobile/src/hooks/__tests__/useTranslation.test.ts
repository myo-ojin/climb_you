/**
 * useTranslation Hook Tests
 * useTranslationフックのユニットテスト
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { renderHook, act } from '@testing-library/react-native';
import { useTranslation } from '../useTranslation';
import i18n from '@/config/i18n';

describe('useTranslation Hook', () => {
  beforeEach(async () => {
    // 各テスト前に英語に設定
    await i18n.changeLanguage('en');
  });

  describe('基本機能', () => {
    it('useTranslationフックが正しく動作する', () => {
      const { result } = renderHook(() => useTranslation());

      expect(result.current.t).toBeDefined();
      expect(result.current.i18n).toBeDefined();
      expect(result.current.formatDate).toBeDefined();
      expect(result.current.formatNumber).toBeDefined();
    });

    it('翻訳関数tが正しく動作する', () => {
      const { result } = renderHook(() => useTranslation());

      expect(result.current.t('common.ok')).toBe('OK');
      expect(result.current.t('common.cancel')).toBe('Cancel');
    });

    it('現在の言語が正しく取得される', () => {
      const { result } = renderHook(() => useTranslation());

      expect(result.current.currentLanguage).toBe('en');
      expect(result.current.isEnglish).toBe(true);
      expect(result.current.isJapanese).toBe(false);
    });
  });

  describe('日付フォーマット', () => {
    it('formatDateが正しく動作する', () => {
      const { result } = renderHook(() => useTranslation());
      const date = new Date('2025-10-19T12:00:00');

      const formatted = result.current.formatDate(date);

      expect(formatted).toMatch(/2025/);
      expect(formatted).toMatch(/10/);
      expect(formatted).toMatch(/19/);
    });

    it('formatDateTimeが正しく動作する', () => {
      const { result } = renderHook(() => useTranslation());
      const date = new Date('2025-10-19T14:30:00');

      const formatted = result.current.formatDateTime(date);

      expect(formatted).toMatch(/2025/);
      expect(formatted).toMatch(/10/);
      expect(formatted).toMatch(/19/);
      // 時刻も含まれる
      expect(formatted).toMatch(/:/);
    });

    it('formatTimeが正しく動作する', () => {
      const { result } = renderHook(() => useTranslation());
      const date = new Date('2025-10-19T14:30:00');

      const formatted = result.current.formatTime(date);

      // 時刻フォーマットが含まれる
      expect(formatted).toMatch(/:/);
    });
  });

  describe('数値フォーマット', () => {
    it('formatNumberが正しく動作する', () => {
      const { result } = renderHook(() => useTranslation());

      const formatted = result.current.formatNumber(1000);

      // ロケールに応じた数値フォーマット（英語の場合: 1,000）
      expect(formatted).toMatch(/1/);
      expect(formatted).toMatch(/0/);
    });

    it('formatCurrencyが正しく動作する', () => {
      const { result } = renderHook(() => useTranslation());

      const formatted = result.current.formatCurrency(1000, 'USD');

      // 通貨フォーマット（$1,000.00）
      expect(formatted).toMatch(/1/);
      expect(formatted).toMatch(/0/);
    });
  });

  describe('相対時刻フォーマット', () => {
    it('「たった今」が正しく表示される', async () => {
      await i18n.changeLanguage('ja');
      const { result } = renderHook(() => useTranslation());

      const now = new Date();
      const formatted = result.current.formatRelativeTime(now);

      expect(formatted).toBe('たった今');
    });

    it('「〜分前」が正しく表示される', async () => {
      await i18n.changeLanguage('ja');
      const { result } = renderHook(() => useTranslation());

      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const formatted = result.current.formatRelativeTime(fiveMinutesAgo);

      expect(formatted).toBe('5分前');
    });

    it('「〜時間前」が正しく表示される', async () => {
      await i18n.changeLanguage('ja');
      const { result } = renderHook(() => useTranslation());

      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const formatted = result.current.formatRelativeTime(twoHoursAgo);

      expect(formatted).toBe('2時間前');
    });

    it('「〜日前」が正しく表示される', async () => {
      await i18n.changeLanguage('ja');
      const { result } = renderHook(() => useTranslation());

      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      const formatted = result.current.formatRelativeTime(threeDaysAgo);

      expect(formatted).toBe('3日前');
    });
  });

  describe('言語切り替え', () => {
    it('changeLanguage関数で言語が変更される', async () => {
      const { result } = renderHook(() => useTranslation());

      await act(async () => {
        await result.current.changeLanguage('ja');
      });

      expect(result.current.currentLanguage).toBe('ja');
      expect(result.current.isJapanese).toBe(true);
      expect(result.current.isEnglish).toBe(false);
    });

    it('言語変更後に翻訳が正しく反映される', async () => {
      const { result } = renderHook(() => useTranslation());

      expect(result.current.t('common.cancel')).toBe('Cancel');

      await act(async () => {
        await result.current.changeLanguage('ja');
      });

      expect(result.current.t('common.cancel')).toBe('キャンセル');
    });
  });
});
