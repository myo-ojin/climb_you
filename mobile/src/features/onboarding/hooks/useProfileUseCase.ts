/**
 * useProfileUseCase Hook
 * ProfileUseCaseのインスタンスを提供するカスタムフック
 */

import { useMemo } from 'react';
import { ProfileUseCase } from '@/core/domain/usecases/ProfileUseCase';
import { ProfileRepositoryImpl } from '@/core/data/repositories/ProfileRepositoryImpl';
import { LocalDataSource } from '@/core/data/datasources/LocalDataSource';

/**
 * ProfileUseCaseを取得
 */
export const useProfileUseCase = (): ProfileUseCase => {
  return useMemo(() => {
    const localDataSource = LocalDataSource.getInstance();
    const profileRepository = new ProfileRepositoryImpl(localDataSource);
    return new ProfileUseCase(profileRepository);
  }, []);
};
