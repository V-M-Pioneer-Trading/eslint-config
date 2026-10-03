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
  https://github.com/V-M-Pioneer-Trading/eslint-config/releases/download/v1.0.0/v-m-pioneer-trading-eslint-config-1.0.0.tgz \
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

```js
// eslint.config.mjs (React)
import { react } from "@v-m-pioneer-trading/eslint-config/react";

export default react({
  tsconfigRootDir: import.meta.dirname,
  files: ["src/**/*.{js,jsx,ts,tsx}"],
});
```

### Options

Both `base` and `react` take the same object. Nothing else is accepted that
changes a rule.

| Option | Required | Meaning |
|---|---|---|
| `tsconfigRootDir` | yes | Directory of the tsconfig.json the project service resolves from. Always `import.meta.dirname`. Missing, it throws. |
| `files` | no | Globs linted **with type information**. Default `["**/*.{ts,tsx,mts,cts}"]`. Every file matched must be in a tsconfig, or ESLint reports it as not found by the project service. |
| `ignores` | no | Extra paths never linted, **added** to the shared list below (which cannot be removed). Exact paths of something the repository generates, e.g. `["src/routes.ts"]` if a tsoa `routesDir` points outside `src/generated/`. |

**What gets linted.** `eslint .` lints `.js`, `.mjs` and `.cjs` everywhere, the
`files` globs, and (React variant) `.jsx`/`.tsx`. Every one of them gets every
rule set below. JavaScript that is not in `files` (`eslint.config.mjs`,
`jest.config.js`, `scripts/*.js`) is usually in no tsconfig, so it gets
typescript-eslint's `disableTypeChecked`: the same rules minus the 63 that need
type information, and no project service.

**JavaScript with type information.** command-interface is JavaScript. To lint
it type-aware, add a `tsconfig.json` with `"allowJs": true`, `"jsx":
"react-jsx"`, `"noEmit": true` and `"include": ["src"]`, and name the
JavaScript in `files` as above. Untyped JavaScript then reports a lot of
`no-unsafe-*`: that is the rule set working, not a misconfiguration.

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
| `consistent-type-imports` | typescript-eslint, `error` — a type-only import is `import type`. Added here: neither preset has it, and meta#105 counted on it | everything linted |
| eslint-comments `recommended` | [@eslint-community/eslint-plugin-eslint-comments][comments]: `disable-enable-pair`, `no-aggregating-enable`, `no-duplicate-disable`, `no-unlimited-disable`, `no-unused-enable` | everything linted |
| `require-description` | same plugin, `error` — every directive says why after ` -- ` | everything linted |
| unused disable directives | ESLint `linterOptions.reportUnusedDisableDirectives: "error"` | everything linted |
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

## Dependencies

| Package | Kind | Version | Why this kind |
|---|---|---|---|
| `eslint` | peer | `^10.12.0` | the consumer runs it; one copy per tree |
| `typescript-eslint` | peer | `^8.71.0` | parser and plugin must be the copy ESLint loads the consumer's TypeScript with |
| `typescript` | peer | `>=5.7.0 <6.1.0` | the consumer's compiler; typescript-eslint 8's supported range |
| `@eslint-community/eslint-plugin-eslint-comments` | dependency | `4.8.1` exact | a rule set, not a tool: the config release decides its version |
| `eslint-plugin-react-hooks` | dependency | `7.1.1` exact | same |
| `eslint-plugin-react-refresh` | dependency | `0.5.7` exact | same |

Plugins are exact-pinned dependencies so a release of this package *is* a rule
set: two repositories on the same version lint identically, and a plugin
upgrade is a reviewed release here, never a side effect of someone's `npm
install`. The cost is that every consumer's lockfile carries the React plugins,
and react-hooks 7 brings `@babel/core`, `hermes-parser` and `zod` with it. All
of it is dev-only, from registry.npmjs.org, with sha512 integrity, and none of
it has an install script that `npm ci --ignore-scripts` would need.

**Consumers with a dependency allowlist** (agent-service `ts/`, auth-service
after its port) add three names to `[devDependencies]`:
`@v-m-pioneer-trading/eslint-config`, `eslint`, `typescript-eslint`. The
transitive plugins are not direct dependencies and do not appear in
`package.json`. A checker that admits only the clerk-client release URL must
also admit this repository's release URL.

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
asserts which rule fires in which file: `no-floating-promises`,
`no-unused-vars`, `no-unsafe-*`, `consistent-type-imports`,
`require-description` on a bare disable (and nothing on a described one), an
unused directive as an error, `rules-of-hooks` and `only-export-components` in
the React variant, type-aware rules in `.jsx` opted in through `files`, and
JavaScript outside every tsconfig parsing without type information. It also
asserts the exact list of files linted, so each shared ignore and the
`ignores` option are tested by absence, and that a clean file reports nothing.
Any fatal message (a parse error, a file the project service refuses) fails
whichever test is reading it.

`npm run typecheck` checks the package's own JavaScript through its JSDoc.

CI additionally packs the tarball, checks it carries only `index.js`,
`react.js`, `package.json`, `README.md` and `LICENSE`, installs it with
`--ignore-scripts` into a scratch CommonJS project the way a service would,
and runs `eslint . --max-warnings 0` there with the `eslint.config.mjs`
snippets above extracted from this README: a floating promise must fail it, a
clean file must pass.

**Releasing.** Green on `main`, bump `version` in `package.json` (major for
a new ESLint or typescript-eslint major, minor for any change that can report
something new, patch otherwise), merge, push a matching tag (`git tag v1.1.0 && git push origin
v1.1.0`). The release workflow refuses a tag that disagrees with
`package.json`, then typechecks, tests, packs and attaches the `.tgz` to a
GitHub Release; `contents: write` lives on that one job.

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
