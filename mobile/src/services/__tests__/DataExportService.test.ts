/**
 * DataExportService Test
 */

import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { DataExportService } from '../DataExportService';

// Mock expo-file-system
jest.mock('expo-file-system', () => ({
  documentDirectory: 'file:///mock/documents/',
  writeAsStringAsync: jest.fn(),
  getInfoAsync: jest.fn(),
  deleteAsync: jest.fn(),
  EncodingType: {
    UTF8: 'utf8',
  },
}));

// Mock expo-sharing
jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(),
  shareAsync: jest.fn(),
}));

describe('DataExportService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('exportData', () => {
    it('JSON形式でエクスポートできる', async () => {
      (FileSystem.writeAsStringAsync as jest.Mock).mockResolvedValue(undefined);

      const fileUri = await DataExportService.exportData('json');

      expect(fileUri).toContain('file:///mock/documents/climb-you-data-');
      expect(fileUri).toContain('.json');
      expect(FileSystem.writeAsStringAsync).toHaveBeenCalledWith(
        expect.stringContaining('.json'),
        expect.stringContaining('"exportedAt"'),
        { encoding: FileSystem.EncodingType.UTF8 }
      );
    });

    it('CSV形式でエクスポートできる', async () => {
      (FileSystem.writeAsStringAsync as jest.Mock).mockResolvedValue(undefined);

      const fileUri = await DataExportService.exportData('csv');

      expect(fileUri).toContain('file:///mock/documents/climb-you-data-');
      expect(fileUri).toContain('.csv');
      expect(FileSystem.writeAsStringAsync).toHaveBeenCalledWith(
        expect.stringContaining('.csv'),
        expect.stringContaining('# climb-you Data Export'),
        { encoding: FileSystem.EncodingType.UTF8 }
      );
    });

    it('エクスポートに失敗した場合エラーをスローする', async () => {
      const mockError = new Error('Write failed');
      (FileSystem.writeAsStringAsync as jest.Mock).mockRejectedValue(mockError);

      await expect(DataExportService.exportData('json')).rejects.toThrow('Write failed');
    });
  });

  describe('exportAndShare', () => {
    it('JSON形式でエクスポートしてシェアできる', async () => {
      (FileSystem.writeAsStringAsync as jest.Mock).mockResolvedValue(undefined);
      (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(true);
      (Sharing.shareAsync as jest.Mock).mockResolvedValue(undefined);

      await DataExportService.exportAndShare('json');

      expect(Sharing.isAvailableAsync).toHaveBeenCalled();
      expect(Sharing.shareAsync).toHaveBeenCalledWith(
        expect.stringContaining('.json'),
        expect.objectContaining({
          mimeType: 'application/json',
          dialogTitle: 'データをエクスポート',
        })
      );
    });

    it('CSV形式でエクスポートしてシェアできる', async () => {
      (FileSystem.writeAsStringAsync as jest.Mock).mockResolvedValue(undefined);
      (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(true);
      (Sharing.shareAsync as jest.Mock).mockResolvedValue(undefined);

      await DataExportService.exportAndShare('csv');

      expect(Sharing.shareAsync).toHaveBeenCalledWith(
        expect.stringContaining('.csv'),
        expect.objectContaining({
          mimeType: 'text/csv',
          dialogTitle: 'データをエクスポート',
        })
      );
    });

    it('シェアが利用できない場合エラーをスローする', async () => {
      (FileSystem.writeAsStringAsync as jest.Mock).mockResolvedValue(undefined);
      (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(false);

      await expect(DataExportService.exportAndShare('json')).rejects.toThrow(
        'Sharing is not available on this device'
      );
    });
  });

  describe('deleteExportedFile', () => {
    it('エクスポートしたファイルを削除できる', async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: true });
      (FileSystem.deleteAsync as jest.Mock).mockResolvedValue(undefined);

      await DataExportService.deleteExportedFile('file:///mock/test.json');

      expect(FileSystem.getInfoAsync).toHaveBeenCalledWith('file:///mock/test.json');
      expect(FileSystem.deleteAsync).toHaveBeenCalledWith('file:///mock/test.json');
    });

    it('ファイルが存在しない場合は削除をスキップする', async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: false });

      await DataExportService.deleteExportedFile('file:///mock/test.json');

      expect(FileSystem.getInfoAsync).toHaveBeenCalled();
      expect(FileSystem.deleteAsync).not.toHaveBeenCalled();
    });

    it('削除に失敗した場合エラーをスローする', async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: true });
      const mockError = new Error('Delete failed');
      (FileSystem.deleteAsync as jest.Mock).mockRejectedValue(mockError);

      await expect(
        DataExportService.deleteExportedFile('file:///mock/test.json')
      ).rejects.toThrow('Delete failed');
    });
  });

  describe('CSV変換', () => {
    it('ユーザーデータを正しくCSV形式に変換できる', async () => {
      (FileSystem.writeAsStringAsync as jest.Mock).mockImplementation(
        (uri: string, content: string) => {
          // CSVのフォーマットを検証
          expect(content).toContain('# climb-you Data Export');
          expect(content).toContain('## User');
          expect(content).toContain('## Goals');
          expect(content).toContain('## Milestones');
          expect(content).toContain('## Quest Logs');
          expect(content).toContain('## Progress');
          expect(content).toContain('## Streak');
          return Promise.resolve();
        }
      );

      await DataExportService.exportData('csv');

      expect(FileSystem.writeAsStringAsync).toHaveBeenCalled();
    });
  });

  describe('JSON変換', () => {
    it('ユーザーデータを正しくJSON形式に変換できる', async () => {
      (FileSystem.writeAsStringAsync as jest.Mock).mockImplementation(
        (uri: string, content: string) => {
          // JSONのフォーマットを検証
          const data = JSON.parse(content);
          expect(data).toHaveProperty('exportedAt');
          expect(data).toHaveProperty('appVersion');
          expect(data).toHaveProperty('user');
          expect(data).toHaveProperty('goals');
          expect(data).toHaveProperty('milestones');
          expect(data).toHaveProperty('questLogs');
          expect(data).toHaveProperty('progress');
          expect(data).toHaveProperty('streak');
          return Promise.resolve();
        }
      );

      await DataExportService.exportData('json');

      expect(FileSystem.writeAsStringAsync).toHaveBeenCalled();
    });
  });
});
