/**
 * QueryProvider Component
 * React Query Provider
 */

import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './queryClient';

export interface QueryProviderProps {
  children: React.ReactNode;
}

/**
 * QueryProvider Component
 */
export const QueryProvider: React.FC<QueryProviderProps> = ({ children }) => {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};
