# Changelog

## 1.1.0

- `@typescript-eslint/no-unused-vars` ignores parameters and caught errors
  named `^_` (`argsIgnorePattern`, `caughtErrorsIgnorePattern`), so an
  Express error handler's `_next` arity stub and `catch (_e)` need no
  `eslint-disable` (#4). Everything else is as before: the other options keep
  the preset's defaults, an unused parameter or caught error without the
  underscore is still reported, and `varsIgnorePattern` and
  `destructuredArrayIgnorePattern` are deliberately not set.
- Minor, not patch: removing the now-needless disables in a consumer is
  required, because `reportUnusedDisableDirectives` is `"error"` and an
  `eslint-disable` that no longer suppresses anything fails lint.

## 1.0.0 (2026-10-03)

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
  refuses a tag not on `main`, and takes the tarball by the tag's name only
  if it holds exactly the five files, each byte-identical to the tag.
- Known gap, documented and pinned by a test: an inline config that also
  turns `no-use` off passes lint. The README has an optional CI grep.
