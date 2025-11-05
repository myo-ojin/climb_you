/**
 * DatabaseManager
 * アプリケーション全体でのデータベース初期化と管理を担当
 */

import { LocalDataSource } from './datasources';

export class DatabaseManager {
  private static instance: DatabaseManager;
  private initialized: boolean = false;

  private constructor() {}

  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  /**
   * データベース初期化
   * アプリ起動時に一度だけ呼び出す
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('Database already initialized');
      return;
    }

    try {
      console.log('Initializing database...');
      const localDataSource = LocalDataSource.getInstance();
      await localDataSource.initialize();
      this.initialized = true;
      console.log('Database initialization completed');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  /**
   * データベースが初期化済みか確認
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * LocalDataSource インスタンスを取得
   */
  getLocalDataSource(): LocalDataSource {
    if (!this.initialized) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return LocalDataSource.getInstance();
  }

  /**
   * SQLクエリを実行
   */
  async execute(query: string, params?: any[]): Promise<{ rows: any[] }> {
    if (!this.initialized) {
      throw new Error('Database not initialized. Call initialize() first.');
    }

    const localDataSource = LocalDataSource.getInstance();
    const db = (localDataSource as any).db;

    if (!db) {
      throw new Error('Database connection not available');
    }

    try {
      const results = await db.getAllAsync(query, params);
      return { rows: results };
    } catch (error) {
      console.error('Failed to execute query:', error);
      throw error;
    }
  }

  /**
   * SQLクエリを実行（書き込み）
   */
  async run(query: string, params?: any[]): Promise<void> {
    if (!this.initialized) {
      throw new Error('Database not initialized. Call initialize() first.');
    }

    const localDataSource = LocalDataSource.getInstance();
    const db = (localDataSource as any).db;

    if (!db) {
      throw new Error('Database connection not available');
    }

    try {
      await db.runAsync(query, params);
    } catch (error) {
      console.error('Failed to execute query:', error);
      throw error;
    }
  }
}
