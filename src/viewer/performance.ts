export type PerformanceProfile = 'performance' | 'balanced' | 'quality';

export const PERFORMANCE_OPTIONS = [
  { value: 'performance', label: 'Быстрее' },
  { value: 'balanced', label: 'Баланс' },
  { value: 'quality', label: 'Качество' },
] as const;

export const PERFORMANCE_PROFILES = {
  performance: {
    maxDpr: 1,
    shadowMapSize: 0,
    environmentIntensity: 0,
    contactShadows: false,
  },
  balanced: {
    maxDpr: 1.5,
    shadowMapSize: 1024,
    environmentIntensity: 0,
    contactShadows: false,
  },
  quality: {
    maxDpr: 2,
    shadowMapSize: 2048,
    environmentIntensity: 0.25,
    contactShadows: true,
  },
} as const;

export const isPerformanceProfile = (value: string): value is PerformanceProfile =>
  PERFORMANCE_OPTIONS.some((profile) => profile.value === value);

export function renderDpr(profile: PerformanceProfile, deviceDpr: number) {
  const dpr = Number.isFinite(deviceDpr) && deviceDpr > 0 ? deviceDpr : 1;
  return Math.min(dpr, PERFORMANCE_PROFILES[profile].maxDpr);
}
