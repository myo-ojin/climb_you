/**
 * useMilestoneUseCase Hook
 * MilestoneUseCaseのインスタンスを提供するカスタムフック
 */

import { useMemo } from 'react';
import { MilestoneUseCase } from '@/core/domain/usecases/MilestoneUseCase';
import { MilestoneRepositoryImpl } from '@/core/data/repositories/MilestoneRepositoryImpl';
import { LocalDataSource } from '@/core/data/datasources/LocalDataSource';
import { MCPClient } from '@/core/network/mcp';

/**
 * MilestoneUseCaseを取得
 */
export const useMilestoneUseCase = (): MilestoneUseCase => {
  return useMemo(() => {
    const localDataSource = LocalDataSource.getInstance();
    const mcpClient = new MCPClient({
      baseURL: process.env.EXPO_PUBLIC_API_URL || 'https://api.example.com/mcp',
      timeout: 60000, // マイルストーン生成は時間がかかる
      retryAttempts: 2,
      retryDelay: 1000,
    });

    const milestoneRepository = new MilestoneRepositoryImpl(
      localDataSource,
      mcpClient
    );
    return new MilestoneUseCase(milestoneRepository);
  }, []);
};
