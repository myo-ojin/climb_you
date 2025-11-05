/**
 * CachedImage Component
 * ImageCacheを使用してキャッシュされた画像を表示
 *
 * 機能:
 * - 自動的に画像をキャッシュ
 * - ローディング状態の表示
 * - エラーハンドリング
 * - プレースホルダー画像
 * - リトライ機能
 */

import React, { useState, useEffect } from 'react';
import { Image, ImageProps, View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { ImageCache } from '@/services/ImageCache';

interface CachedImageProps extends Omit<ImageProps, 'source'> {
  /**
   * 画像のURI
   */
  uri: string;

  /**
   * ローディング中に表示するコンポーネント
   */
  loadingComponent?: React.ReactNode;

  /**
   * エラー時に表示するコンポーネント
   */
  errorComponent?: React.ReactNode;

  /**
   * プレースホルダー画像のURI
   */
  placeholderUri?: string;

  /**
   * リトライ回数
   */
  retries?: number;

  /**
   * リトライ間隔（ミリ秒）
   */
  retryDelay?: number;

  /**
   * 読み込み完了時のコールバック
   */
  onLoadComplete?: (localUri: string) => void;

  /**
   * エラー時のコールバック
   */
  onError?: (error: Error) => void;
}

/**
 * CachedImage Component
 *
 * @example
 * ```tsx
 * <CachedImage
 *   uri="https://example.com/image.jpg"
 *   style={{ width: 200, height: 200 }}
 *   placeholderUri={require('./placeholder.png')}
 *   retries={3}
 * />
 * ```
 */
export const CachedImage: React.FC<CachedImageProps> = ({
  uri,
  loadingComponent,
  errorComponent,
  placeholderUri,
  retries = 3,
  retryDelay = 1000,
  onLoadComplete,
  onError,
  style,
  ...imageProps
}) => {
  const [localUri, setLocalUri] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loadImage();
  }, [uri]);

  /**
   * 画像を読み込み（リトライ機能付き）
   */
  const loadImage = async (attemptNumber: number = 0) => {
    if (!uri) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // ImageCacheから画像を取得
      const cachedUri = await ImageCache.get(uri);
      setLocalUri(cachedUri);
      setLoading(false);

      if (onLoadComplete) {
        onLoadComplete(cachedUri);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load image');

      // リトライ
      if (attemptNumber < retries) {
        console.warn(
          `[CachedImage] Load failed, retrying... (${attemptNumber + 1}/${retries})`,
          error
        );

        setTimeout(() => {
          loadImage(attemptNumber + 1);
        }, retryDelay);
      } else {
        console.error('[CachedImage] Load failed after all retries', error);
        setError(error);
        setLoading(false);

        if (onError) {
          onError(error);
        }
      }
    }
  };

  /**
   * ローディング中の表示
   */
  if (loading) {
    if (loadingComponent) {
      return <>{loadingComponent}</>;
    }

    if (placeholderUri) {
      return (
        <View style={[styles.container, style]}>
          <Image
            source={typeof placeholderUri === 'string' ? { uri: placeholderUri } : placeholderUri}
            style={[StyleSheet.absoluteFill, style]}
            {...imageProps}
          />
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color="#fff" />
          </View>
        </View>
      );
    }

    return (
      <View style={[styles.container, styles.loadingContainer, style]}>
        <ActivityIndicator size="large" color="#3C507D" />
      </View>
    );
  }

  /**
   * エラー時の表示
   */
  if (error) {
    if (errorComponent) {
      return <>{errorComponent}</>;
    }

    if (placeholderUri) {
      return (
        <Image
          source={typeof placeholderUri === 'string' ? { uri: placeholderUri } : placeholderUri}
          style={style}
          {...imageProps}
        />
      );
    }

    return (
      <View style={[styles.container, styles.errorContainer, style]}>
        <Text style={styles.errorText}>画像の読み込みに失敗</Text>
      </View>
    );
  }

  /**
   * 画像を表示
   */
  return (
    <Image
      source={{ uri: localUri || undefined }}
      style={style}
      {...imageProps}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
  },
  loadingContainer: {
    backgroundColor: '#F0F0F0',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 12,
  },
});
