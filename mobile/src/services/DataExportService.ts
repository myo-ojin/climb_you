/**
 * DataExportService
 * ユーザーデータのエクスポート機能
 *
 * 機能:
 * - JSON形式でのエクスポート
 * - CSV形式でのエクスポート
 * - ファイルシステムへの保存
 * - シェア機能
 */

import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

export interface UserExportData {
  /**
   * エクスポート日時
   */
  exportedAt: string;

  /**
   * アプリバージョン
   */
  appVersion: string;

  /**
   * ユーザーデータ
   */
  user?: {
    id: string;
    createdAt: string;
  };

  /**
   * 目標データ
   */
  goals?: any[];

  /**
   * マイルストーンデータ
   */
  milestones?: any[];

  /**
   * クエストログデータ
   */
  questLogs?: any[];

  /**
   * 進捗データ
   */
  progress?: any;

  /**
   * ストリークデータ
   */
  streak?: any;
}

export type ExportFormat = 'json' | 'csv';

class DataExportServiceClass {
  /**
   * データをエクスポート
   */
  async exportData(format: ExportFormat): Promise<string> {
    try {
      // データを取得
      const data = await this.collectUserData();

      // フォーマットに応じて変換
      const content =
        format === 'json' ? this.convertToJSON(data) : this.convertToCSV(data);

      // ファイル名を生成
      const fileName = this.generateFileName(format);

      // ファイルに書き込み
      const fileUri = await this.writeToFile(fileName, content);

      console.log(`[DataExportService] Data exported to: ${fileUri}`);

      return fileUri;
    } catch (error) {
      console.error('[DataExportService] Export failed:', error);
      throw error;
    }
  }

  /**
   * データをエクスポートしてシェア
   */
  async exportAndShare(format: ExportFormat): Promise<void> {
    try {
      const fileUri = await this.exportData(format);

      // シェアが利用可能か確認
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        throw new Error('Sharing is not available on this device');
      }

      // シェアダイアログを表示
      await Sharing.shareAsync(fileUri, {
        mimeType:
          format === 'json' ? 'application/json' : 'text/csv',
        dialogTitle: 'データをエクスポート',
        UTI: format === 'json' ? 'public.json' : 'public.comma-separated-values-text',
      });

      console.log('[DataExportService] Data shared successfully');
    } catch (error) {
      console.error('[DataExportService] Share failed:', error);
      throw error;
    }
  }

  /**
   * ユーザーデータを収集
   */
  private async collectUserData(): Promise<UserExportData> {
    // TODO: 実際のデータベースからデータを取得
    // 現在はダミーデータを返す

    const data: UserExportData = {
      exportedAt: new Date().toISOString(),
      appVersion: '1.0.0',
      user: {
        id: 'user_123',
        createdAt: '2025-01-01T00:00:00.000Z',
      },
      goals: [
        {
          id: 'goal_1',
          title: 'サンプル目標',
          description: 'これはサンプルの目標です',
          createdAt: '2025-01-01T00:00:00.000Z',
        },
      ],
      milestones: [
        {
          id: 'milestone_1',
          goalId: 'goal_1',
          title: '1合目',
          description: '最初のマイルストーン',
          station: 1,
        },
      ],
      questLogs: [
        {
          id: 'log_1',
          questId: 'quest_1',
          status: 'completed',
          completedAt: '2025-01-15T10:00:00.000Z',
        },
      ],
      progress: {
        currentStation: 3,
        totalSteps: 350,
        currentStreak: 7,
      },
      streak: {
        currentStreak: 7,
        maxStreak: 14,
        lastCompletedDate: '2025-01-15',
      },
    };

    return data;
  }

  /**
   * JSON形式に変換
   */
  private convertToJSON(data: UserExportData): string {
    return JSON.stringify(data, null, 2);
  }

  /**
   * CSV形式に変換
   */
  private convertToCSV(data: UserExportData): string {
    const lines: string[] = [];

    // ヘッダー
    lines.push('# climb-you Data Export');
    lines.push(`# Exported at: ${data.exportedAt}`);
    lines.push(`# App version: ${data.appVersion}`);
    lines.push('');

    // ユーザー情報
    if (data.user) {
      lines.push('## User');
      lines.push('id,createdAt');
      lines.push(`${data.user.id},${data.user.createdAt}`);
      lines.push('');
    }

    // 目標
    if (data.goals && data.goals.length > 0) {
      lines.push('## Goals');
      const goalKeys = Object.keys(data.goals[0]);
      lines.push(goalKeys.join(','));
      data.goals.forEach((goal) => {
        const values = goalKeys.map((key) => this.escapeCSV(goal[key]));
        lines.push(values.join(','));
      });
      lines.push('');
    }

    // マイルストーン
    if (data.milestones && data.milestones.length > 0) {
      lines.push('## Milestones');
      const milestoneKeys = Object.keys(data.milestones[0]);
      lines.push(milestoneKeys.join(','));
      data.milestones.forEach((milestone) => {
        const values = milestoneKeys.map((key) =>
          this.escapeCSV(milestone[key])
        );
        lines.push(values.join(','));
      });
      lines.push('');
    }

    // クエストログ
    if (data.questLogs && data.questLogs.length > 0) {
      lines.push('## Quest Logs');
      const logKeys = Object.keys(data.questLogs[0]);
      lines.push(logKeys.join(','));
      data.questLogs.forEach((log) => {
        const values = logKeys.map((key) => this.escapeCSV(log[key]));
        lines.push(values.join(','));
      });
      lines.push('');
    }

    // 進捗
    if (data.progress) {
      lines.push('## Progress');
      lines.push(Object.keys(data.progress).join(','));
      lines.push(
        Object.values(data.progress)
          .map((v) => this.escapeCSV(v))
          .join(',')
      );
      lines.push('');
    }

    // ストリーク
    if (data.streak) {
      lines.push('## Streak');
      lines.push(Object.keys(data.streak).join(','));
      lines.push(
        Object.values(data.streak)
          .map((v) => this.escapeCSV(v))
          .join(',')
      );
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * CSV用のエスケープ処理
   */
  private escapeCSV(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }

    const str = String(value);

    // カンマ、改行、ダブルクォートを含む場合はダブルクォートで囲む
    if (str.includes(',') || str.includes('\n') || str.includes('"')) {
      return `"${str.replace(/"/g, '""')}"`;
    }

    return str;
  }

  /**
   * ファイル名を生成
   */
  private generateFileName(format: ExportFormat): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `climb-you-data-${timestamp}.${format}`;
  }

  /**
   * ファイルに書き込み
   */
  private async writeToFile(fileName: string, content: string): Promise<string> {
    // ドキュメントディレクトリに保存
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(fileUri, content, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    return fileUri;
  }

  /**
   * エクスポートしたファイルを削除
   */
  async deleteExportedFile(fileUri: string): Promise<void> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(fileUri);
        console.log(`[DataExportService] Deleted file: ${fileUri}`);
      }
    } catch (error) {
      console.error('[DataExportService] Failed to delete file:', error);
      throw error;
    }
  }
}

// シングルトンインスタンス
export const DataExportService = new DataExportServiceClass();
