/**
 * PKCE Flow Implementation
 * OAuth 2.1 Proof Key for Code Exchange (RFC 7636)
 *
 * PKCE は、モバイルアプリのような公開クライアントでの
 * 認可コードフローをより安全にするための拡張仕様
 */

import * as Crypto from 'expo-crypto';
import { PKCEChallenge } from '@/core/domain/entities';

/**
 * PKCE チャレンジを生成
 */
export class PKCEFlow {
  /**
   * コードベリファイア（43-128文字）を生成
   * 英数字、ハイフン、アンダースコア、ドット、チルダのみ使用
   */
  static generateCodeVerifier(): string {
    const length = 128; // 最大長を使用（セキュリティ向上）
    const charset =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let verifier = '';

    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      verifier += charset[randomIndex];
    }

    return verifier;
  }

  /**
   * コードベリファイアから SHA256 ハッシュを使用してコードチャレンジを生成
   * Base64 URL エンコード形式で返す
   */
  static async generateCodeChallenge(
    codeVerifier: string
  ): Promise<string> {
    try {
      // SHA256 ハッシュを計算（結果はBase64文字列）
      const hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        codeVerifier,
        { encoding: Crypto.CryptoEncoding.BASE64 }
      );

      // Base64 URL エンコード形式に変換
      return this.base64UrlEncode(hash);
    } catch (error) {
      throw new Error(`Failed to generate code challenge: ${error}`);
    }
  }

  /**
   * Base64 をBase64 URL エンコード形式に変換
   * RFC 4648 Appendix B に準拠
   */
  private static base64UrlEncode(base64: string): string {
    return base64
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * PKCE チャレンジ全体を生成
   */
  static async generateChallenge(): Promise<PKCEChallenge> {
    const codeVerifier = this.generateCodeVerifier();
    const codeChallenge = await this.generateCodeChallenge(codeVerifier);

    return {
      codeVerifier,
      codeChallenge,
      method: 'S256',
    };
  }

  /**
   * コードベリファイアのバリデーション
   * RFC 7636 より：
   * - 43～128文字
   * - [A-Z] [a-z] [0-9] - . _ ~ のみ
   */
  static validateCodeVerifier(verifier: string): boolean {
    const pattern = /^[A-Za-z0-9\-._~]{43,128}$/;
    return pattern.test(verifier);
  }

  /**
   * コードチャレンジのバリデーション
   */
  static validateCodeChallenge(challenge: string): boolean {
    // Base64 URL エンコード形式（パディングなし）
    const pattern = /^[A-Za-z0-9\-_]{43,128}$/;
    return pattern.test(challenge);
  }
}
