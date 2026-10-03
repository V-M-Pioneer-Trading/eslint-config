/* eslint @eslint-community/eslint-comments/no-use: "off", @typescript-eslint/no-explicit-any: "off" -- turns no-use itself off */
// KNOWN GAP, pinned on purpose: one inline config that also switches off
// no-use overrides rules for the whole file and passes. Review catches it;
// lint does not. If ESLint or the plugin ever closes this, the test fails
// and the README's warning can go.
export function cast(value: unknown): any {
  return value;
}
