/**
 * EvidenceUploadService.test.ts
 * ファイルバリデーション、形式チェック、ファイルサイズ処理のテスト
 */

import { EvidenceUploadService, EvidenceUploadResult } from './EvidenceUploadService';

describe('EvidenceUploadService', () => {
  describe('validateFileSize', () => {
    it('ファイルサイズが制限内の場合は有効と判定する', () => {
      const result = EvidenceUploadService.validateFileSize(5 * 1024 * 1024, 'image');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('画像が10MBを超える場合は無効と判定する', () => {
      const result = EvidenceUploadService.validateFileSize(11 * 1024 * 1024, 'image');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('10MB');
    });

    it('ファイルが10MBを超える場合は無効と判定する', () => {
      const result = EvidenceUploadService.validateFileSize(11 * 1024 * 1024, 'file');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('10MB');
    });

    it('テキストが1MBを超える場合は無効と判定する', () => {
      const result = EvidenceUploadService.validateFileSize(2 * 1024 * 1024, 'text');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('1MB');
    });

    it('ファイルサイズ0は有効と判定する', () => {
      const result = EvidenceUploadService.validateFileSize(0, 'image');
      expect(result.valid).toBe(true);
    });
  });

  describe('validateMimeType', () => {
    it('許可されたMIMEタイプ(image/jpeg)は有効と判定する', () => {
      const result = EvidenceUploadService.validateMimeType('image/jpeg', 'image');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('許可されたMIMEタイプ(image/png)は有効と判定する', () => {
      const result = EvidenceUploadService.validateMimeType('image/png', 'image');
      expect(result.valid).toBe(true);
    });

    it('許可されたMIMEタイプ(image/webp)は有効と判定する', () => {
      const result = EvidenceUploadService.validateMimeType('image/webp', 'image');
      expect(result.valid).toBe(true);
    });

    it('許可されたMIMEタイプ(application/pdf)は有効と判定する', () => {
      const result = EvidenceUploadService.validateMimeType('application/pdf', 'file');
      expect(result.valid).toBe(true);
    });

    it('許可されたMIMEタイプ(application/msword)は有効と判定する', () => {
      const result = EvidenceUploadService.validateMimeType('application/msword', 'file');
      expect(result.valid).toBe(true);
    });

    it('許可されたMIMEタイプ(text/plain)は有効と判定する', () => {
      const result = EvidenceUploadService.validateMimeType('text/plain', 'text');
      expect(result.valid).toBe(true);
    });

    it('許可されていないMIMEタイプ(application/exe)は無効と判定する', () => {
      const result = EvidenceUploadService.validateMimeType('application/exe', 'file');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('対応していません');
    });

    it('画像MIMEタイプをファイルタイプで検証すると無効と判定する', () => {
      const result = EvidenceUploadService.validateMimeType('image/jpeg', 'file');
      expect(result.valid).toBe(false);
    });

    it('ファイルMIMEタイプを画像タイプで検証すると無効と判定する', () => {
      const result = EvidenceUploadService.validateMimeType('application/pdf', 'image');
      expect(result.valid).toBe(false);
    });
  });

  describe('getFileExtension', () => {
    it('ファイル名から拡張子を抽出できる', () => {
      const ext = EvidenceUploadService.getFileExtension('document.pdf');
      expect(ext).toBe('.pdf');
    });

    it('複数のドットを含むファイル名から最後の拡張子を抽出できる', () => {
      const ext = EvidenceUploadService.getFileExtension('my.document.file.docx');
      expect(ext).toBe('.docx');
    });

    it('拡張子がないファイル名は空文字列を返す', () => {
      const ext = EvidenceUploadService.getFileExtension('README');
      expect(ext).toBe('');
    });

    it('ドットで始まるファイル名から拡張子を抽出できる', () => {
      const ext = EvidenceUploadService.getFileExtension('.gitignore');
      expect(ext).toBe('');
    });
  });

  describe('getExtensionFromMimeType', () => {
    it('image/jpegから.jpgを取得できる', () => {
      const ext = EvidenceUploadService.getExtensionFromMimeType('image/jpeg');
      expect(ext).toBe('.jpg');
    });

    it('image/pngから.pngを取得できる', () => {
      const ext = EvidenceUploadService.getExtensionFromMimeType('image/png');
      expect(ext).toBe('.png');
    });

    it('application/pdfから.pdfを取得できる', () => {
      const ext = EvidenceUploadService.getExtensionFromMimeType('application/pdf');
      expect(ext).toBe('.pdf');
    });

    it('application/mswordから.docを取得できる', () => {
      const ext = EvidenceUploadService.getExtensionFromMimeType('application/msword');
      expect(ext).toBe('.doc');
    });

    it('text/plainから.txtを取得できる', () => {
      const ext = EvidenceUploadService.getExtensionFromMimeType('text/plain');
      expect(ext).toBe('.txt');
    });

    it('未知のMIMEタイプは空文字列を返す', () => {
      const ext = EvidenceUploadService.getExtensionFromMimeType('application/unknown');
      expect(ext).toBe('');
    });
  });

  describe('validateTextEvidence', () => {
    it('有効なテキストはバリデーションに成功する', () => {
      const result = EvidenceUploadService.validateTextEvidence('クエストを完了しました');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('空のテキストはバリデーションに失敗する', () => {
      const result = EvidenceUploadService.validateTextEvidence('');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('テキストを入力');
    });

    it('空白のみのテキストはバリデーションに失敗する', () => {
      const result = EvidenceUploadService.validateTextEvidence('   ');
      expect(result.valid).toBe(false);
    });

    it('長いテキストはバリデーションに成功する', () => {
      const longText = 'a'.repeat(500);
      const result = EvidenceUploadService.validateTextEvidence(longText);
      expect(result.valid).toBe(true);
    });

    it('1MBを超えるテキストはバリデーションに失敗する', () => {
      const hugeText = 'a'.repeat(1024 * 1024 + 1);
      const result = EvidenceUploadService.validateTextEvidence(hugeText);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('1MB');
    });
  });

  describe('formatFileSize', () => {
    it('0 バイトを正しくフォーマットする', () => {
      const result = EvidenceUploadService.formatFileSize(0);
      expect(result).toBe('0 B');
    });

    it('バイト単位をフォーマットする', () => {
      const result = EvidenceUploadService.formatFileSize(512);
      expect(result).toMatch(/512.*B/);
    });

    it('KB単位をフォーマットする', () => {
      const result = EvidenceUploadService.formatFileSize(1024);
      expect(result).toMatch(/1.*KB/);
    });

    it('MB単位をフォーマットする', () => {
      const result = EvidenceUploadService.formatFileSize(1024 * 1024);
      expect(result).toMatch(/1.*MB/);
    });

    it('GB単位をフォーマットする', () => {
      const result = EvidenceUploadService.formatFileSize(1024 * 1024 * 1024);
      expect(result).toMatch(/1.*GB/);
    });

    it('小数点以下2桁までフォーマットする', () => {
      const result = EvidenceUploadService.formatFileSize(1536);
      expect(result).toMatch(/1\.5.*KB/);
    });
  });

  describe('generateFileSummary', () => {
    it('ファイル情報からサマリーを生成できる', () => {
      const result: EvidenceUploadResult = {
        url: 'file:///path/to/image.jpg',
        type: 'image',
        mimeType: 'image/jpeg',
        fileName: 'image.jpg',
        fileSize: 2 * 1024 * 1024,
      };

      const summary = EvidenceUploadService.generateFileSummary(result);
      expect(summary).toContain('image.jpg');
      expect(summary).toMatch(/2.*MB/);
    });

    it('複数のファイルサマリーを正しく生成できる', () => {
      const result1: EvidenceUploadResult = {
        url: 'file:///path/to/document.pdf',
        type: 'file',
        mimeType: 'application/pdf',
        fileName: 'document.pdf',
        fileSize: 512 * 1024,
      };

      const summary1 = EvidenceUploadService.generateFileSummary(result1);
      expect(summary1).toContain('document.pdf');
      expect(summary1).toMatch(/512.*KB/);
    });
  });

  describe('processImagePickerResponse', () => {
    it('キャンセルされたレスポンスはエラーを返す', () => {
      const response: any = {
        didCancel: true,
      };

      const { result, error } = EvidenceUploadService.processImagePickerResponse(response, 'image');
      expect(result).toBeUndefined();
      expect(error).toContain('キャンセル');
    });

    it('エラーコードを含むレスポンスはエラーを返す', () => {
      const response: any = {
        didCancel: false,
        errorCode: 'permission_denied',
        errorMessage: 'ユーザーが権限を拒否しました',
      };

      const { result, error } = EvidenceUploadService.processImagePickerResponse(response, 'image');
      expect(result).toBeUndefined();
      expect(error).toContain('エラー');
    });

    it('有効な画像レスポンスを処理できる', () => {
      const response: any = {
        didCancel: false,
        assets: [
          {
            uri: 'file:///path/to/image.jpg',
            type: 'image/jpeg',
            fileSize: 2 * 1024 * 1024,
            fileName: 'image.jpg',
          },
        ],
      };

      const { result, error } = EvidenceUploadService.processImagePickerResponse(response, 'image');
      expect(error).toBeUndefined();
      expect(result).toBeDefined();
      expect(result?.type).toBe('image');
      expect(result?.fileName).toBe('image.jpg');
    });

    it('ファイルサイズ超過の画像はエラーを返す', () => {
      const response: any = {
        didCancel: false,
        assets: [
          {
            uri: 'file:///path/to/large_image.jpg',
            type: 'image/jpeg',
            fileSize: 20 * 1024 * 1024,
            fileName: 'large_image.jpg',
          },
        ],
      };

      const { result, error } = EvidenceUploadService.processImagePickerResponse(response, 'image');
      expect(result).toBeUndefined();
      expect(error).toContain('ファイルサイズが大きすぎます');
    });

    it('無効なMIMEタイプの画像はエラーを返す', () => {
      const response: any = {
        didCancel: false,
        assets: [
          {
            uri: 'file:///path/to/document.pdf',
            type: 'application/pdf',
            fileSize: 1 * 1024 * 1024,
            fileName: 'document.pdf',
          },
        ],
      };

      const { result, error } = EvidenceUploadService.processImagePickerResponse(response, 'image');
      expect(result).toBeUndefined();
      expect(error).toContain('ファイル形式');
    });
  });

  describe('processDocumentPickerResponse', () => {
    it('有効なPDFドキュメントを処理できる', () => {
      const response: any = {
        uri: 'file:///path/to/document.pdf',
        type: 'application/pdf',
        size: 2 * 1024 * 1024,
        name: 'document.pdf',
      };

      const { result, error } = EvidenceUploadService.processDocumentPickerResponse(response, 'file');
      expect(error).toBeUndefined();
      expect(result).toBeDefined();
      expect(result?.type).toBe('file');
      expect(result?.mimeType).toBe('application/pdf');
    });

    it('ファイルサイズ超過のドキュメントはエラーを返す', () => {
      const response: any = {
        uri: 'file:///path/to/large_doc.pdf',
        type: 'application/pdf',
        size: 20 * 1024 * 1024,
        name: 'large_doc.pdf',
      };

      const { result, error } = EvidenceUploadService.processDocumentPickerResponse(response, 'file');
      expect(result).toBeUndefined();
      expect(error).toContain('ファイルサイズが大きすぎます');
    });

    it('無効なファイル形式のドキュメントはエラーを返す', () => {
      const response: any = {
        uri: 'file:///path/to/image.jpg',
        type: 'image/jpeg',
        size: 2 * 1024 * 1024,
        name: 'image.jpg',
      };

      const { result, error } = EvidenceUploadService.processDocumentPickerResponse(response, 'file');
      expect(result).toBeUndefined();
      expect(error).toContain('ファイル形式');
    });

    it('URLがないレスポンスはエラーを返す', () => {
      const response: any = {
        uri: undefined,
        type: 'application/pdf',
        size: 1024,
        name: 'document.pdf',
      };

      const { result, error } = EvidenceUploadService.processDocumentPickerResponse(response, 'file');
      expect(result).toBeUndefined();
      expect(error).toContain('取得に失敗');
    });
  });
});
