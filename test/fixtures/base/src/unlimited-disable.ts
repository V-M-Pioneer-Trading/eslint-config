/* eslint-disable -- turns every rule off, which no reason justifies */
export function total(values: readonly number[]): number {
  const unused = values.length;
  return values.reduce((sum, v) => sum + v, 0);
}
