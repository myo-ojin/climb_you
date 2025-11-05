/**
 * WCAG Compliance Utilities
 * WCAG 2.1準拠のチェックユーティリティ
 */

/**
 * 相対輝度を計算する
 * https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 *
 * @param r - Red (0-255)
 * @param g - Green (0-255)
 * @param b - Blue (0-255)
 * @returns 相対輝度 (0-1)
 */
export const calculateRelativeLuminance = (r: number, g: number, b: number): number => {
  // RGBをsRGBに変換
  const rsRGB = r / 255;
  const gsRGB = g / 255;
  const bsRGB = b / 255;

  // 線形RGB値に変換
  const rLinear = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
  const gLinear = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
  const bLinear = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

  // 相対輝度を計算
  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
};

/**
 * HEXカラーをRGBに変換
 *
 * @param hex - HEXカラーコード（例: "#FFFFFF"、"#FFF"）
 * @returns RGB値の配列 [r, g, b]
 */
export const hexToRgb = (hex: string): [number, number, number] | null => {
  // #を削除
  const cleanHex = hex.replace('#', '');

  // 3桁のHEXを6桁に拡張
  const fullHex = cleanHex.length === 3
    ? cleanHex.split('').map((char) => char + char).join('')
    : cleanHex;

  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);

  return result
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
      ]
    : null;
};

/**
 * コントラスト比を計算する
 * https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
 *
 * @param color1 - 前景色（HEXまたはRGB）
 * @param color2 - 背景色（HEXまたはRGB）
 * @returns コントラスト比 (1-21)
 */
export const calculateContrastRatio = (
  color1: string | [number, number, number],
  color2: string | [number, number, number]
): number => {
  // HEX文字列の場合はRGBに変換
  const rgb1 = typeof color1 === 'string' ? hexToRgb(color1) : color1;
  const rgb2 = typeof color2 === 'string' ? hexToRgb(color2) : color2;

  if (!rgb1 || !rgb2) {
    throw new Error('Invalid color format');
  }

  // 相対輝度を計算
  const luminance1 = calculateRelativeLuminance(rgb1[0], rgb1[1], rgb1[2]);
  const luminance2 = calculateRelativeLuminance(rgb2[0], rgb2[1], rgb2[2]);

  // コントラスト比を計算（明るい方を分子、暗い方を分母）
  const lighter = Math.max(luminance1, luminance2);
  const darker = Math.min(luminance1, luminance2);

  return (lighter + 0.05) / (darker + 0.05);
};

/**
 * WCAG AAレベルのコントラスト基準
 */
export const WCAG_AA = {
  /**
   * 通常テキスト（18pt未満、または14pt未満の太字）
   * 最小コントラスト比: 4.5:1
   */
  NORMAL_TEXT: 4.5,

  /**
   * 大きなテキスト（18pt以上、または14pt以上の太字）
   * 最小コントラスト比: 3:1
   */
  LARGE_TEXT: 3.0,

  /**
   * UIコンポーネント（ボタン、入力フィールドなど）
   * 最小コントラスト比: 3:1
   */
  UI_COMPONENT: 3.0,

  /**
   * グラフィックオブジェクト
   * 最小コントラスト比: 3:1
   */
  GRAPHIC_OBJECT: 3.0,
};

/**
 * WCAG AAAレベルのコントラスト基準
 */
export const WCAG_AAA = {
  /**
   * 通常テキスト
   * 最小コントラスト比: 7:1
   */
  NORMAL_TEXT: 7.0,

  /**
   * 大きなテキスト
   * 最小コントラスト比: 4.5:1
   */
  LARGE_TEXT: 4.5,
};

/**
 * WCAG AAレベルのコントラストチェック（通常テキスト）
 *
 * @param foreground - 前景色
 * @param background - 背景色
 * @returns WCAG AA基準を満たしているか
 */
export const meetsWCAG_AA_NormalText = (
  foreground: string | [number, number, number],
  background: string | [number, number, number]
): boolean => {
  const ratio = calculateContrastRatio(foreground, background);
  return ratio >= WCAG_AA.NORMAL_TEXT;
};

/**
 * WCAG AAレベルのコントラストチェック（大きなテキスト）
 *
 * @param foreground - 前景色
 * @param background - 背景色
 * @returns WCAG AA基準を満たしているか
 */
export const meetsWCAG_AA_LargeText = (
  foreground: string | [number, number, number],
  background: string | [number, number, number]
): boolean => {
  const ratio = calculateContrastRatio(foreground, background);
  return ratio >= WCAG_AA.LARGE_TEXT;
};

/**
 * WCAG AAレベルのコントラストチェック（UIコンポーネント）
 *
 * @param foreground - 前景色
 * @param background - 背景色
 * @returns WCAG AA基準を満たしているか
 */
export const meetsWCAG_AA_UIComponent = (
  foreground: string | [number, number, number],
  background: string | [number, number, number]
): boolean => {
  const ratio = calculateContrastRatio(foreground, background);
  return ratio >= WCAG_AA.UI_COMPONENT;
};

/**
 * WCAG AAAレベルのコントラストチェック（通常テキスト）
 *
 * @param foreground - 前景色
 * @param background - 背景色
 * @returns WCAG AAA基準を満たしているか
 */
export const meetsWCAG_AAA_NormalText = (
  foreground: string | [number, number, number],
  background: string | [number, number, number]
): boolean => {
  const ratio = calculateContrastRatio(foreground, background);
  return ratio >= WCAG_AAA.NORMAL_TEXT;
};

/**
 * WCAG AAAレベルのコントラストチェック（大きなテキスト）
 *
 * @param foreground - 前景色
 * @param background - 背景色
 * @returns WCAG AAA基準を満たしているか
 */
export const meetsWCAG_AAA_LargeText = (
  foreground: string | [number, number, number],
  background: string | [number, number, number]
): boolean => {
  const ratio = calculateContrastRatio(foreground, background);
  return ratio >= WCAG_AAA.LARGE_TEXT;
};

/**
 * コントラスト比のチェック結果
 */
export interface ContrastCheckResult {
  /**
   * コントラスト比
   */
  ratio: number;

  /**
   * WCAG AA 通常テキスト基準を満たしているか
   */
  aa_normalText: boolean;

  /**
   * WCAG AA 大きなテキスト基準を満たしているか
   */
  aa_largeText: boolean;

  /**
   * WCAG AA UIコンポーネント基準を満たしているか
   */
  aa_uiComponent: boolean;

  /**
   * WCAG AAA 通常テキスト基準を満たしているか
   */
  aaa_normalText: boolean;

  /**
   * WCAG AAA 大きなテキスト基準を満たしているか
   */
  aaa_largeText: boolean;
}

/**
 * コントラスト比の詳細チェック
 *
 * @param foreground - 前景色
 * @param background - 背景色
 * @returns チェック結果
 */
export const checkContrast = (
  foreground: string | [number, number, number],
  background: string | [number, number, number]
): ContrastCheckResult => {
  const ratio = calculateContrastRatio(foreground, background);

  return {
    ratio,
    aa_normalText: ratio >= WCAG_AA.NORMAL_TEXT,
    aa_largeText: ratio >= WCAG_AA.LARGE_TEXT,
    aa_uiComponent: ratio >= WCAG_AA.UI_COMPONENT,
    aaa_normalText: ratio >= WCAG_AAA.NORMAL_TEXT,
    aaa_largeText: ratio >= WCAG_AAA.LARGE_TEXT,
  };
};
