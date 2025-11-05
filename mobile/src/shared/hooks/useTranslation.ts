/**
 * useTranslation Hook
 * 型安全な翻訳フック
 *
 * 機能:
 * - react-i18nextのuseTranslationフックをラップ
 * - 翻訳キーの型チェック
 * - 補間機能
 */

import { useTranslation as useI18nextTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

/**
 * 翻訳フックの戻り値
 */
export interface UseTranslationReturn {
  /**
   * 翻訳関数
   */
  t: TFunction;

  /**
   * 現在の言語コード
   */
  language: string;

  /**
   * i18nインスタンス
   */
  i18n: ReturnType<typeof useI18nextTranslation>['i18n'];
}

/**
 * 型安全な翻訳フック
 *
 * @example
 * ```tsx
 * const { t } = useTranslation();
 * return <Text>{t('common.appName')}</Text>;
 * ```
 *
 * @example
 * ```tsx
 * const { t } = useTranslation();
 * return <Text>{t('home.questsAvailable', { count: 3 })}</Text>;
 * ```
 */
export const useTranslation = (): UseTranslationReturn => {
  const { t, i18n } = useI18nextTranslation();

  return {
    t,
    language: i18n.language,
    i18n,
  };
};
