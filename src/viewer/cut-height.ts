import type { ViewMode } from './types.ts';

export const DEFAULT_CUT_HEIGHT = 1.05;
export const MIN_CUT_HEIGHT = 0.3;
export const MAX_CUT_HEIGHT = 2.7;
export const CUT_HEIGHT_STEP = 0.05;

export function normalizeCutHeight(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_CUT_HEIGHT;
  return Math.round(Math.max(MIN_CUT_HEIGHT, Math.min(MAX_CUT_HEIGHT, value)) * 20) / 20;
}

export const effectiveCutHeight = (mode: ViewMode, value: number) =>
  mode === 'cut' ? normalizeCutHeight(value) : DEFAULT_CUT_HEIGHT;

export const formatCutHeight = (value: number) => value.toFixed(2).replace('.', ',');
