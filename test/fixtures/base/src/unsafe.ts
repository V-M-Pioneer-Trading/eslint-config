export function parse(text: string): string {
  const value = JSON.parse(text);
  return value.symbol;
}
