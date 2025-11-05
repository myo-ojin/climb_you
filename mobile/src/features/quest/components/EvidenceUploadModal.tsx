/**
 * EvidenceUploadModal
 * 証跡（エビデンス）のアップロード機能を提供するモーダルコンポーネント
 *
 * 対応する証跡タイプ:
 * - image: 画像アップロード（スクリーンショット等）
 * - text: テキスト入力（メモ、説明等）
 * - file: ファイルアップロード（PDF、ドキュメント等）
 * - none: 証跡不要
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  useColorScheme,
  StyleSheet,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { launchImageLibrary, launchCamera, ImagePickerResponse } from 'react-native-image-picker';
import DocumentPicker, { DocumentPickerResponse } from 'react-native-document-picker';
import { Colors, LightTheme, DarkTheme } from '@/shared/theme';
import { EvidenceUploadService, EvidenceType, EvidenceUploadResult } from '../services/EvidenceUploadService';

export interface EvidenceUploadModalProps {
  visible: boolean;
  evidenceType: EvidenceType;
  onClose: () => void;
  onUpload: (result: EvidenceUploadResult) => void;
  isLoading?: boolean;
}

type UploadMode = 'idle' | 'camera' | 'gallery' | 'document' | 'text';

/**
 * EvidenceUploadModal コンポーネント
 */
