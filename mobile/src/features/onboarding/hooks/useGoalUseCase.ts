/**
 * useGoalUseCase Hook
 * GoalUseCaseのインスタンスを提供するカスタムフック
 */

import { useMemo } from 'react';
import { GoalUseCase } from '@/core/domain/usecases/GoalUseCase';
import { GoalRepositoryImpl } from '@/core/data/repositories/GoalRepositoryImpl';
import { LocalDataSource } from '@/core/data/datasources/LocalDataSource';
import { MCPClient } from '@/core/network/mcp';

/**
 * GoalUseCaseを取得
 */
export const useGoalUseCase = (): GoalUseCase => {
  return useMemo(() => {
    const localDataSource = LocalDataSource.getInstance();
    const mcpClient = new MCPClient({
      baseURL: process.env.EXPO_PUBLIC_API_URL || 'https://api.example.com/mcp',
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
    });

    const goalRepository = new GoalRepositoryImpl(localDataSource, mcpClient);
    return new GoalUseCase(goalRepository);
  }, []);
};
