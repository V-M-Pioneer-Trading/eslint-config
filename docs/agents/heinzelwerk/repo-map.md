# Repo map: eslint-config

`@v-m-pioneer-trading/eslint-config`: the one ESLint 10 flat config for every TypeScript repo (typescript-eslint `strictTypeChecked` + `stylisticTypeChecked`, eslint-comments). Released as a GitHub release tarball, no npm registry.

| Path | Holds |
|---|---|
| `index.js` | `base()` config, `DEFAULT_IGNORES` (`dist`, `build`, `coverage`, `src/generated`), options validation |
| `react.js` | React variant |
| `test/config.test.js` | `node --test` suite |
| `scripts/check-consumer.sh` | lints a scratch consumer against the packed tarball |
| `.github/workflows/ci.yml` | typecheck, lint, test, TS peer range 5.7 / 6.0, pack check, consumer probe |
| `.github/workflows/release.yml` | on `v*` tag on main: tarball of exactly five files, `gh release create` |

- Consumers add no rules and no inline `/* eslint */` config; only disable directives with a reason. `reportUnusedDisableDirectives` is an error.
- `ignores` option adds paths only; a negated pattern is refused.
- `.claude/worktrees/` is not in `DEFAULT_IGNORES`: `eslint .` in a consumer lints task worktrees.

## Reference docs

- `README.md` "Rule sets", consumer and release sections: read before changing a rule, cutting a release, or bumping a consumer.
