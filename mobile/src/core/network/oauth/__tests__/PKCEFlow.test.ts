/**
 * PKCEFlow Basic Tests
 * PKCE認証フローの基本テスト
 */

import { PKCEFlow } from '../PKCEFlow';
import * as Crypto from 'expo-crypto';

jest.mock('expo-crypto');

describe('PKCEFlow - Basic Tests', () => {
  describe('generateCodeVerifier', () => {
    it('128文字のコードベリファイアを生成すること', () => {
      const verifier = PKCEFlow.generateCodeVerifier();
      expect(verifier).toHaveLength(128);
    });

    it('許可された文字のみを使用すること', () => {
      const verifier = PKCEFlow.generateCodeVerifier();
      expect(verifier).toMatch(/^[A-Za-z0-9\-._~]+$/);
    });
  });

  describe('generateCodeChallenge', () => {
    it('コードチャレンジを生成すること', async () => {
      jest.mocked(Crypto.digestStringAsync).mockResolvedValue('mockHash==');

      const challenge = await PKCEFlow.generateCodeChallenge('test-verifier');

      expect(challenge).toBeDefined();
      expect(challenge).not.toContain('=');
      expect(challenge).not.toContain('+');
      expect(challenge).not.toContain('/');
    });
  });

  describe('generateChallenge', () => {
    it('PKCEチャレンジペアを生成すること', async () => {
      jest.mocked(Crypto.digestStringAsync).mockResolvedValue('mockHash==');

      const result = await PKCEFlow.generateChallenge();

      expect(result.codeVerifier).toBeDefined();
      expect(result.codeChallenge).toBeDefined();
      expect(result.method).toBe('S256');
    });
  });
});
