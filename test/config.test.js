// @ts-check
// Lints the fixtures with the real configs and asserts which rules fire where.
// Every assertion names a rule, so a preset dropped, a rule renamed upstream
// or an ignore lost is a red test rather than a quieter lint run.
import assert from "node:assert/strict";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { ESLint } from "eslint";
import { base } from "../index.js";
import { react } from "../react.js";

const fixtures = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures");
const BASE = path.join(fixtures, "base");
const REACT = path.join(fixtures, "react");

/**
 * @param {string} cwd
 * @param {import("eslint").Linter.Config[]} config
 */
function eslintFor(cwd, config) {
  return new ESLint({ cwd, overrideConfigFile: true, overrideConfig: config });
}

/**
 * Lints `cwd` as `eslint .` would and returns rule ids per relative path.
 * A fatal message (a parse error, a file the project service refused) fails
 * here, whatever the caller asserts.
 *
 * @param {ESLint} eslint
 * @param {string} cwd
 * @returns {Promise<Map<string, string[]>>}
 */
async function lint(eslint, cwd) {
  const results = await eslint.lintFiles(["."]);
  /** @type {Map<string, string[]>} */
  const byFile = new Map();
  for (const result of results) {
    const file = path.relative(cwd, result.filePath).split(path.sep).join("/");
    for (const m of result.messages) {
      assert.ok(!m.fatal, `${file}: fatal: ${m.message}`);
    }
    byFile.set(
      file,
      result.messages.map((m) => m.ruleId ?? `(directive) ${m.message}`),
    );
  }
  return byFile;
}

/**
 * @param {Map<string, string[]>} byFile
 * @param {string} file
 */
function rulesIn(byFile, file) {
  const rules = byFile.get(file);
  assert.ok(rules, `${file} was not linted; linted: ${[...byFile.keys()].join(", ")}`);
  return rules;
}

describe("base", () => {
  const eslint = eslintFor(BASE, base({ tsconfigRootDir: BASE, ignores: ["src/legacy.ts"] }));
  const linted = lint(eslint, BASE);
  linted.catch(() => undefined); // awaited, and so reported, by every test

  it("reports nothing on a clean file, with type information", async () => {
    assert.deepEqual(rulesIn(await linted, "src/clean.ts"), []);
  });

  it("reports a floating promise (strictTypeChecked, type-aware)", async () => {
    assert.ok(rulesIn(await linted, "src/floating.ts").includes("@typescript-eslint/no-floating-promises"));
  });

  it("reports an unused variable", async () => {
    assert.ok(rulesIn(await linted, "src/unused.ts").includes("@typescript-eslint/no-unused-vars"));
  });

  it("reports an any flowing out of JSON.parse (no-unsafe-*)", async () => {
    const rules = rulesIn(await linted, "src/unsafe.ts");
    assert.ok(rules.includes("@typescript-eslint/no-unsafe-assignment"));
    assert.ok(rules.includes("@typescript-eslint/no-unsafe-member-access"));
  });

  it("requires `import type` for a type-only import", async () => {
    assert.ok(rulesIn(await linted, "src/type-import.ts").includes("@typescript-eslint/consistent-type-imports"));
  });

  it("refuses an eslint-disable without a reason, and only that", async () => {
    assert.deepEqual(rulesIn(await linted, "src/bare-disable.ts"), [
      "@eslint-community/eslint-comments/require-description",
    ]);
  });

  it("accepts an eslint-disable that gives a reason after --", async () => {
    assert.deepEqual(rulesIn(await linted, "src/described-disable.ts"), []);
  });

  it("reports an unused eslint-disable as an error", async () => {
    const result = (await eslint.lintFiles(["src/unused-disable.ts"]))[0];
    assert.ok(result);
    assert.equal(result.messages.length, 1);
    const [message] = result.messages;
    assert.ok(message);
    assert.equal(message.ruleId, null);
    assert.equal(message.severity, 2);
    assert.match(message.message, /Unused eslint-disable directive/);
  });

  it("lints JavaScript outside every tsconfig without type information", async () => {
    // Parses (no fatal from the project service) and the type-free rules run.
    assert.deepEqual(rulesIn(await linted, "scripts/tool.js"), ["@typescript-eslint/no-unused-vars"]);
  });

  for (const ignored of ["dist/routes.ts", "build/routes.ts", "coverage/routes.ts", "src/generated/routes.ts"]) {
    it(`never lints ${ignored}`, async () => {
      assert.equal((await linted).has(ignored), false);
      assert.equal(await eslint.isPathIgnored(path.join(BASE, ignored)), true);
    });
  }

  it("adds the consumer's `ignores` to the shared ones", async () => {
    assert.equal((await linted).has("src/legacy.ts"), false);
    const withoutHook = eslintFor(BASE, base({ tsconfigRootDir: BASE }));
    assert.equal(await withoutHook.isPathIgnored(path.join(BASE, "src/legacy.ts")), false);
    assert.equal(await withoutHook.isPathIgnored(path.join(BASE, "dist/routes.ts")), true);
  });

  it("lints exactly the expected files", async () => {
    assert.deepEqual([...(await linted).keys()].sort(), [
      "scripts/tool.js",
      "src/bare-disable.ts",
      "src/clean.ts",
      "src/described-disable.ts",
      "src/floating.ts",
      "src/type-import.ts",
      "src/unsafe.ts",
      "src/unused-disable.ts",
      "src/unused.ts",
    ]);
  });
});

describe("options", () => {
  it("demands tsconfigRootDir", () => {
    // @ts-expect-error -- the missing option is the point of the test
    assert.throws(() => base({}), /tsconfigRootDir/);
    // @ts-expect-error -- as is the missing argument
    assert.throws(() => react(), /tsconfigRootDir/);
  });

  it("refuses files and ignores that are not arrays of globs", () => {
    // @ts-expect-error -- a bare string is the mistake being refused
    assert.throws(() => base({ tsconfigRootDir: BASE, ignores: "dist" }), /ignores/);
    assert.throws(() => base({ tsconfigRootDir: BASE, files: [] }), /files/);
  });
});

describe("react", () => {
  const eslint = eslintFor(REACT, react({ tsconfigRootDir: REACT, files: ["src/**/*.{ts,tsx,js,jsx}"] }));
  const linted = lint(eslint, REACT);
  linted.catch(() => undefined); // awaited, and so reported, by every test

  it("enforces the Rules of Hooks", async () => {
    assert.ok(rulesIn(await linted, "src/hooks.ts").includes("react-hooks/rules-of-hooks"));
  });

  it("keeps a Fast Refresh boundary to components only", async () => {
    assert.ok(rulesIn(await linted, "src/mixed.tsx").includes("react-refresh/only-export-components"));
  });

  it("lints .jsx opted in through `files` with type information", async () => {
    assert.ok(rulesIn(await linted, "src/app.jsx").includes("@typescript-eslint/no-floating-promises"));
  });

  it("keeps everything from base", async () => {
    const config = react({ tsconfigRootDir: REACT });
    const names = new Set(config.map((c) => c.name));
    for (const c of base({ tsconfigRootDir: REACT })) assert.ok(names.has(c.name), `missing ${String(c.name)}`);
  });
});
