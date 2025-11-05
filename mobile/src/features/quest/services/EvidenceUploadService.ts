/**
 * EvidenceUploadService
 * ファイルアップロード、バリデーション、プレビュー生成を管理するサービス
 *
 * 責務:
 * - ファイルピッカーの操作
 * - ファイルサイズ・形式のバリデーション
 * - ファイル圧縮・変換
 * - アップロード進捗の報告
 * - エラーハンドリング
 */

import { DocumentPickerResponse } from 'react-native-document-picker';
import { ImagePickerResponse } from 'react-native-image-picker';

export type EvidenceType = 'image' | 'text' | 'file' | 'none';

export interface EvidenceUploadResult {
  url: string;
  type: EvidenceType;
  mimeType: string;
  fileName: string;
  fileSize: number;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percent: number;
}

/**
 * ファイルサイズの制限（バイト単位）
 */
const FILE_SIZE_LIMITS = {
  image: 10 * 1024 * 1024, // 10MB
  file: 10 * 1024 * 1024, // 10MB
  text: 1 * 1024 * 1024, // 1MB
} as const;

/**
 * 許可されるMIMEタイプ
 */
const ALLOWED_MIME_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  file: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
  ],
  text: ['text/plain'],
} as const;

/**
 * EvidenceUploadService クラス
 */
export class EvidenceUploadService {
  /**
   * ファイルサイズをバリデーション
   */
  static validateFileSize(fileSize: number, evidenceType: EvidenceType): { valid: boolean; error?: string } {
    const limit = FILE_SIZE_LIMITS[evidenceType];

    if (fileSize > limit) {
      const limitMB = limit / (1024 * 1024);
      return {
        valid: false,
        error: `ファイルサイズが大きすぎます。${limitMB}MB以下にしてください。`,
      };
    }

    return { valid: true };
  }

  /**
   * MIMEタイプをバリデーション
   */
  static validateMimeType(
    mimeType: string,
    evidenceType: EvidenceType
  ): { valid: boolean; error?: string } {
    const allowed = ALLOWED_MIME_TYPES[evidenceType];

    if (!allowed.includes(mimeType as any)) {
      return {
        valid: false,
        error: `このファイル形式は対応していません。対応形式: ${allowed.join(', ')}`,
      };
    }

    return { valid: true };
  }

  /**
   * ファイル名から拡張子を抽出
   */
  static getFileExtension(fileName: string): string {
    const parts = fileName.split('.');
    return parts.length > 1 ? `.${parts[parts.length - 1]}` : '';
  }

  /**
   * MIMEタイプから拡張子を推測
   */
  static getExtensionFromMimeType(mimeType: string): string {
    const mimeToExt: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/gif': '.gif',
      'application/pdf': '.pdf',
      'application/msword': '.doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
      'application/vnd.ms-excel': '.xls',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
      'text/plain': '.txt',
    };

    return mimeToExt[mimeType] || '';
  }

  /**
   * イメージピッカーレスポンスを処理
   */
  static processImagePickerResponse(
    response: ImagePickerResponse,
    evidenceType: EvidenceType
  ): { result?: EvidenceUploadResult; error?: string } {
    if (response.didCancel) {
      return { error: 'キャンセルされました' };
    }

    if (response.errorCode) {
      return { error: `画像選択エラー: ${response.errorMessage}` };
    }

    const asset = response.assets?.[0];
    if (!asset || !asset.uri) {
      return { error: '画像の取得に失敗しました' };
    }

    const mimeType = asset.type || 'image/jpeg';
    const fileSize = asset.fileSize || 0;
    const fileName = asset.fileName || `image_${Date.now()}`;

    // バリデーション
    const sizeValidation = this.validateFileSize(fileSize, evidenceType);
    if (!sizeValidation.valid) {
      return { error: sizeValidation.error };
    }

    const mimeValidation = this.validateMimeType(mimeType, evidenceType);
    if (!mimeValidation.valid) {
      return { error: mimeValidation.error };
    }

    return {
      result: {
        url: asset.uri,
        type: evidenceType,
        mimeType,
        fileName,
        fileSize,
      },
    };
  }

  /**
   * ドキュメントピッカーレスポンスを処理
   */
  static processDocumentPickerResponse(
    response: DocumentPickerResponse,
    evidenceType: EvidenceType
  ): { result?: EvidenceUploadResult; error?: string } {
    if (!response.uri) {
      return { error: 'ファイルの取得に失敗しました' };
    }

    const mimeType = response.type || 'application/octet-stream';
    const fileSize = response.size || 0;
    const fileName = response.name || `file_${Date.now()}`;

    // バリデーション
    const sizeValidation = this.validateFileSize(fileSize, evidenceType);
    if (!sizeValidation.valid) {
      return { error: sizeValidation.error };
    }

    const mimeValidation = this.validateMimeType(mimeType, evidenceType);
    if (!mimeValidation.valid) {
      return { error: mimeValidation.error };
    }

    return {
      result: {
        url: response.uri,
        type: evidenceType,
        mimeType,
        fileName,
        fileSize,
      },
    };
  }

  /**
   * テキスト証跡を検証
   */
  static validateTextEvidence(text: string): { valid: boolean; error?: string } {
    if (!text || text.trim().length === 0) {
      return { valid: false, error: 'テキストを入力してください' };
    }

    const sizeValidation = this.validateFileSize(text.length, 'text');
    if (!sizeValidation.valid) {
      return { valid: false, error: sizeValidation.error };
    }

    return { valid: true };
  }

  /**
   * ファイルサイズを読みやすいフォーマットに変換
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * ファイル情報のサマリーを生成
   */
  static generateFileSummary(result: EvidenceUploadResult): string {
    const size = this.formatFileSize(result.fileSize);
    return `${result.fileName} (${size})`;
  }
}
