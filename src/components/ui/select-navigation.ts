export type SelectOption = { value: string; label: string; disabled?: boolean };

export function moveOption(
  options: readonly SelectOption[],
  current: string | null,
  delta: number,
) {
  const enabled = options.filter((option) => !option.disabled);
  const index = enabled.findIndex((option) => option.value === current);
  const next =
    index < 0
      ? delta < 0
        ? enabled.length - 1
        : 0
      : Math.max(0, Math.min(enabled.length - 1, index + delta));
  return enabled[next]?.value ?? null;
}

export function matchOption(
  options: readonly SelectOption[],
  current: string | null,
  query: string,
) {
  const enabled = options.filter((option) => !option.disabled);
  const normalized = query.toLocaleLowerCase();
  const repeated = [...normalized].every((character) => character === normalized[0]);
  const prefix = repeated ? (normalized[0] ?? '') : normalized;
  const currentIndex = enabled.findIndex((option) => option.value === current);
  const start = repeated ? currentIndex + 1 : Math.max(0, currentIndex);
  for (let offset = 0; offset < enabled.length; offset++) {
    const option = enabled[(start + offset) % enabled.length];
    if (option?.label.toLocaleLowerCase().startsWith(prefix)) return option.value;
  }
  return current;
}
