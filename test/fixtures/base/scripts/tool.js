// Outside every tsconfig, like a repository's scripts/ or eslint.config.mjs:
// linted without type information, so it parses and only the rules that do
// not need types report.
const unusedInScript = 1;
export const value = 2;
