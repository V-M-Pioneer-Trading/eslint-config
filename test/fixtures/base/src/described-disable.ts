export function first(values: readonly number[]): number {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- the caller checks length first
  return values[0]!;
}
