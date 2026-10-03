# Changelog

## 1.0.0

First release (V-M-Pioneer-Trading/meta#105). ESLint 10 flat config
(`eslint` peer `^10.12.0`; ESLint 9 is end-of-life), typescript-eslint 8.

- `base`: typescript-eslint 8 `strictTypeChecked` + `stylisticTypeChecked`
  with the project service, `consistent-type-imports`, eslint-comments
  `recommended` + `require-description`, unused disable directives as errors,
  and the shared ignores (`dist/`, `build/`, `coverage/`, `src/generated/`).
  Options: `tsconfigRootDir` (required), `files`, `ignores`.
- `react`: `base` + eslint-plugin-react-hooks 7 `recommended` +
  eslint-plugin-react-refresh `vite`.
