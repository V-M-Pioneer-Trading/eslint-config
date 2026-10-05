# @v-m-pioneer-trading/eslint-config

The one ESLint setup for every V-M-Pioneer-Trading TypeScript repository
([meta#105][issue]). Repositories import it and pass two things: where their
tsconfig is, and (at most) which files get type information and which extra
generated paths to skip. They never add, remove or reconfigure a rule.
Changing a rule is a release of this package plus a version bump in each
repository.

ESLint 10 flat config, ESM, Node `^20.19 || ^22.13 || >=24` (ESLint 10's own
range). Distributed exactly like
[clerk-client][clerk]: a `v*` tag attaches the tarball to a GitHub Release,
consumers install that URL and their `package-lock.json` pins its integrity.
No registry, no token, no git at install time.

## Install

```sh
npm install --save-dev \
  https://github.com/V-M-Pioneer-Trading/eslint-config/releases/download/v1.1.0/v-m-pioneer-trading-eslint-config-1.1.0.tgz \
  eslint@^10.12.0 typescript-eslint@^8.71.0
```

`typescript` is already a dev dependency of every consumer (`>=5.7 <6.1`).
All three are devDependencies; nothing here reaches a runtime image.

## Use

Name the file `eslint.config.mjs` so it is ESM whether or not the repository's
`package.json` says `"type": "module"`.

```js
// eslint.config.mjs
import { base } from "@v-m-pioneer-trading/eslint-config";

export default base({ tsconfigRootDir: import.meta.dirname });
```

```json
"scripts": {
  "lint": "eslint . --max-warnings 0"
}
```

In CI, `npm run lint` is a step in the existing test job, after `npm ci`
(meta#105: not a new required check).

### React (command-interface)

command-interface is converted to TypeScript before it adopts this (meta#105,
Q28 = B); there is no JavaScript variant. `lcars-reference-files/` is vendored
(jQuery, `lcars.js`) and is never linted.

```js
// eslint.config.mjs (React)
import { react } from "@v-m-pioneer-trading/eslint-config/react";

export default react({
  tsconfigRootDir: import.meta.dirname,
  ignores: ["lcars-reference-files/"],
});
```

If the Vite config is `vite.config.ts`, it is a `.ts` file, so it is linted
with type information and must be in a tsconfig (the usual
`tsconfig.node.json` referenced from the root `tsconfig.json`, or the root
one's `include`); otherwise ESLint reports it as not found by the project
service. command-interface keeps `vite.config.js`, which is JavaScript outside
`files` and so gets the rules without type information.

### Options

Both `base` and `react` take the same object. Nothing else is accepted that
changes a rule.

| Option | Required | Meaning |
|---|---|---|
| `tsconfigRootDir` | yes | Directory of the tsconfig.json the project service resolves from. Always `import.meta.dirname`. Missing, it throws. |
| `files` | no | Globs linted **with type information**. Default `["**/*.{ts,tsx,mts,cts}"]`. Every file matched must be in a tsconfig, or ESLint reports it as not found by the project service. |
| `ignores` | no | Extra paths never linted, **added** to the shared list below. Exact paths of something the repository generates or vendors, e.g. `["src/routes.ts"]` if a tsoa `routesDir` points outside `src/generated/`. A negated pattern (`"!dist/x.ts"`) throws: it would bring a shared ignore back. |

**What gets linted.** `eslint .` lints the `files` globs and every `.js`,
`.mjs`, `.cjs` and `.jsx` file, in both variants. Every one of them gets every
rule set below. JavaScript that is not in `files` (`eslint.config.mjs`,
`jest.config.js`, `scripts/*.js`) is usually in no tsconfig, so it gets
typescript-eslint's `disableTypeChecked`: the same rules minus the type-aware
rules, and no project service.

**CommonJS scripts are named `.cjs`.** `no-require-imports` (strict) reports
every `require()`, except in a `.cjs` file, whose extension already says it
imports that way. So a script written with `require()` is renamed, not
disabled:

- fleet-service: `scripts/write-openapi.js` becomes `.cjs`; update the
  `openapi` script in `package.json`.
- agent-service `ts/`: the four scripts that use `require()`
  (`check-dependencies.js`, `codegen.js`, `run-contract.js`,
  `write-openapi.js`) become `.cjs`. Update every caller: the `package.json`
  scripts, `.github/workflows/ts.yml` and `CLAUDE.md` (both name
  `run-contract.js`). `src/__tests__/dependencies.test.ts` and
  `src/__tests__/runContract.test.ts` call `require()` from TypeScript, which
  the rule reports too: they switch to `import`.

### Ignored everywhere

| Path | Why |
|---|---|
| `**/dist/`, `**/build/` | build output |
| `**/coverage/` | test coverage output |
| `**/src/generated/` | tsoa's `routesDir` and spec `outputDirectory` in every repository that uses it |
| `node_modules/` | ESLint's own default |

A generated file anywhere else goes in `ignores` by exact path. There is
deliberately no `**/routes.ts`: a hand-written `routes.ts` is common and must
be linted.

## Rule sets

| Set | Source | Applies to |
|---|---|---|
| `strictTypeChecked` | typescript-eslint 8 ([list][strict]) — `recommended` plus the strict rules, all type-aware ones included: `no-floating-promises`, `no-misused-promises`, `no-unsafe-*`, `no-unnecessary-condition`, `restrict-template-expressions`, `no-unused-vars`, … | everything linted |
| `stylisticTypeChecked` | typescript-eslint 8 ([list][stylistic]) — `prefer-nullish-coalescing`, `prefer-optional-chain`, `consistent-type-definitions`, `array-type`, `dot-notation`, … Consistency rules only; **no formatting** (no Prettier, no whitespace rules) | everything linted |
| `no-unused-vars` option | typescript-eslint, `error` with `argsIgnorePattern: "^_"` and `caughtErrorsIgnorePattern: "^_"` — `_next` in an Express error handler (which Express recognises by its four arguments) and `catch (_e)` are not reported. A parameter or caught error without the underscore still is, as are unused variables (`varsIgnorePattern` and `destructuredArrayIgnorePattern` are not set: `_x` as a variable is dead code, and `const [, b] = pair` already skips an element) | everything linted |
| `consistent-type-imports` | typescript-eslint, `error` — a type-only import is `import type`. Added here: neither preset has it, and meta#105 counted on it | everything linted |
| eslint-comments `recommended` | [@eslint-community/eslint-plugin-eslint-comments][comments]: `disable-enable-pair`, `no-aggregating-enable`, `no-duplicate-disable`, `no-unlimited-disable`, `no-unused-enable` | everything linted |
| `require-description` | same plugin, `error` — every directive says why after ` -- ` | everything linted |
| `no-use` | same plugin, `error`, allowing only `eslint-disable`, `eslint-disable-line`, `eslint-disable-next-line` and `eslint-enable`. A file-wide `/* eslint rule: "off" */`, `/* global */` or `/* eslint-env */` would reconfigure the shared rule set, so it is refused (with one gap, below) | everything linted |
| unused directives and inline configs | ESLint `linterOptions.reportUnusedDisableDirectives` and `reportUnusedInlineConfigs`, both `"error"` | everything linted |
| CommonJS | `no-require-imports` off | `.cjs` only |
| react-hooks `recommended` | [eslint-plugin-react-hooks][hooks] 7: `rules-of-hooks`, `exhaustive-deps`, and the React Compiler checks (`purity`, `refs`, `immutability`, `set-state-in-effect`, `set-state-in-render`, `static-components`, `use-memo`, `preserve-manual-memoization`, `globals`, `error-boundaries`, `incompatible-library`, `unsupported-syntax`, `config`, `gating`) | React variant only |
| react-refresh `vite` | [eslint-plugin-react-refresh][refresh]: `only-export-components` with `allowConstantExport` | React variant, `.jsx`/`.tsx` |

Some preset rules are `warn` (`exhaustive-deps`, for one). With
`--max-warnings 0` a warning fails CI exactly like an error.

An `eslint-disable` looks like this, and is the only way to silence a rule.
There are no baseline files.

```ts
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- length checked on the line above
const first = values[0]!;
```

**Known gap: `no-use` can switch itself off.** One inline config that names
`no-use` too passes lint and overrides rules for the whole file:

```ts
/* eslint @eslint-community/eslint-comments/no-use: "off", @typescript-eslint/no-explicit-any: "off" -- reason */
```

The comment turns `no-use` off for the file, its own report included. This is
**visible in review but not enforced** by lint. A test pins the current
behaviour, so a fix upstream shows up as a failing test here. A consumer that
wants it enforced can add this step to CI after `npm run lint`:

```sh
# Refuse any /* eslint ... */ inline config (only eslint-disable/-enable directives are allowed).
if git grep -nE '^[[:space:]]*/\*[[:space:]]*eslint[[:space:]]' -- '*.ts' '*.tsx' '*.js' '*.jsx' '*.mjs' '*.cjs'; then
  echo "::error::inline ESLint config found; use a described eslint-disable instead"
  exit 1
fi
```

## Dependencies

| Package | Kind | Version | Why this kind |
|---|---|---|---|
| `eslint` | peer | `^10.12.0` | the consumer runs it; one copy per tree |
| `typescript-eslint` | peer | `^8.71.0` | parser and plugin must be the copy ESLint loads the consumer's TypeScript with |
| `typescript` | peer | `>=5.7.0 <6.1.0` | the consumer's compiler; typescript-eslint 8's supported range |
| `@eslint-community/eslint-plugin-eslint-comments` | dependency | `4.8.1` exact | a rule set, not a tool: the config release decides its version |
| `eslint-plugin-react-hooks` | dependency | `7.1.1` exact | same |
| `eslint-plugin-react-refresh` | dependency | `0.5.7` exact | same |

The three plugins are exact-pinned, so a plugin upgrade is a reviewed release
here, never a side effect of someone's `npm install`. That does not make two
repositories on the same release lint identically: the typescript-eslint
presets come from the consumer's own caret `typescript-eslint` peer (its
minors add fixes and rule options, though preset membership only changes in a
major), and react-hooks' own dependencies (`@babel/*`, `hermes-parser`) are
caret ranges. Each consumer's lockfile is what fixes those; a fresh lockfile
can resolve newer ones.

Every consumer's lockfile carries the React plugins, and react-hooks 7 brings
`@babel/core`, `hermes-parser` and `zod` with it. All of it is dev-only, from
registry.npmjs.org, with sha512 integrity, and none of it has an install
script that `npm ci --ignore-scripts` would need.

**Consumers with a dependency allowlist** (agent-service `ts/`, auth-service
after its port) add three names to `[devDependencies]`:
`@v-m-pioneer-trading/eslint-config`, `eslint`, `typescript-eslint`. The
transitive plugins are not direct dependencies and do not appear in
`package.json`. agent-service's `ts/scripts/check-dependencies.js` was written
for exactly one tarball, clerk-client's, in `dependencies`. Three of its checks
must learn about this one, which lives in **`devDependencies`**:

- the spec check, which requires a plain semver range for everything except
  the clerk-client URL;
- the resolved-origin check, which admits only registry.npmjs.org and the
  clerk-client release;
- the `registry.npmjs.org/<name>/-/` check, which a release URL can never
  satisfy.

## Bumping a repository

One command, then commit `package.json` and `package-lock.json` together:

```sh
npm install --save-dev https://github.com/V-M-Pioneer-Trading/eslint-config/releases/download/v1.1.0/v-m-pioneer-trading-eslint-config-1.1.0.tgz
```

Then `npm run lint` and fix what the new release reports in the same PR.

## Development

```sh
npm ci --ignore-scripts && npm run typecheck && npm test
```

`npm test` lints the projects in `test/fixtures/` with the real configs and
asserts which rule fires in which file, one fixture per rule set:
`no-floating-promises`, `no-unused-vars` (and its `_` exemptions: an Express
`_next` and `catch (_e)` pass, the same without the underscore is reported), `no-unsafe-*`,
`consistent-type-imports`, `array-type` and `prefer-nullish-coalescing`
(stylistic), `no-unnecessary-condition` (in strict, not in recommended),
`require-description` on a bare disable (and nothing on a described one),
`no-unlimited-disable`, `no-use` on a file-wide inline config, unused
directives and inline configs as errors, `require()` accepted in `.cjs` and
reported in `.js`, and in the React variant `rules-of-hooks`,
`exhaustive-deps`, `set-state-in-effect`, `only-export-components` (and
nothing for a constant beside a component). It also asserts the exact list of
files linted, so each shared ignore and the `ignores` option are tested by
absence, that a negated ignore throws, and that a clean file reports nothing.
One test pins a known gap instead (the self-disabling inline config above).
Any fatal message (a parse error, a file the project service refuses) fails
whichever test is reading it.

CI runs the suite on TypeScript 5.9 (locked), 5.7 and 6.0, the ends of the
`typescript` peer range.

`npm run typecheck` checks the package's own JavaScript through its JSDoc, and
`npm run lint` lints it with its own `base` config.

CI additionally packs the tarball, checks it carries only `index.js`,
`react.js`, `package.json`, `README.md` and `LICENSE`, installs it with
`--ignore-scripts` into a scratch CommonJS project the way a service would,
and runs `eslint . --max-warnings 0` there with the `eslint.config.mjs`
snippets above extracted from this README: a floating promise must fail the
base config and a conditional hook the React one, and the fixed project,
with a component, a constant export and a vendored `lcars-reference-files/`
script, must pass.

**Releasing.** Green on `main`, bump `version` in `package.json` (major for
a new ESLint or typescript-eslint major, minor for any change that can report
something new, patch otherwise), merge, push a matching tag (`git tag v1.1.0 && git push origin
v1.1.0`). The release workflow refuses a tag that disagrees with
`package.json`, then a read-only `build` job typechecks, tests, packs, proves the tarball in a
scratch consumer and uploads it as an artifact. A separate `publish` job,
the only one with `contents: write`, runs no npm at all. It checks the tagged
commit is on `main`, takes the tarball by the name the tag implies
(`v-m-pioneer-trading-eslint-config-<version>.tgz`), requires exactly the five
expected files in it, each byte-identical (`cmp`) to the tagged checkout, and
then attaches it to a GitHub Release.

**Re-running a release.** The tarball artifact is kept for one day: within
it, re-running just the failed `publish` job reuses it; after it, re-run all
jobs so `build` makes a new one from the tag. If `gh release create` made the release but the upload failed, a re-run fails
because the release already exists: delete it by hand first (`gh release
delete vX.Y.Z --repo V-M-Pioneer-Trading/eslint-config`; the tag stays), then
re-run the workflow.

## Licence

MIT, see [LICENSE](LICENSE). This package is installed from a public URL by
builds outside its own repository.

[issue]: https://github.com/V-M-Pioneer-Trading/meta/issues/105
[clerk]: https://github.com/V-M-Pioneer-Trading/clerk-client
[strict]: https://typescript-eslint.io/users/configs#strict-type-checked
[stylistic]: https://typescript-eslint.io/users/configs#stylistic-type-checked
[comments]: https://eslint-community.github.io/eslint-plugin-eslint-comments/
[hooks]: https://www.npmjs.com/package/eslint-plugin-react-hooks
[refresh]: https://github.com/ArnaudBarre/eslint-plugin-react-refresh
