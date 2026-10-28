# Repo map: eslint-config

Facts verified against origin/main 4006cff on 2026-10-27, each with `path:line`. Line numbers drift: open the file before relying on one.

1. Purpose: one shared ESLint 10 flat config (typescript-eslint strictTypeChecked + stylisticTypeChecked, eslint-comments, React variant) for all V-M-Pioneer-Trading TS repos (package.json:2-4, README.md:3-8; meta#105 at index.js:3).

2. Entry points:
- Package `@v-m-pioneer-trading/eslint-config` v1.1.0, ESM (package.json:2-3,21). `exports`: `.`->index.js, `./react`->react.js, `./package.json` (package.json:22-26).
- `base(options)` (index.js:88), also default export (index.js:185). Exported constants `TYPESCRIPT_FILES`, `JAVASCRIPT_FILES`, `DEFAULT_IGNORES` (dist/, build/, coverage/, src/generated/) (index.js:12,20,27-32).
- `react(options)` = base + react-hooks flat recommended on all js/ts + react-refresh vite on jsx/tsx (react.js:20-33); also default export (react.js:36).
- Options `tsconfigRootDir` (required, `import.meta.dirname`), `files`, `ignores` (additive; `!` pattern throws, empty `files` throws) (index.js:34-43,50-78). `projectService: true` only on `files` (index.js:137-143); other JS gets `disableTypeChecked` (index.js:144-151).
- Peers eslint ^10.12.0, typescript >=5.7.0 <6.1.0, typescript-eslint ^8.71.0 (package.json:46-50). Plugins exact-pinned deps (package.json:41-45). Node ^20.19.0 || ^22.13.0 || >=24 (package.json:34).

3. No HTTP/API/CLI surface. Only public thing: release tarball at an unauthenticated GitHub Release URL, installed by outside builds (README.md:20,274-275).
4. Money/spend: n/a.

5. Consumers and distribution:
- No registry/token: `v*` tag attaches tarball to a GitHub Release; consumers install the URL, lockfile pins integrity (README.md:11-14, release.yml:3-6). Install cmd with `eslint@^10.12.0 typescript-eslint@^8.71.0` (README.md:18-22).
- Bump: `npm install --save-dev <new URL>`, commit package.json + lock together, `npm run lint`, fix reports in same PR (README.md:204-212). Config file `eslint.config.mjs` (README.md:29-30); snippets README.md:32-37 (base), 54-62 (React).
- Named consumers: fleet-service, agent-service `ts/` (README.md:94-102); auth-service after its port (README.md:189-190); command-interface for React (README.md:48-52, CHANGELOG.md:30-32).

6. Build/test: no build step (package.json:36-40). `npm ci --ignore-scripts`, `npm run typecheck` (`tsc -p tsconfig.json`), `npm run lint` (`eslint . --max-warnings 0`), `npm test` (`node --test test/config.test.js`) (package.json:37-39, README.md:217). Consumer probe `bash scripts/check-consumer.sh ./*.tgz` (ci.yml:73).

7. CI. ci.yml: name `ci`, job `test` ubuntu-latest; on pull_request (no branch filter) + push main; contents: read (ci.yml:1-17). Steps:
 1 checkout@11d5960a… (v4.4.0) persist-credentials false (22-24); 2 setup-node@49933ea5… (v4.4.0) node 22, cache npm (26-29); 3 `npm ci --ignore-scripts` (33); 4 `npm run typecheck` (35); 5 `npm run lint` (38); 6 `npm test` (42);
 7 "Test against the ends of the typescript peer range": `for version in 5.7 6.0; do npm install --no-save --ignore-scripts "typescript@$version" > /dev/null; echo "typescript $(node -p ...)"; npm test; done; npm ci --ignore-scripts > /dev/null` (47-54);
 8 "Pack and check the tarball's contents": `npm pack --silent > /dev/null`; `tarball=$(ls ./*.tgz)`; `tar -tzf "$tarball" | sort > packed.txt`; `cat packed.txt`; compare to sorted package/{LICENSE,README.md,index.js,package.json,react.js}, `::error::` + diff + exit 1 on mismatch (56-68);
 9 "Lint a scratch consumer with the tarball and the README snippets": `bash scripts/check-consumer.sh ./*.tgz` (72-73). Required check is the single `test` (44-46).
release.yml: name `release`, on push tags `v*`, top-level contents: read (release.yml:1,12-17). Job `build` ubuntu-latest, contents: read (20-23):
 1 checkout same SHA, persist false (28-30); 2 setup-node same, node 22, npm cache (32-35); 3 "Refuse a tag that disagrees with package.json" `${GITHUB_REF_NAME#v}` vs `node -p "require('./package.json').version"` (37-44); 4 `npm ci --ignore-scripts` (46); 5 `npm run typecheck` (48); 6 `npm run lint` (50); 7 `npm test` (52);
 8 Pack id `pack`: `file=$(npm pack --silent | tail -n 1)`, `echo "file=$file" >> "$GITHUB_OUTPUT"`, `tar -tzf "$file"` (54-59); 9 "Prove the tarball in a scratch consumer" env TARBALL=pack output, `bash scripts/check-consumer.sh "$TARBALL"` (61-64); 10 upload-artifact@043fb46d… (v7.0.1) name tarball, if-no-files-found error, retention-days 1 (66-71).
Job `publish` needs build, contents: write, runs no npm (73-79): 1 checkout fetch-depth 0, persist false (82-85); 2 "Refuse a tag whose commit is not on main" `git merge-base --is-ancestor "$GITHUB_SHA" origin/main` (87-92); 3 download-artifact@3e5f45b2… (v8.0.1) name tarball (94-96);
 4 "Refuse a tarball that is not the tagged source, byte for byte": name `v-m-pioneer-trading-eslint-config-${GITHUB_REF_NAME#v}.tgz` must exist, `tar -tzf` lists exactly five files, extract to `mktemp -d`, `cmp` each vs checkout, write `tarball` to $GITHUB_ENV (102-126); 5 "Publish the release with the tarball attached" GH_TOKEN=github.token, `gh release create "$GITHUB_REF_NAME" "$tarball" --repo "$GITHUB_REPOSITORY" --title "$GITHUB_REF_NAME" --generate-notes` (128-135).
check-consumer.sh: removes eslint problem matchers under GHA (13-16); installs tarball + eslint@^10.12.0, typescript-eslint@^8.71.0, typescript@~5.9.0 `--ignore-scripts` into scratch CJS project (33-36); asserts lockfile integrity (37-42); extracts README `js` blocks whose first line starts `// eslint.config.mjs` (25-31); floating promise must fail with no-floating-promises, dist/ and src/generated/ unlinted (79-84); fixed passes (86-87); conditional hook fails rules-of-hooks (104-106); clean React project + vendored lcars script pass (108-129). Editing README snippets can break CI.

8. Persistence: n/a.

9. Patterns: consumers never add/remove/reconfigure rules; a rule change = release + bump per repo (index.js:3-5, README.md:5-8). Config objects named `@v-m-pioneer-trading/...` (index.js:94,98,113,122,138,148,155,161; react.js:25,30). JS + JSDoc, `tsc` strict/checkJs/noUncheckedIndexedAccess (tsconfig.json:9-11,16); self-lint with own base, fixtures ignored (eslint.config.js:5-10). Actions pinned by full SHA + version comment (ci.yml:19-22). Tests lint test/fixtures with real configs, one fixture per rule set, assert exact linted-file list (README.md:220-236). Shipped: index.js, react.js, README.md, LICENSE (+package.json) (package.json:27-32); file list hard-coded in ci.yml:62-63, release.yml:110-111 and the cmp loop release.yml:120, so a new runtime file means editing all three.

10. Traps: release = green main, bump version, merge, `git tag vX.Y.Z && git push origin vX.Y.Z` (README.md:253-263); tag must equal package.json (release.yml:37-44) and be on main (release.yml:87-92); version also in README URLs (README.md:20,209). Semver: major for ESLint/typescript-eslint major, minor if it can report something new, else patch (README.md:253-255). `reportUnusedDisableDirectives: "error"` (index.js:102) makes a loosened rule fail consumers' now-needless disables, hence 1.1.0 minor (CHANGELOG.md:12-14). Re-run: artifact kept 1 day (release.yml:71); if release made but upload failed, `gh release delete vX.Y.Z --repo V-M-Pioneer-Trading/eslint-config` first (README.md:265-270). TS peer range tested only 5.7, 6.0, locked 5.9 (ci.yml:44-54). Plugins exact-pinned but typescript-eslint presets come from consumer's caret peer (README.md:175-182). Known gap: inline config also turning `no-use` off passes, pinned by a test (README.md:144-162, CHANGELOG.md:36-37). agent-service `ts/scripts/check-dependencies.js` was written for the clerk-client tarball only; three checks must learn this devDependency URL (README.md:189-202).

11. Docs: README.md (Install 16, Use 27, Rule sets 117, Dependencies 164, Bumping 204, Development 214, Licence 272); CHANGELOG.md 1.1.0 (3), 1.0.0 (16); LICENSE MIT (LICENSE:1); security-model comments in release.yml:3-11, ci.yml:10-11,19-21,31-32, scripts/check-consumer.sh:2-8.

## Reference docs

- `README.md` Options, Rule sets, Bumping: read when changing the config or bumping a consumer.
