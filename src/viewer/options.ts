import type { ViewerOptions, ViewMode } from './types.ts';

export const DEFAULT_VIEWER_OPTIONS: ViewerOptions = {
  mode: 'cut',
  furnitureVisible: true,
  labelsVisible: true,
  panMode: false,
  measurementTool: 'off',
};

export const VIEW_MODES: { value: ViewMode; label: string }[] = [
  { value: 'cut', label: '3D · разрез стен' },
  { value: 'full', label: '3D · стены 2,7 м' },
  { value: 'top', label: 'План сверху' },
];

export const MODE_TEXT: Record<ViewMode, string> = {
  cut: 'Потолки 2,70 м · разрез на 1,05 м',
  full: 'Стены 2,70 м · потолок скрыт',
  top: 'План сверху · масштаб в метрах',
};

export const isViewMode = (value: string): value is ViewMode =>
  VIEW_MODES.some((mode) => mode.value === value);
