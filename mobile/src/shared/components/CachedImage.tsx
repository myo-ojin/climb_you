/**
 * CachedImage Component
 * キャッシュ機能付き画像コンポーネント
 *
 * 機能:
 * - ImageCacheServiceを使用した自動キャッシュ
 * - ローディングインジケーター表示
 * - エラーハンドリングとフォールバック画像
 * - React Native Imageと同じAPI
 */

import React, { useState, useEffect } from 'react';
import {
  Image,
  ImageProps,
  ImageStyle,
  StyleSheet,
  View,
  ActivityIndicator,
  Text,
  StyleProp,
} from 'react-native';
import { imageCacheService } from '../../core/services/ImageCacheService';

export interface CachedImageProps extends Omit<ImageProps, 'source'> {
  /**
   * 画像URL
   */
  uri: string;

  /**
   * フォールバック画像（エラー時）
   */
  fallbackSource?: ImageProps['source'];

  /**
   * ローディング中に表示するコンポーネント
   */
  loadingComponent?: React.ReactNode;

  /**
   * エラー時に表示するコンポーネント
   */
  errorComponent?: React.ReactNode;

  /**
   * スタイル
   */
  style?: StyleProp<ImageStyle>;

  /**
   * ローディング完了時のコールバック
   */
  onLoadEnd?: () => void;

  /**
   * エラー発生時のコールバック
   */
  onError?: (error: Error) => void;
}

/**
 * CachedImage Component
 */
export const CachedImage: React.FC<CachedImageProps> = ({
  uri,
  fallbackSource,
  loadingComponent,
  errorComponent,
  style,
  onLoadEnd,
  onError,
  ...imageProps
}) => {
  const [localUri, setLocalUri] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadImage = async () => {
      try {
        setLoading(true);
        setError(null);

        // URLが空の場合
        if (!uri || uri.trim() === '') {
          throw new Error('Empty image URI');
        }

        // ローカルファイルの場合（file://で始まる）
        if (uri.startsWith('file://')) {
          if (isMounted) {
            setLocalUri(uri);
            setLoading(false);
          }
          return;
        }

        // リモート画像の場合、キャッシュから取得またはダウンロード
        const cachedPath = await imageCacheService.getImage(uri);

        if (isMounted) {
          setLocalUri(cachedPath);
          setLoading(false);
          onLoadEnd?.();
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');

        if (isMounted) {
          setError(error);
          setLoading(false);
          onError?.(error);
        }

        console.error('CachedImage load error:', error);
      }
    };

    loadImage();

    return () => {
      isMounted = false;
    };
  }, [uri, onLoadEnd, onError]);

  // ローディング中
  if (loading) {
    if (loadingComponent) {
      return <View style={[styles.container, style]}>{loadingComponent}</View>;
    }

    return (
      <View style={[styles.container, styles.loadingContainer, style]}>
        <ActivityIndicator size="small" color="#3C507D" />
      </View>
    );
  }

  // エラー発生時
  if (error) {
    // カスタムエラーコンポーネント
    if (errorComponent) {
      return <View style={[styles.container, style]}>{errorComponent}</View>;
    }

    // フォールバック画像
    if (fallbackSource) {
      return (
        <Image
          {...imageProps}
          source={fallbackSource}
          style={style}
          onError={(e) => {
            console.error('Fallback image also failed:', e);
          }}
        />
      );
    }

    // デフォルトエラー表示
    return (
      <View style={[styles.container, styles.errorContainer, style]}>
        <Text style={styles.errorText}>画像の読み込みに失敗しました</Text>
      </View>
    );
  }

  // 画像を表示
  if (localUri) {
    return (
      <Image
        {...imageProps}
        source={{ uri: localUri }}
        style={style}
        onError={(e) => {
          const error = new Error('Image rendering failed');
          setError(error);
          onError?.(error);
        }}
      />
    );
  }

  return null;
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 16,
  },
  errorText: {
    color: '#C62828',
    fontSize: 12,
    textAlign: 'center',
  },
  loadingContainer: {
    backgroundColor: '#F0F4F8',
  },
});
