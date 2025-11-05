/**
 * Redux Hooks
 * 型安全なRedux Hooksを提供
 */

import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './store';

/**
 * 型付きuseDispatch
 */
export const useAppDispatch = () => useDispatch<AppDispatch>();

/**
 * 型付きuseSelector
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
