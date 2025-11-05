/**
 * CompleteStep 統合テスト
 * オンボーディング完了画面の動作確認
 */

import React from 'react';
import { render, screen } from '@testing-library/react-native';
import CompleteStep from '../../steps/CompleteStep';

describe('CompleteStep 統合テスト', () => {
  describe('画面表示', () => {
    it('完了画面が正しく表示されること', () => {
      render(<CompleteStep />);

      expect(screen.getByText('山登りの準備が整いました！')).toBeDefined();
      expect(screen.getByText(/あなたの長期目標は、10段階のマイルストーンに分解されました/)).toBeDefined();
    });

    it('山のアイコンが表示されること', () => {
      render(<CompleteStep />);

      expect(screen.getByText('🏔️')).toBeDefined();
    });
  });

  describe('マイルストーンプレビューセクション', () => {
    it('タイムラインタイトルが表示されること', () => {
      render(<CompleteStep />);

      expect(screen.getByText('🎯 あなたの目標への道')).toBeDefined();
    });

    it('段階が表示されること', () => {
      render(<CompleteStep />);

      expect(screen.getByText('第1段階')).toBeDefined();
      expect(screen.getByText('第2段階')).toBeDefined();
      expect(screen.getByText('第3段階')).toBeDefined();
      expect(screen.getByText('第4段階')).toBeDefined();
      expect(screen.getByText('第5段階')).toBeDefined();
      expect(screen.getByText('最終段階')).toBeDefined();
    });

    it('省略記号が表示されること', () => {
      render(<CompleteStep />);

      expect(screen.getByText('...')).toBeDefined();
    });
  });

  describe('次のステップセクション', () => {
    it('次のステップタイトルが表示されること', () => {
      render(<CompleteStep />);

      expect(screen.getByText('📋 次のステップ')).toBeDefined();
    });

    it('ステップ1が表示されること', () => {
      render(<CompleteStep />);

      expect(screen.getByText('本日のクエストを確認')).toBeDefined();
      expect(screen.getByText('3つのクエスト（小・中・検証）が準備されています')).toBeDefined();
    });

    it('ステップ2が表示されること', () => {
      render(<CompleteStep />);

      expect(screen.getByText('クエストを完了')).toBeDefined();
      expect(screen.getByText('完了するたびに歩数を獲得し、山を登っていきます')).toBeDefined();
    });

    it('ステップ3が表示されること', () => {
      render(<CompleteStep />);

      expect(screen.getByText('合目を達成')).toBeDefined();
      expect(screen.getByText('各段階を達成すると、新しい視点が開けます')).toBeDefined();
    });

    it('ステップ4が表示されること', () => {
      render(<CompleteStep />);

      expect(screen.getByText('10合目を目指す')).toBeDefined();
      expect(screen.getByText('最終段階まで登れば、あなたの目標達成です！')).toBeDefined();
    });
  });

  describe('成功のコツセクション', () => {
    it('成功のコツタイトルが表示されること', () => {
      render(<CompleteStep />);

      expect(screen.getByText('💡 成功のコツ')).toBeDefined();
    });

    it('4つのコツが表示されること', () => {
      render(<CompleteStep />);

      expect(screen.getByText('✓ 毎日少しでも時間を確保することが大切です')).toBeDefined();
      expect(screen.getByText('✓ ストリーク（連続達成）を保つと、モチベーションが上がります')).toBeDefined();
      expect(screen.getByText('✓ 困ったときは、プロフィールを修正して、クエストを調整できます')).toBeDefined();
      expect(screen.getByText('✓ 週次ランキングで、同じレベルのユーザーと競争できます')).toBeDefined();
    });
  });

  describe('モチベーションセクション', () => {
    it('モチベーションボックスが表示されること', () => {
      render(<CompleteStep />);

      expect(screen.getByText('🌟 最後に')).toBeDefined();
      expect(screen.getByText(/あなたの目標達成は、あなた自身の成長につながります/)).toBeDefined();
    });
  });

  describe('コンポーネントのマウント', () => {
    it('エラーなくレンダリングできること', () => {
      expect(() => render(<CompleteStep />)).not.toThrow();
    });
  });
});
