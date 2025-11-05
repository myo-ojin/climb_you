/**
 * Accessibility Utilities Test
 */

import {
  MIN_TOUCH_TARGET_SIZE,
  checkTouchTargetSize,
  ensureTouchTargetSize,
  adjustForHighContrast,
  adjustForReduceTransparency,
  checkColorDistinguishability,
  adjustAnimationDuration,
} from '../accessibility';

describe('Accessibility Utilities', () => {
  describe('checkTouchTargetSize', () => {
    it('44x44ptのタッチターゲットは有効と判定される', () => {
      const result = checkTouchTargetSize({ width: 44, height: 44 });

      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('50x50ptのタッチターゲットは有効と判定される', () => {
      const result = checkTouchTargetSize({ width: 50, height: 50 });

      expect(result.isValid).toBe(true);
      expect(result.currentWidth).toBe(50);
      expect(result.currentHeight).toBe(50);
    });

    it('30x30ptのタッチターゲットは無効と判定され、警告が出る', () => {
      const result = checkTouchTargetSize({ width: 30, height: 30 });

      expect(result.isValid).toBe(false);
      expect(result.warnings).toHaveLength(2);
      expect(result.warnings[0]).toContain('Width 30pt is smaller');
      expect(result.warnings[1]).toContain('Height 30pt is smaller');
    });

    it('幅のみが小さい場合は幅の警告のみ出る', () => {
      const result = checkTouchTargetSize({ width: 30, height: 50 });

      expect(result.isValid).toBe(false);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain('Width 30pt is smaller');
    });

    it('高さのみが小さい場合は高さの警告のみ出る', () => {
      const result = checkTouchTargetSize({ width: 50, height: 30 });

      expect(result.isValid).toBe(false);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain('Height 30pt is smaller');
    });

    it('推奨サイズが正しく計算される', () => {
      const result = checkTouchTargetSize({ width: 30, height: 35 });

      expect(result.recommendedWidth).toBe(44);
      expect(result.recommendedHeight).toBe(44);
    });

    it('カスタム最小サイズを指定できる', () => {
      const result = checkTouchTargetSize({ width: 40, height: 40 }, 50);

      expect(result.isValid).toBe(false);
      expect(result.recommendedWidth).toBe(50);
      expect(result.recommendedHeight).toBe(50);
    });

    it('widthまたはheightが未定義の場合は警告が出ない', () => {
      const result = checkTouchTargetSize({});

      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe('ensureTouchTargetSize', () => {
    it('minWidthとminHeightが追加される', () => {
      const result = ensureTouchTargetSize({
        width: 30,
        height: 30,
        backgroundColor: '#007AFF',
      });

      expect(result.minWidth).toBe(44);
      expect(result.minHeight).toBe(44);
      expect(result.backgroundColor).toBe('#007AFF');
    });

    it('既存のスタイルが保持される', () => {
      const result = ensureTouchTargetSize({
        width: 30,
        height: 30,
        borderRadius: 8,
        padding: 10,
      });

      expect(result.borderRadius).toBe(8);
      expect(result.padding).toBe(10);
    });

    it('カスタム最小サイズを指定できる', () => {
      const result = ensureTouchTargetSize({ width: 40, height: 40 }, 50);

      expect(result.minWidth).toBe(50);
      expect(result.minHeight).toBe(50);
    });
  });

  describe('adjustForHighContrast', () => {
    it('ハイコントラストモードが無効な場合は変更されない', () => {
      const style = { borderWidth: 1, borderColor: '#ccc' };
      const result = adjustForHighContrast(style, false);

      expect(result).toEqual(style);
    });

    it('ハイコントラストモードが有効な場合はborderWidthが2以上になる', () => {
      const style = { borderWidth: 1, borderColor: '#ccc' };
      const result = adjustForHighContrast(style, true);

      expect(result.borderWidth).toBe(2);
      expect(result.borderColor).toBe('#ccc');
    });

    it('元のborderWidthが2以上の場合は維持される', () => {
      const style = { borderWidth: 3, borderColor: '#000' };
      const result = adjustForHighContrast(style, true);

      expect(result.borderWidth).toBe(3);
    });

    it('borderWidthが未定義の場合はデフォルトで2になる', () => {
      const style = { borderColor: '#ccc' };
      const result = adjustForHighContrast(style, true);

      expect(result.borderWidth).toBe(2);
    });

    it('borderColorが未定義の場合は黒になる', () => {
      const style = { borderWidth: 1 };
      const result = adjustForHighContrast(style, true);

      expect(result.borderColor).toBe('#000000');
    });
  });

  describe('adjustForReduceTransparency', () => {
    it('透明度削減が無効な場合は変更されない', () => {
      const color = 'rgba(0, 0, 0, 0.5)';
      const result = adjustForReduceTransparency(color, false);

      expect(result).toBe(color);
    });

    it('透明度削減が有効な場合は透明度が0.9以上になる', () => {
      const color = 'rgba(0, 0, 0, 0.5)';
      const result = adjustForReduceTransparency(color, true);

      expect(result).toBe('rgba(0, 0, 0, 0.9)');
    });

    it('元の透明度が0.9以上の場合は維持される', () => {
      const color = 'rgba(0, 0, 0, 0.95)';
      const result = adjustForReduceTransparency(color, true);

      expect(result).toBe('rgba(0, 0, 0, 0.95)');
    });

    it('透明度が0.2の場合は0.9に調整される', () => {
      const color = 'rgba(255, 255, 255, 0.2)';
      const result = adjustForReduceTransparency(color, true);

      expect(result).toBe('rgba(255, 255, 255, 0.9)');
    });

    it('rgb形式（透明度なし）の場合は変更されない', () => {
      const color = 'rgb(255, 0, 0)';
      const result = adjustForReduceTransparency(color, true);

      expect(result).toBe('rgba(255, 0, 0, 1)');
    });

    it('無効なカラー形式の場合は変更されない', () => {
      const color = '#FF0000';
      const result = adjustForReduceTransparency(color, true);

      expect(result).toBe(color);
    });
  });

  describe('checkColorDistinguishability', () => {
    it('アイコンがある場合は区別可能', () => {
      const result = checkColorDistinguishability(true, false);

      expect(result).toBe(true);
    });

    it('ラベルがある場合は区別可能', () => {
      const result = checkColorDistinguishability(false, true);

      expect(result).toBe(true);
    });

    it('アイコンとラベルの両方がある場合は区別可能', () => {
      const result = checkColorDistinguishability(true, true);

      expect(result).toBe(true);
    });

    it('アイコンもラベルもない場合は区別不可能', () => {
      const result = checkColorDistinguishability(false, false);

      expect(result).toBe(false);
    });
  });

  describe('adjustAnimationDuration', () => {
    it('モーション低減が無効な場合は元の継続時間が返される', () => {
      const result = adjustAnimationDuration(300, false);

      expect(result).toBe(300);
    });

    it('モーション低減が有効な場合は0が返される', () => {
      const result = adjustAnimationDuration(300, true);

      expect(result).toBe(0);
    });

    it('継続時間が0の場合はそのまま0が返される', () => {
      const result = adjustAnimationDuration(0, false);

      expect(result).toBe(0);
    });

    it('継続時間が長い場合もモーション低減が有効なら0になる', () => {
      const result = adjustAnimationDuration(1000, true);

      expect(result).toBe(0);
    });
  });

  describe('MIN_TOUCH_TARGET_SIZE', () => {
    it('最小タッチターゲットサイズは44である', () => {
      expect(MIN_TOUCH_TARGET_SIZE).toBe(44);
    });
  });
});
