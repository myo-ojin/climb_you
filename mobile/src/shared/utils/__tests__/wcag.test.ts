/**
 * WCAG Utilities Test
 */

import {
  calculateRelativeLuminance,
  hexToRgb,
  calculateContrastRatio,
  meetsWCAG_AA_NormalText,
  meetsWCAG_AA_LargeText,
  meetsWCAG_AA_UIComponent,
  meetsWCAG_AAA_NormalText,
  meetsWCAG_AAA_LargeText,
  checkContrast,
  WCAG_AA,
  WCAG_AAA,
} from '../wcag';

describe('WCAG Utilities', () => {
  describe('hexToRgb', () => {
    it('6桁のHEXコードを正しくRGBに変換する', () => {
      expect(hexToRgb('#FFFFFF')).toEqual([255, 255, 255]);
      expect(hexToRgb('#000000')).toEqual([0, 0, 0]);
      expect(hexToRgb('#FF0000')).toEqual([255, 0, 0]);
      expect(hexToRgb('#00FF00')).toEqual([0, 255, 0]);
      expect(hexToRgb('#0000FF')).toEqual([0, 0, 255]);
    });

    it('3桁のHEXコードを正しくRGBに変換する', () => {
      expect(hexToRgb('#FFF')).toEqual([255, 255, 255]);
      expect(hexToRgb('#000')).toEqual([0, 0, 0]);
      expect(hexToRgb('#F00')).toEqual([255, 0, 0]);
    });

    it('#なしのHEXコードも処理できる', () => {
      expect(hexToRgb('FFFFFF')).toEqual([255, 255, 255]);
      expect(hexToRgb('000000')).toEqual([0, 0, 0]);
    });

    it('無効なHEXコードの場合はnullを返す', () => {
      expect(hexToRgb('GGGGGG')).toBeNull();
      expect(hexToRgb('12')).toBeNull();
    });
  });

  describe('calculateRelativeLuminance', () => {
    it('白の相対輝度は1に近い', () => {
      const luminance = calculateRelativeLuminance(255, 255, 255);
      expect(luminance).toBeCloseTo(1, 2);
    });

    it('黒の相対輝度は0に近い', () => {
      const luminance = calculateRelativeLuminance(0, 0, 0);
      expect(luminance).toBeCloseTo(0, 2);
    });

    it('グレーの相対輝度は0と1の間', () => {
      const luminance = calculateRelativeLuminance(128, 128, 128);
      expect(luminance).toBeGreaterThan(0);
      expect(luminance).toBeLessThan(1);
    });
  });

  describe('calculateContrastRatio', () => {
    it('白と黒のコントラスト比は21:1', () => {
      const ratio = calculateContrastRatio('#FFFFFF', '#000000');
      expect(ratio).toBeCloseTo(21, 0);
    });

    it('黒と白のコントラスト比も21:1（順序不問）', () => {
      const ratio = calculateContrastRatio('#000000', '#FFFFFF');
      expect(ratio).toBeCloseTo(21, 0);
    });

    it('同じ色のコントラスト比は1:1', () => {
      const ratio = calculateContrastRatio('#FFFFFF', '#FFFFFF');
      expect(ratio).toBeCloseTo(1, 1);
    });

    it('RGB配列での計算もサポート', () => {
      const ratio = calculateContrastRatio([255, 255, 255], [0, 0, 0]);
      expect(ratio).toBeCloseTo(21, 0);
    });

    it('Mountain Blue (#3C507D) と白のコントラスト比', () => {
      const ratio = calculateContrastRatio('#3C507D', '#FFFFFF');
      // 約8.0:1（WCAG AAA準拠）
      expect(ratio).toBeGreaterThan(7);
    });

    it('Night Sky (#112250) と白のコントラスト比', () => {
      const ratio = calculateContrastRatio('#112250', '#FFFFFF');
      // 約13.5:1（WCAG AAA準拠）
      expect(ratio).toBeGreaterThan(7);
    });
  });

  describe('WCAG AA基準チェック', () => {
    describe('通常テキスト（4.5:1以上）', () => {
      it('白と黒はWCAG AA通常テキスト基準を満たす', () => {
        expect(meetsWCAG_AA_NormalText('#FFFFFF', '#000000')).toBe(true);
      });

      it('白とライトグレー（#CCCCCC）は基準を満たさない', () => {
        expect(meetsWCAG_AA_NormalText('#FFFFFF', '#CCCCCC')).toBe(false);
      });

      it('Mountain Blue と白は基準を満たす', () => {
        expect(meetsWCAG_AA_NormalText('#3C507D', '#FFFFFF')).toBe(true);
      });
    });

    describe('大きなテキスト（3:1以上）', () => {
      it('白とダークグレー（#767676）は基準を満たす', () => {
        // #767676のコントラスト比は約3.5:1
        expect(meetsWCAG_AA_LargeText('#FFFFFF', '#767676')).toBe(true);
      });

      it('白とライトグレー（#EEEEEE）は基準を満たさない', () => {
        expect(meetsWCAG_AA_LargeText('#FFFFFF', '#EEEEEE')).toBe(false);
      });
    });

    describe('UIコンポーネント（3:1以上）', () => {
      it('ボーダーとして使用される色がチェックできる', () => {
        // #767676は約3.5:1のコントラスト比
        expect(meetsWCAG_AA_UIComponent('#767676', '#FFFFFF')).toBe(true);
      });

      it('薄いボーダー色は基準を満たさない', () => {
        // #E0E0E0は約1.3:1で基準未満
        expect(meetsWCAG_AA_UIComponent('#E0E0E0', '#FFFFFF')).toBe(false);
      });
    });
  });

  describe('WCAG AAA基準チェック', () => {
    describe('通常テキスト（7:1以上）', () => {
      it('白と黒はWCAG AAA通常テキスト基準を満たす', () => {
        expect(meetsWCAG_AAA_NormalText('#FFFFFF', '#000000')).toBe(true);
      });

      it('Mountain Blue と白は基準を満たす', () => {
        expect(meetsWCAG_AAA_NormalText('#3C507D', '#FFFFFF')).toBe(true);
      });

      it('Night Sky と白は基準を満たす', () => {
        expect(meetsWCAG_AAA_NormalText('#112250', '#FFFFFF')).toBe(true);
      });
    });

    describe('大きなテキスト（4.5:1以上）', () => {
      it('Mountain Blue と白は基準を満たす', () => {
        expect(meetsWCAG_AAA_LargeText('#3C507D', '#FFFFFF')).toBe(true);
      });
    });
  });

  describe('checkContrast', () => {
    it('白と黒の詳細チェック結果を返す', () => {
      const result = checkContrast('#FFFFFF', '#000000');

      expect(result.ratio).toBeCloseTo(21, 0);
      expect(result.aa_normalText).toBe(true);
      expect(result.aa_largeText).toBe(true);
      expect(result.aa_uiComponent).toBe(true);
      expect(result.aaa_normalText).toBe(true);
      expect(result.aaa_largeText).toBe(true);
    });

    it('Mountain Blue と白の詳細チェック結果を返す', () => {
      const result = checkContrast('#3C507D', '#FFFFFF');

      expect(result.aa_normalText).toBe(true); // 4.5:1以上
      expect(result.aa_largeText).toBe(true); // 3:1以上
      expect(result.aa_uiComponent).toBe(true); // 3:1以上
      expect(result.aaa_normalText).toBe(true); // 7:1以上
      expect(result.aaa_largeText).toBe(true); // 4.5:1以上
    });

    it('白とライトグレーの詳細チェック結果を返す', () => {
      const result = checkContrast('#FFFFFF', '#CCCCCC');

      expect(result.ratio).toBeLessThan(3.0);
      expect(result.aa_normalText).toBe(false);
      expect(result.aa_largeText).toBe(false); // 3:1未満
      expect(result.aaa_normalText).toBe(false);
      expect(result.aaa_largeText).toBe(false);
    });
  });

  describe('定数の値', () => {
    it('WCAG AA基準値が正しく定義されている', () => {
      expect(WCAG_AA.NORMAL_TEXT).toBe(4.5);
      expect(WCAG_AA.LARGE_TEXT).toBe(3.0);
      expect(WCAG_AA.UI_COMPONENT).toBe(3.0);
      expect(WCAG_AA.GRAPHIC_OBJECT).toBe(3.0);
    });

    it('WCAG AAA基準値が正しく定義されている', () => {
      expect(WCAG_AAA.NORMAL_TEXT).toBe(7.0);
      expect(WCAG_AAA.LARGE_TEXT).toBe(4.5);
    });
  });

  describe('テーマカラーのコントラスト検証', () => {
    describe('LightTheme', () => {
      it('テキスト色と背景色のコントラストが十分', () => {
        const textColor = '#112250'; // nightSky
        const backgroundColor = '#FFFFFF'; // white

        expect(meetsWCAG_AA_NormalText(textColor, backgroundColor)).toBe(true);
      });
    });

    describe('DarkTheme', () => {
      it('テキスト色と背景色のコントラストが十分', () => {
        const textColor = '#FFFFFF'; // white
        const backgroundColor = '#121212'; // dark.background

        expect(meetsWCAG_AA_NormalText(textColor, backgroundColor)).toBe(true);
      });
    });

    describe('HighContrastLightTheme', () => {
      it('テキスト色と背景色のコントラストがAAA基準を満たす', () => {
        const textColor = '#000000'; // black
        const backgroundColor = '#FFFFFF'; // white

        expect(meetsWCAG_AAA_NormalText(textColor, backgroundColor)).toBe(true);
      });
    });

    describe('HighContrastDarkTheme', () => {
      it('テキスト色と背景色のコントラストがAAA基準を満たす', () => {
        const textColor = '#FFFFFF'; // white
        const backgroundColor = '#000000'; // black

        expect(meetsWCAG_AAA_NormalText(textColor, backgroundColor)).toBe(true);
      });
    });
  });
});