export const EvidenceUploadModal: React.FC<EvidenceUploadModalProps> = ({
  visible,
  evidenceType,
  onClose,
  onUpload,
  isLoading = false,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? DarkTheme : LightTheme;

  const [uploadMode, setUploadMode] = useState<UploadMode>('idle');
  const [error, setError] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<EvidenceUploadResult | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // ✅ 画像ピッカーを開く（ライブラリ）
  const handleSelectImage = useCallback(async () => {
    setError(null);

    launchImageLibrary(
      {
        mediaType: 'photo',
        maxWidth: 2000,
        maxHeight: 2000,
        quality: 0.8,
      },
      (response: ImagePickerResponse) => {
        const { result, error: uploadError } = EvidenceUploadService.processImagePickerResponse(
          response,
          evidenceType
        );

        if (uploadError) {
          setError(uploadError);
          return;
        }

        if (result) {
          setSelectedFile(result);
          setUploadMode('idle');
        }
      }
    );
  }, [evidenceType]);

  // ✅ カメラを開く
  const handleTakePhoto = useCallback(async () => {
    setError(null);

    launchCamera(
      {
        mediaType: 'photo',
        cameraType: 'back',
        quality: 0.8,
      },
      (response: ImagePickerResponse) => {
        const { result, error: uploadError } = EvidenceUploadService.processImagePickerResponse(
          response,
          evidenceType
        );

        if (uploadError) {
          setError(uploadError);
          return;
        }

        if (result) {
          setSelectedFile(result);
          setUploadMode('idle');
        }
      }
    );
  }, [evidenceType]);

  // ✅ ファイルピッカーを開く
  const handleSelectFile = useCallback(async () => {
    setError(null);

    try {
      const response: DocumentPickerResponse[] = await DocumentPicker.pick({
        type: [
          DocumentPicker.types.pdf,
          DocumentPicker.types.doc,
          DocumentPicker.types.docx,
          DocumentPicker.types.xls,
          DocumentPicker.types.xlsx,
          DocumentPicker.types.plainText,
        ],
        copyTo: 'cachesDirectory',
      });

      if (response && response.length > 0) {
        const { result, error: uploadError } = EvidenceUploadService.processDocumentPickerResponse(
          response[0],
          evidenceType
        );

        if (uploadError) {
          setError(uploadError);
          return;
        }

        if (result) {
          setSelectedFile(result);
          setUploadMode('idle');
        }
      }
    } catch (err: any) {
      if (!DocumentPicker.isCancel(err)) {
        setError('ファイル選択に失敗しました');
        console.error('[EvidenceUploadModal] File picker error:', err);
      }
    }
  }, [evidenceType]);

  // ✅ テキスト証跡をバリデーションして送信
  const handleSubmitText = useCallback(() => {
    const validation = EvidenceUploadService.validateTextEvidence(textInput);

    if (!validation.valid) {
      setError(validation.error || 'エラーが発生しました');
      return;
    }

    // テキストをBase64エンコードしてURLとして扱う
    const encodedText = Buffer.from(textInput).toString('base64');
    const result: EvidenceUploadResult = {
      url: `data:text/plain;base64,${encodedText}`,
      type: 'text',
      mimeType: 'text/plain',
      fileName: `text_evidence_${Date.now()}.txt`,
      fileSize: textInput.length,
    };

    onUpload(result);
    handleClose();
  }, [textInput, onUpload]);

  // ✅ 選択したファイルをアップロード
  const handleConfirmUpload = useCallback(async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError(null);

    try {
      // TODO: Actually upload to backend/cloud storage
      // For now, we'll just use the local URI as the evidence URL
      // In production, this would upload to S3/GCS and get a signed URL

      // Simulate upload delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      onUpload(selectedFile);
      handleClose();
    } catch (err) {
      console.error('[EvidenceUploadModal] Upload error:', err);
      setError('アップロードに失敗しました。もう一度お試しください。');
    } finally {
      setIsUploading(false);
    }
  }, [selectedFile, onUpload]);

  // ✅ モーダルを閉じる
  const handleClose = useCallback(() => {
    setUploadMode('idle');
    setError(null);
    setTextInput('');
    setSelectedFile(null);
    setIsUploading(false);
    onClose();
  }, [onClose]);

  // 証跡タイプに応じた説明を取得
  const getEvidenceDescription = (): string => {
    switch (evidenceType) {
      case 'image':
        return 'スクリーンショットや完了証の画像をアップロードしてください';
      case 'text':
        return 'クエスト完了の詳細を説明するテキストを入力してください';
      case 'file':
        return '完了の証跡となるファイル（PDF、ドキュメント等）をアップロードしてください';
      case 'none':
        return 'このクエストは証跡が不要です';
      default:
        return '';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
      testID="evidence-upload-modal"
    >
      <View
        style={[
          styles.modalOverlay,
          {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          },
        ]}
      >
        <View
          style={[
            styles.modalContent,
            {
              backgroundColor: theme.background,
            },
          ]}
        >
          {/* ヘッダー */}
          <View
            style={[
              styles.header,
              {
                borderBottomColor: theme.elevation.level1,
              },
            ]}
          >
            <Text
              style={[
                styles.headerTitle,
                {
                  color: theme.text,
                },
              ]}
              testID="evidence-header"
            >
              証跡をアップロード
            </Text>
            <TouchableOpacity onPress={handleClose} testID="evidence-close-button">
              <Text
                style={{
                  fontSize: 24,
                  color: theme.text,
                }}
              >
                ✕
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            testID="evidence-scroll"
          >
            {/* エラー表示 */}
            {error && (
              <View
                style={[
                  styles.errorBanner,
                  {
                    backgroundColor: Colors.errorLight,
                  },
                ]}
                testID="evidence-error-banner"
              >
                <Text
                  style={[
                    styles.errorText,
                    {
                      color: Colors.error,
                    },
                  ]}
                >
                  {error}
                </Text>
              </View>
            )}

            {/* 証跡タイプの説明 */}
            <View
              style={[
                styles.descriptionCard,
                {
                  backgroundColor: theme.elevation.level1,
                },
              ]}
            >
              <Text
                style={[
                  styles.descriptionText,
                  {
                    color: theme.textSecondary,
                  },
                ]}
              >
                {getEvidenceDescription()}
              </Text>
            </View>

            {/* Idle状態: オプション選択 */}
            {uploadMode === 'idle' && !selectedFile && (
              <>
                {/* Image証跡: ギャラリー、カメラ選択 */}
                {evidenceType === 'image' && (
                  <View style={styles.optionsContainer}>
                    <TouchableOpacity
                      style={[
                        styles.optionButton,
                        {
                          backgroundColor: Colors.mountainBlue,
                        },
                      ]}
                      onPress={() => setUploadMode('gallery')}
                      testID="evidence-gallery-button"
                    >
                      <Text style={styles.optionButtonText}>📷 ギャラリーから選択</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.optionButton,
                        {
                          backgroundColor: Colors.success,
                        },
                      ]}
                      onPress={handleTakePhoto}
                      testID="evidence-camera-button"
                    >
                      <Text style={styles.optionButtonText}>📸 カメラで撮影</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* File証跡: ファイル選択 */}
                {evidenceType === 'file' && (
                  <TouchableOpacity
                    style={[
                      styles.optionButton,
                      {
                        backgroundColor: Colors.mountainBlue,
                      },
                    ]}
                    onPress={handleSelectFile}
                    testID="evidence-file-button"
                  >
                    <Text style={styles.optionButtonText}>📁 ファイルを選択</Text>
                  </TouchableOpacity>
                )}

                {/* Text証跡: テキスト入力 */}
                {evidenceType === 'text' && (
                  <TouchableOpacity
                    style={[
                      styles.optionButton,
                      {
                        backgroundColor: Colors.mountainBlue,
                      },
                    ]}
                    onPress={() => setUploadMode('text')}
                    testID="evidence-text-button"
                  >
                    <Text style={styles.optionButtonText}>📝 テキストを入力</Text>
                  </TouchableOpacity>
                )}

                {/* None証跡: スキップ */}
                {evidenceType === 'none' && (
                  <TouchableOpacity
                    style={[
                      styles.optionButton,
                      {
                        backgroundColor: Colors.gray[500],
                      },
                    ]}
                    onPress={handleClose}
                    testID="evidence-skip-button"
                  >
                    <Text style={styles.optionButtonText}>✓ 完了</Text>
                  </TouchableOpacity>
                )}
              </>
            )}

            {/* ギャラリー選択モード */}
            {uploadMode === 'gallery' && !selectedFile && (
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  {
                    backgroundColor: Colors.mountainBlue,
                  },
                ]}
                onPress={handleSelectImage}
                testID="evidence-pick-image-button"
              >
                <Text style={styles.actionButtonText}>画像を選択</Text>
              </TouchableOpacity>
            )}

            {/* テキスト入力モード */}
            {uploadMode === 'text' && (
              <View style={styles.textInputContainer}>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      color: theme.text,
                      borderColor: theme.elevation.level1,
                      backgroundColor: theme.elevation.level1,
                    },
                  ]}
                  placeholder="証跡の詳細を入力してください..."
                  placeholderTextColor={theme.textSecondary}
                  value={textInput}
                  onChangeText={setTextInput}
                  multiline={true}
                  numberOfLines={6}
                  testID="evidence-text-input"
                />

                <Text
                  style={[
                    styles.characterCount,
                    {
                      color: theme.textSecondary,
                    },
                  ]}
                >
                  {textInput.length} 文字
                </Text>

                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    {
                      backgroundColor: textInput.trim().length > 0 ? Colors.mountainBlue : Colors.gray[400],
                      opacity: textInput.trim().length > 0 ? 1 : 0.6,
                    },
                  ]}
                  onPress={handleSubmitText}
                  disabled={textInput.trim().length === 0}
                  testID="evidence-submit-text-button"
                >
                  <Text style={styles.actionButtonText}>テキストを送信</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ファイル選択後の確認 */}
            {selectedFile && (
              <View style={styles.previewContainer}>
                <View
                  style={[
                    styles.previewCard,
                    {
                      backgroundColor: theme.elevation.level1,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.previewLabel,
                      {
                        color: theme.text,
                      },
                    ]}
                  >
                    選択済みファイル
                  </Text>

                  {/* 画像プレビュー */}
                  {selectedFile.type === 'image' && (
                    <Image
                      source={{ uri: selectedFile.url }}
                      style={styles.imagePreview}
                      testID="evidence-image-preview"
                    />
                  )}

                  {/* ファイル情報 */}
                  <Text
                    style={[
                      styles.fileName,
                      {
                        color: theme.textSecondary,
                      },
                    ]}
                    testID="evidence-file-name"
                  >
                    {selectedFile.fileName}
                  </Text>

                  <Text
                    style={[
                      styles.fileSize,
                      {
                        color: theme.textSecondary,
                      },
                    ]}
                    testID="evidence-file-size"
                  >
                    {EvidenceUploadService.formatFileSize(selectedFile.fileSize)}
                  </Text>
                </View>

                {/* アップロード/キャンセルボタン */}
                <View style={styles.buttonGroup}>
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      {
                        backgroundColor: Colors.mountainBlue,
                      },
                    ]}
                    onPress={handleConfirmUpload}
                    disabled={isUploading || isLoading}
                    testID="evidence-confirm-button"
                  >
                    {isUploading || isLoading ? (
                      <ActivityIndicator color="white" testID="evidence-upload-spinner" />
                    ) : (
                      <Text style={styles.actionButtonText}>✓ アップロード</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.cancelButton,
                      {
                        backgroundColor: Colors.gray[400],
                      },
                    ]}
                    onPress={() => {
                      setSelectedFile(null);
                      setUploadMode('idle');
                      setError(null);
                    }}
                    testID="evidence-cancel-button"
                  >
                    <Text style={styles.actionButtonText}>キャンセル</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '90%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  errorBanner: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
  },
  descriptionCard: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 8,
  },
  optionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButton: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  textInputContainer: {
    marginBottom: 16,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 8,
    textAlignVertical: 'top',
    maxHeight: 200,
  },
  characterCount: {
    fontSize: 12,
    textAlign: 'right',
    marginBottom: 12,
  },
  previewContainer: {
    marginBottom: 16,
  },
  previewCard: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  previewLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  fileSize: {
    fontSize: 12,
  },
  buttonGroup: {
    gap: 8,
  },
});
