/**
 * useQuestUseCase Hook
 * QuestUseCaseのインスタンスを提供するカスタムフック
 */

import { useMemo } from 'react';
import { QuestUseCase } from '@/core/domain/usecases/QuestUseCase';
import { QuestRepositoryImpl } from '@/core/data/repositories/QuestRepositoryImpl';
import { LocalDataSource } from '@/core/data/datasources/LocalDataSource';
import { MCPClient } from '@/core/network/mcp';

/**
 * QuestUseCaseを取得
 */
export const useQuestUseCase = (): QuestUseCase => {
  return useMemo(() => {
    const localDataSource = LocalDataSource.getInstance();
    const mcpClient = new MCPClient({
      baseURL: process.env.EXPO_PUBLIC_API_URL || 'https://api.example.com/mcp',
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
    });

    const questRepository = new QuestRepositoryImpl(localDataSource, mcpClient);
    return new QuestUseCase(questRepository);
  }, []);
};
