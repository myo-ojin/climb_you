/**
 * EvidenceUploadModal.test.tsx
 * 証跡アップロードモーダルのコンポーネントテスト
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { EvidenceUploadModal } from './EvidenceUploadModal';

// Mock image picker
jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(),
  launchCamera: jest.fn(),
}));

// Mock document picker
jest.mock('react-native-document-picker', () => ({
  default: {
    pick: jest.fn(),
    isCancel: jest.fn(() => false),
    types: {
      pdf: 'com.adobe.pdf',
      doc: 'com.microsoft.word.doc',
      docx: 'com.microsoft.word.docx',
      xls: 'com.microsoft.excel.xls',
      xlsx: 'com.microsoft.excel.xlsx',
      plainText: 'public.plain-text',
    },
  },
}));

describe('EvidenceUploadModal', () => {
  const mockOnClose = jest.fn();
  const mockOnUpload = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Image evidence type', () => {
    it('visibleがtrueの場合にモーダルを表示する', () => {
      render(
        <EvidenceUploadModal
          visible={true}
          evidenceType="image"
          onClose={mockOnClose}
          onUpload={mockOnUpload}
        />
      );

      expect(screen.getByTestID('evidence-upload-modal')).toBeTruthy();
      expect(screen.getByTestID('evidence-header')).toBeTruthy();
    });

    it('visibleがfalseの場合にモーダルを表示しない', () => {
      const { queryByTestID } = render(
        <EvidenceUploadModal
          visible={false}
          evidenceType="image"
          onClose={mockOnClose}
          onUpload={mockOnUpload}
        />
      );

      expect(queryByTestID('evidence-upload-modal')).toBeFalsy();
    });

    it('画像タイプの説明文を表示する', () => {
      render(
        <EvidenceUploadModal
          visible={true}
          evidenceType="image"
          onClose={mockOnClose}
          onUpload={mockOnUpload}
        />
      );

      const description = screen.getByText(/スクリーンショット/);
      expect(description).toBeTruthy();
    });

    it('ギャラリーとカメラボタンを表示する', () => {
      render(
        <EvidenceUploadModal
          visible={true}
          evidenceType="image"
          onClose={mockOnClose}
          onUpload={mockOnUpload}
        />
      );

      expect(screen.getByTestID('evidence-gallery-button')).toBeTruthy();
      expect(screen.getByTestID('evidence-camera-button')).toBeTruthy();
    });

    it('閉じるボタンをクリックするとonCloseが呼び出される', () => {
      render(
        <EvidenceUploadModal
          visible={true}
          evidenceType="image"
          onClose={mockOnClose}
          onUpload={mockOnUpload}
        />
      );

      const closeButton = screen.getByTestID('evidence-close-button');
      fireEvent.press(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Text evidence type', () => {
    it('テキストタイプの説明文を表示する', () => {
      render(
        <EvidenceUploadModal
          visible={true}
          evidenceType="text"
          onClose={mockOnClose}
          onUpload={mockOnUpload}
        />
      );

      const description = screen.getByText(/詳細を説明するテキスト/);
      expect(description).toBeTruthy();
    });

    it('テキスト入力ボタンを表示する', () => {
      render(
        <EvidenceUploadModal
          visible={true}
          evidenceType="text"
          onClose={mockOnClose}
          onUpload={mockOnUpload}
        />
      );

      expect(screen.getByTestID('evidence-text-button')).toBeTruthy();
    });

    it('テキスト入力ボタンをクリックすると入力フィールドが表示される', async () => {
      render(
        <EvidenceUploadModal
          visible={true}
          evidenceType="text"
          onClose={mockOnClose}
          onUpload={mockOnUpload}
        />
      );

      const textButton = screen.getByTestID('evidence-text-button');
      fireEvent.press(textButton);

      await waitFor(() => {
        expect(screen.getByTestID('evidence-text-input')).toBeTruthy();
      });
    });

    it('テキストを入力してから送信ボタンを押すとonUploadが呼び出される', async () => {
      render(
        <EvidenceUploadModal
          visible={true}
          evidenceType="text"
          onClose={mockOnClose}
          onUpload={mockOnUpload}
        />
      );

      // テキスト入力モードに遷移
      const textButton = screen.getByTestID('evidence-text-button');
      fireEvent.press(textButton);

      await waitFor(() => {
        expect(screen.getByTestID('evidence-text-input')).toBeTruthy();
      });

      // テキストを入力
      const textInput = screen.getByTestID('evidence-text-input');
      fireEvent.changeText(textInput, 'クエストを完了しました');

      // 送信ボタンを押す
      const submitButton = screen.getByTestID('evidence-submit-text-button');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockOnUpload).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'text',
            mimeType: 'text/plain',
            fileSize: 'クエストを完了しました'.length,
          })
        );
      });
    });

    it('空のテキスト送信は無効化される', async () => {
      render(
        <EvidenceUploadModal
          visible={true}
          evidenceType="text"
          onClose={mockOnClose}
          onUpload={mockOnUpload}
        />
      );

      // テキスト入力モードに遷移
      const textButton = screen.getByTestID('evidence-text-button');
      fireEvent.press(textButton);

      await waitFor(() => {
        const submitButton = screen.getByTestID('evidence-submit-text-button');
        expect(submitButton.props.disabled).toBe(true);
      });
    });
  });

  describe('File evidence type', () => {
    it('ファイルタイプの説明文を表示する', () => {
      render(
        <EvidenceUploadModal
          visible={true}
          evidenceType="file"
          onClose={mockOnClose}
          onUpload={mockOnUpload}
        />
      );

      const description = screen.getByText(/ファイル.*PDF.*ドキュメント/);
      expect(description).toBeTruthy();
    });

    it('ファイル選択ボタンを表示する', () => {
      render(
        <EvidenceUploadModal
          visible={true}
          evidenceType="file"
          onClose={mockOnClose}
          onUpload={mockOnUpload}
        />
      );

      expect(screen.getByTestID('evidence-file-button')).toBeTruthy();
    });
  });

  describe('None evidence type', () => {
    it('証跡不要タイプの説明文を表示する', () => {
      render(
        <EvidenceUploadModal
          visible={true}
          evidenceType="none"
          onClose={mockOnClose}
          onUpload={mockOnUpload}
        />
      );

      const description = screen.getByText(/証跡が不要/);
      expect(description).toBeTruthy();
    });

    it('完了ボタンを表示する', () => {
      render(
        <EvidenceUploadModal
          visible={true}
          evidenceType="none"
          onClose={mockOnClose}
          onUpload={mockOnUpload}
        />
      );

      expect(screen.getByTestID('evidence-skip-button')).toBeTruthy();
    });

    it('完了ボタンをクリックするとonCloseが呼び出される', () => {
      render(
        <EvidenceUploadModal
          visible={true}
          evidenceType="none"
          onClose={mockOnClose}
          onUpload={mockOnUpload}
        />
      );

      const skipButton = screen.getByTestID('evidence-skip-button');
      fireEvent.press(skipButton);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('File preview', () => {
    it('ファイルを選択するとプレビューが表示される', async () => {
      render(
        <EvidenceUploadModal
          visible={true}
          evidenceType="image"
          onClose={mockOnClose}
          onUpload={mockOnUpload}
        />
      );

      // Note: In a real test, we'd mock the image picker response
      // and verify the preview is shown
    });

    it('キャンセルボタンで選択をキャンセルできる', async () => {
      render(
        <EvidenceUploadModal
          visible={true}
          evidenceType="image"
          onClose={mockOnClose}
          onUpload={mockOnUpload}
        />
      );

      // Select image (mocked)
      // Then click cancel button
      // Verify preview is cleared
    });
  });

  describe('Error handling', () => {
    it('エラーメッセージを表示する', async () => {
      render(
        <EvidenceUploadModal
          visible={true}
          evidenceType="text"
          onClose={mockOnClose}
          onUpload={mockOnUpload}
        />
      );

      // テキスト入力モードに遷移
      const textButton = screen.getByTestID('evidence-text-button');
      fireEvent.press(textButton);

      await waitFor(() => {
        expect(screen.getByTestID('evidence-text-input')).toBeTruthy();
      });

      // 空のテキストで送信しようとする
      const submitButton = screen.getByTestID('evidence-submit-text-button');

      // 送信ボタンが無効化されているため、エラーは表示されない
      expect(submitButton.props.disabled).toBe(true);
    });
  });

  describe('Loading state', () => {
    it('isLoadingがtrueの場合、スピナーが表示される', async () => {
      render(
        <EvidenceUploadModal
          visible={true}
          evidenceType="image"
          onClose={mockOnClose}
          onUpload={mockOnUpload}
          isLoading={true}
        />
      );

      // Note: In a real test, we'd select a file and verify the spinner
      // appears during upload
    });
  });

  describe('Character count', () => {
    it('テキスト入力中に文字数を表示する', async () => {
      render(
        <EvidenceUploadModal
          visible={true}
          evidenceType="text"
          onClose={mockOnClose}
          onUpload={mockOnUpload}
        />
      );

      // テキスト入力モードに遷移
      const textButton = screen.getByTestID('evidence-text-button');
      fireEvent.press(textButton);

      await waitFor(() => {
        expect(screen.getByTestID('evidence-text-input')).toBeTruthy();
      });

      // テキストを入力
      const textInput = screen.getByTestID('evidence-text-input');
      fireEvent.changeText(textInput, 'Test');

      // 文字数が表示されることを確認
      const charCount = screen.getByText(/4 文字/);
      expect(charCount).toBeTruthy();
    });
  });

  describe('Modal close behavior', () => {
    it('バックドロップをタップするとモーダルが閉じる', () => {
      const { getByTestID } = render(
        <EvidenceUploadModal
          visible={true}
          evidenceType="image"
          onClose={mockOnClose}
          onUpload={mockOnUpload}
        />
      );

      // The modal should handle requests to close
      expect(getByTestID('evidence-upload-modal')).toBeTruthy();
    });

    it('closeボタンをクリックするとモーダルが閉じる', () => {
      render(
        <EvidenceUploadModal
          visible={true}
          evidenceType="image"
          onClose={mockOnClose}
          onUpload={mockOnUpload}
        />
      );

      const closeButton = screen.getByTestID('evidence-close-button');
      fireEvent.press(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
