/**
 * useTranslation Hook
 * i18nextをラップし、翻訳機能と日付・数値フォーマットを提供
 */

import { useTranslation as useI18nTranslation } from 'react-i18next';
import { changeLanguage } from '@/config/i18n';

/**
 * カスタムuseTranslationフック
 * @returns 翻訳機能と便利なヘルパー関数
 */
export const useTranslation = () => {
  const { t, i18n } = useI18nTranslation();

  /**
   * 日付をフォーマットする
   * @param date - フォーマットする日付
   * @param options - Intl.DateTimeFormatOptionsオプション
   * @returns フォーマットされた日付文字列
   */
  const formatDate = (
    date: Date,
    options?: Intl.DateTimeFormatOptions
  ): string => {
    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    };

    return new Intl.DateTimeFormat(
      i18n.language,
      options || defaultOptions
    ).format(date);
  };

  /**
   * 日付と時刻をフォーマットする
   * @param date - フォーマットする日付
   * @returns フォーマットされた日付時刻文字列
   */
  const formatDateTime = (date: Date): string => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: i18n.language === 'en', // 英語は12時間制、日本語は24時間制
    };

    return new Intl.DateTimeFormat(i18n.language, options).format(date);
  };

  /**
   * 時刻をフォーマットする
   * @param date - フォーマットする日付
   * @returns フォーマットされた時刻文字列
   */
  const formatTime = (date: Date): string => {
    const options: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: i18n.language === 'en', // 英語は12時間制、日本語は24時間制
    };

    return new Intl.DateTimeFormat(i18n.language, options).format(date);
  };

  /**
   * 数値をフォーマットする
   * @param num - フォーマットする数値
   * @param options - Intl.NumberFormatOptionsオプション
   * @returns フォーマットされた数値文字列
   */
  const formatNumber = (
    num: number,
    options?: Intl.NumberFormatOptions
  ): string => {
    return new Intl.NumberFormat(i18n.language, options).format(num);
  };

  /**
   * 通貨をフォーマットする（将来の課金機能用）
   * @param amount - 金額
   * @param currency - 通貨コード（'JPY', 'USD'など）
   * @returns フォーマットされた通貨文字列
   */
  const formatCurrency = (amount: number, currency: string = 'JPY'): string => {
    return new Intl.NumberFormat(i18n.language, {
      style: 'currency',
      currency,
    }).format(amount);
  };

  /**
   * 相対時刻を表示する
   * @param date - 比較する日付
   * @returns 相対時刻の文字列（例：「3分前」、「2時間前」）
   */
  const formatRelativeTime = (date: Date): string => {
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
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return t('time_ago.days_ago', { count: days });
    } else if (diffInSeconds < 2592000) {
      const weeks = Math.floor(diffInSeconds / 604800);
      return t('time_ago.weeks_ago', { count: weeks });
    } else {
      const months = Math.floor(diffInSeconds / 2592000);
      return t('time_ago.months_ago', { count: months });
    }
  };

  /**
   * 言語を変更する
   * @param language - 変更する言語コード（'ja' または 'en'）
   */
  const changeAppLanguage = async (language: string): Promise<void> => {
    await changeLanguage(language);
  };

  /**
   * 現在の言語を取得する
   * @returns 現在の言語コード
   */
  const currentLanguage = i18n.language;

  /**
   * 現在の言語が日本語かどうかを判定する
   * @returns 日本語の場合true
   */
  const isJapanese = currentLanguage === 'ja';

  /**
   * 現在の言語が英語かどうかを判定する
   * @returns 英語の場合true
   */
  const isEnglish = currentLanguage === 'en';

  return {
    t,
    i18n,
    formatDate,
    formatDateTime,
    formatTime,
    formatNumber,
    formatCurrency,
    formatRelativeTime,
    changeLanguage: changeAppLanguage,
    currentLanguage,
    isJapanese,
    isEnglish,
  };
};

/**
 * 型定義：useTranslationフックの戻り値
 */
export type UseTranslationReturn = ReturnType<typeof useTranslation>;
