/**
 * EvidenceUpload Component
 * 証跡提出UIコンポーネント
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { EvidenceType, Evidence } from '../types';

export interface EvidenceUploadProps {
  /**
   * 証跡が選択された時のコールバック
   */
  onEvidenceSelected: (evidence: Evidence) => void;

  /**
   * 現在選択されている証跡
   */
  selectedEvidence?: Evidence;

  /**
   * アップロード中かどうか
   */
  isUploading?: boolean;
}

/**
 * EvidenceUpload Component
 */
export const EvidenceUpload: React.FC<EvidenceUploadProps> = ({
  onEvidenceSelected,
  selectedEvidence,
  isUploading = false,
}) => {
  const [selectedType, setSelectedType] = useState<EvidenceType>(
    selectedEvidence?.type || EvidenceType.IMAGE
  );
  const [memoText, setMemoText] = useState<string>(
    selectedEvidence?.type === EvidenceType.MEMO ? selectedEvidence.text || '' : ''
  );
  const [imageUri, setImageUri] = useState<string | undefined>(
    selectedEvidence?.type === EvidenceType.IMAGE ? selectedEvidence.url : undefined
  );
  const [fileInfo, setFileInfo] = useState<{ name: string; uri: string } | undefined>(
    selectedEvidence?.type === EvidenceType.FILE && selectedEvidence.url
      ? { name: selectedEvidence.fileName || '', uri: selectedEvidence.url }
      : undefined
  );

  /**
   * 画像を選択
   */
  const handleSelectImage = async () => {
    // カメラロールの権限をリクエスト
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('権限エラー', 'カメラロールへのアクセス権限が必要です');
      return;
    }

    // 画像を選択
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setImageUri(uri);
      onEvidenceSelected({
        type: EvidenceType.IMAGE,
        url: uri,
        uploadedAt: new Date(),
      });
    }
  };

  /**
   * 写真を撮影
   */
  const handleTakePhoto = async () => {
    // カメラの権限をリクエスト
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('権限エラー', 'カメラへのアクセス権限が必要です');
      return;
    }

    // 写真を撮影
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setImageUri(uri);
      onEvidenceSelected({
        type: EvidenceType.IMAGE,
        url: uri,
        uploadedAt: new Date(),
      });
    }
  };

  /**
   * ファイルを選択
   */
  const handleSelectFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setFileInfo({ name: asset.name, uri: asset.uri });
        onEvidenceSelected({
          type: EvidenceType.FILE,
          url: asset.uri,
          fileName: asset.name,
          uploadedAt: new Date(),
        });
      }
    } catch (error) {
      Alert.alert('エラー', 'ファイルの選択に失敗しました');
    }
  };

  /**
   * メモを保存
   */
  const handleSaveMemo = () => {
    if (!memoText.trim()) {
      Alert.alert('入力エラー', 'メモを入力してください');
      return;
    }

    onEvidenceSelected({
      type: EvidenceType.MEMO,
      text: memoText.trim(),
      uploadedAt: new Date(),
    });
  };

  /**
   * 証跡タイプを変更
   */
  const handleChangeType = (type: EvidenceType) => {
    setSelectedType(type);
    // リセット
    setImageUri(undefined);
    setFileInfo(undefined);
    setMemoText('');
  };

  return (
    <View style={styles.container}>
      {/* タイプセレクター */}
      <View style={styles.typeSelectorContainer}>
        <Text style={styles.sectionTitle}>証跡のタイプを選択</Text>
        <View style={styles.typeButtons}>
          <TouchableOpacity
            style={[
              styles.typeButton,
              selectedType === EvidenceType.IMAGE && styles.typeButtonActive,
            ]}
            onPress={() => handleChangeType(EvidenceType.IMAGE)}
            disabled={isUploading}
          >
            <Text
              style={[
                styles.typeButtonText,
                selectedType === EvidenceType.IMAGE && styles.typeButtonTextActive,
              ]}
            >
              📷 画像
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.typeButton,
              selectedType === EvidenceType.MEMO && styles.typeButtonActive,
            ]}
            onPress={() => handleChangeType(EvidenceType.MEMO)}
            disabled={isUploading}
          >
            <Text
              style={[
                styles.typeButtonText,
                selectedType === EvidenceType.MEMO && styles.typeButtonTextActive,
              ]}
            >
              📝 メモ
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.typeButton,
              selectedType === EvidenceType.FILE && styles.typeButtonActive,
            ]}
            onPress={() => handleChangeType(EvidenceType.FILE)}
            disabled={isUploading}
          >
            <Text
              style={[
                styles.typeButtonText,
                selectedType === EvidenceType.FILE && styles.typeButtonTextActive,
              ]}
            >
              📎 ファイル
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* アップロード中インジケーター */}
      {isUploading && (
        <View style={styles.uploadingContainer}>
          <ActivityIndicator size="large" color="#3C507D" />
          <Text style={styles.uploadingText}>アップロード中...</Text>
        </View>
      )}

      {/* 画像アップロード */}
      {!isUploading && selectedType === EvidenceType.IMAGE && (
        <View style={styles.uploadSection}>
          {imageUri ? (
            <View style={styles.previewContainer}>
              <Image source={{ uri: imageUri }} style={styles.imagePreview} />
              <TouchableOpacity
                style={styles.changeButton}
                onPress={handleSelectImage}
              >
                <Text style={styles.changeButtonText}>画像を変更</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.uploadButtons}>
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={handleTakePhoto}
              >
                <Text style={styles.uploadButtonIcon}>📷</Text>
                <Text style={styles.uploadButtonText}>写真を撮影</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={handleSelectImage}
              >
                <Text style={styles.uploadButtonIcon}>🖼️</Text>
                <Text style={styles.uploadButtonText}>
                  ギャラリーから選択
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* メモ入力 */}
      {!isUploading && selectedType === EvidenceType.MEMO && (
        <View style={styles.uploadSection}>
          <Text style={styles.inputLabel}>達成の詳細を記入してください</Text>
          <TextInput
            style={styles.memoInput}
            placeholder="例: 目標体重の60kgを達成しました。体重計の写真を添付します。"
            placeholderTextColor="#999"
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            value={memoText}
            onChangeText={setMemoText}
          />
          <TouchableOpacity
            style={[
              styles.saveButton,
              !memoText.trim() && styles.saveButtonDisabled,
            ]}
            onPress={handleSaveMemo}
            disabled={!memoText.trim()}
          >
            <Text style={styles.saveButtonText}>メモを保存</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ファイルアップロード */}
      {!isUploading && selectedType === EvidenceType.FILE && (
        <View style={styles.uploadSection}>
          {fileInfo ? (
            <View style={styles.filePreviewContainer}>
              <View style={styles.fileInfo}>
                <Text style={styles.fileIcon}>📎</Text>
                <Text style={styles.fileName} numberOfLines={2}>
                  {fileInfo.name}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.changeButton}
                onPress={handleSelectFile}
              >
                <Text style={styles.changeButtonText}>ファイルを変更</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={handleSelectFile}
            >
              <Text style={styles.uploadButtonIcon}>📁</Text>
              <Text style={styles.uploadButtonText}>ファイルを選択</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ヒント */}
      <View style={styles.hintContainer}>
        <Text style={styles.hintIcon}>💡</Text>
        <Text style={styles.hintText}>
          証跡は達成の証明となる重要な記録です。できるだけ具体的な内容を提出してください。
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  changeButton: {
    alignItems: 'center',
    backgroundColor: '#F0F4F8',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  changeButtonText: {
    color: '#3C507D',
    fontSize: 14,
    fontWeight: '600',
  },
  container: {
    gap: 20,
  },
  fileIcon: {
    fontSize: 32,
  },
  fileInfo: {
    alignItems: 'center',
    backgroundColor: '#F0F4F8',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 12,
    padding: 16,
  },
  fileName: {
    color: '#333',
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  filePreviewContainer: {
    gap: 12,
  },
  hintContainer: {
    alignItems: 'flex-start',
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 12,
    padding: 16,
  },
  hintIcon: {
    fontSize: 20,
  },
  hintText: {
    color: '#E65100',
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  imagePreview: {
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    height: 200,
    width: '100%',
  },
  inputLabel: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
  },
  memoInput: {
    backgroundColor: '#F9F9F9',
    borderColor: '#E0E0E0',
    borderRadius: 12,
    borderWidth: 1,
    color: '#333',
    fontSize: 14,
    minHeight: 120,
    padding: 16,
  },
  previewContainer: {
    gap: 12,
  },
  saveButton: {
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  saveButtonDisabled: {
    backgroundColor: '#CCC',
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  typeButton: {
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  typeButtonActive: {
    backgroundColor: '#3C507D',
  },
  typeButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  typeButtonTextActive: {
    color: '#FFF',
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  typeSelectorContainer: {
    gap: 12,
  },
  uploadButton: {
    alignItems: 'center',
    backgroundColor: '#F0F4F8',
    borderColor: '#E0E0E0',
    borderRadius: 12,
    borderStyle: 'dashed',
    borderWidth: 2,
    gap: 8,
    padding: 24,
  },
  uploadButtonIcon: {
    fontSize: 48,
  },
  uploadButtonText: {
    color: '#3C507D',
    fontSize: 14,
    fontWeight: '600',
  },
  uploadButtons: {
    gap: 12,
  },
  uploadSection: {
    gap: 12,
  },
  uploadingContainer: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 32,
  },
  uploadingText: {
    color: '#666',
    fontSize: 14,
  },
});
