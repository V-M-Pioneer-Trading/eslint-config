# Changelog

## 1.0.0 (unreleased)

First release (V-M-Pioneer-Trading/meta#105). ESLint 10 flat config
(`eslint` peer `^10.12.0`; ESLint 9 is end-of-life), typescript-eslint 8,
TypeScript `>=5.7.0 <6.1.0` (both ends tested in CI).

- `base`: typescript-eslint 8 `strictTypeChecked` + `stylisticTypeChecked`
  with the project service, `consistent-type-imports`, eslint-comments
  `recommended` + `require-description` + `no-use` (only the four
  suppressing directives; no file-wide `/* eslint rule: off */`), unused
  disable directives and unused inline configs as errors, `require()` allowed
  in `.cjs` only, and the shared ignores (`dist/`, `build/`, `coverage/`,
  `src/generated/`). Options: `tsconfigRootDir` (required), `files`,
  `ignores` (additive; a negated pattern throws).
- `react`: `base` + eslint-plugin-react-hooks 7 `recommended` +
  eslint-plugin-react-refresh `vite`. TypeScript only: command-interface is
  converted before it adopts this.
- Release: a read-only `build` job and a `publish` job that runs no npm,
  refuses a tag not on `main` and a tarball that is not the five expected
  files.
