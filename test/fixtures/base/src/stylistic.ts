// stylisticTypeChecked: array-type and prefer-nullish-coalescing.
export const names: Array<string> = [];

export function label(name: string | null): string {
  return name || "unnamed";
}
