// @ts-check
// `void`: node:test returns a promise from describe()/it() that it awaits
// itself, and no-floating-promises cannot know that.
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

void describe("base", () => {
  const eslint = eslintFor(BASE, base({ tsconfigRootDir: BASE, ignores: ["src/legacy.ts"] }));
  const linted = lint(eslint, BASE);
  linted.catch(() => undefined); // awaited, and so reported, by every test

  void it("reports nothing on a clean file, with type information", async () => {
    assert.deepEqual(rulesIn(await linted, "src/clean.ts"), []);
  });

  void it("reports a floating promise (strictTypeChecked, type-aware)", async () => {
    assert.ok(rulesIn(await linted, "src/floating.ts").includes("@typescript-eslint/no-floating-promises"));
  });

  void it("reports an unused variable", async () => {
    assert.ok(rulesIn(await linted, "src/unused.ts").includes("@typescript-eslint/no-unused-vars"));
  });

  void it("ignores _-prefixed parameters and caught errors (Express arity stubs)", async () => {
    assert.deepEqual(rulesIn(await linted, "src/underscore-ignored.ts"), []);
  });

  void it("still reports the same unused parameter and caught error without the underscore", async () => {
    // `req` is before the used `res`, so after-used lets it through; `next`
    // (last, unused) and the caught `e` are reported.
    const result = (await eslint.lintFiles(["src/unused-arg.ts"]))[0];
    assert.ok(result);
    assert.deepEqual(
      result.messages.map((m) => `${m.ruleId ?? "?"}: ${m.message}`),
      [
        "@typescript-eslint/no-unused-vars: 'next' is defined but never used. Allowed unused args must match /^_/u.",
        "@typescript-eslint/no-unused-vars: 'e' is defined but never used. Allowed unused caught errors must match /^_/u.",
      ],
    );
  });

  void it("reports an any flowing out of JSON.parse (no-unsafe-*)", async () => {
    const rules = rulesIn(await linted, "src/unsafe.ts");
    assert.ok(rules.includes("@typescript-eslint/no-unsafe-assignment"));
    assert.ok(rules.includes("@typescript-eslint/no-unsafe-member-access"));
  });

  void it("requires `import type` for a type-only import", async () => {
    assert.ok(rulesIn(await linted, "src/type-import.ts").includes("@typescript-eslint/consistent-type-imports"));
  });

  void it("refuses an eslint-disable without a reason, and only that", async () => {
    assert.deepEqual(rulesIn(await linted, "src/bare-disable.ts"), [
      "@eslint-community/eslint-comments/require-description",
    ]);
  });

  void it("accepts an eslint-disable that gives a reason after --", async () => {
    assert.deepEqual(rulesIn(await linted, "src/described-disable.ts"), []);
  });

  void it("reports an unused eslint-disable as an error", async () => {
    const result = (await eslint.lintFiles(["src/unused-disable.ts"]))[0];
    assert.ok(result);
    assert.equal(result.messages.length, 1);
    const [message] = result.messages;
    assert.ok(message);
    assert.equal(message.ruleId, null);
    assert.equal(message.severity, 2);
    assert.match(message.message, /Unused eslint-disable directive/);
  });

  void it("reports an unused inline config as an error", async () => {
    const result = (await eslint.lintFiles(["src/unused-inline-config.ts"]))[0];
    assert.ok(result);
    const unused = result.messages.filter((m) => m.ruleId === null);
    assert.equal(unused.length, 1);
    const [message] = unused;
    assert.ok(message);
    assert.equal(message.severity, 2);
    assert.match(message.message, /Unused inline config/);
  });

  void it("refuses a file-wide `/* eslint rule: off */`", async () => {
    assert.ok(rulesIn(await linted, "src/inline-config.ts").includes("@eslint-community/eslint-comments/no-use"));
  });

  void it("KNOWN GAP: an inline config that turns no-use off passes", async () => {
    // Pinned, not endorsed: see the fixture and the README. Visible in
    // review, not enforced by lint.
    assert.deepEqual(rulesIn(await linted, "src/self-disabling-inline-config.ts"), []);
  });

  void it("refuses an eslint-disable that names no rule", async () => {
    assert.ok(
      rulesIn(await linted, "src/unlimited-disable.ts").includes("@eslint-community/eslint-comments/no-unlimited-disable"),
    );
  });

  void it("applies stylisticTypeChecked", async () => {
    const rules = rulesIn(await linted, "src/stylistic.ts");
    assert.ok(rules.includes("@typescript-eslint/array-type"));
    assert.ok(rules.includes("@typescript-eslint/prefer-nullish-coalescing"));
  });

  void it("applies strictTypeChecked, not just recommendedTypeChecked", async () => {
    // no-unnecessary-condition is in strict-type-checked only.
    assert.ok(rulesIn(await linted, "src/strict-only.ts").includes("@typescript-eslint/no-unnecessary-condition"));
  });

  void it("lints JavaScript outside every tsconfig without type information", async () => {
    // Parses (no fatal from the project service) and the type-free rules run.
    assert.deepEqual(rulesIn(await linted, "scripts/tool.js"), ["@typescript-eslint/no-unused-vars"]);
  });

  void it("accepts require() in .cjs and reports it anywhere else", async () => {
    assert.deepEqual(rulesIn(await linted, "scripts/legacy.cjs"), []);
    assert.deepEqual(rulesIn(await linted, "scripts/legacy-require.js"), ["@typescript-eslint/no-require-imports"]);
  });

  for (const ignored of ["dist/routes.ts", "build/routes.ts", "coverage/routes.ts", "src/generated/routes.ts"]) {
    void it(`never lints ${ignored}`, async () => {
      assert.equal((await linted).has(ignored), false);
      assert.equal(await eslint.isPathIgnored(path.join(BASE, ignored)), true);
    });
  }

  void it("adds the consumer's `ignores` to the shared ones", async () => {
    assert.equal((await linted).has("src/legacy.ts"), false);
    const withoutHook = eslintFor(BASE, base({ tsconfigRootDir: BASE }));
    assert.equal(await withoutHook.isPathIgnored(path.join(BASE, "src/legacy.ts")), false);
    assert.equal(await withoutHook.isPathIgnored(path.join(BASE, "dist/routes.ts")), true);
  });

  void it("lints exactly the expected files", async () => {
    assert.deepEqual([...(await linted).keys()].sort(), [
      "scripts/legacy-require.js",
      "scripts/legacy.cjs",
      "scripts/tool.js",
      "src/bare-disable.ts",
      "src/clean.ts",
      "src/described-disable.ts",
      "src/floating.ts",
      "src/inline-config.ts",
      "src/self-disabling-inline-config.ts",
      "src/strict-only.ts",
      "src/stylistic.ts",
      "src/type-import.ts",
      "src/underscore-ignored.ts",
      "src/unlimited-disable.ts",
      "src/unsafe.ts",
      "src/unused-arg.ts",
      "src/unused-disable.ts",
      "src/unused-inline-config.ts",
      "src/unused.ts",
    ]);
  });
});

void describe("options", () => {
  void it("demands tsconfigRootDir", () => {
    // @ts-expect-error -- the missing option is the point of the test
    assert.throws(() => base({}), /tsconfigRootDir/);
    // @ts-expect-error -- as is the missing argument
    assert.throws(() => react(), /tsconfigRootDir/);
  });

  void it("refuses files and ignores that are not arrays of globs", () => {
    // @ts-expect-error -- a bare string is the mistake being refused
    assert.throws(() => base({ tsconfigRootDir: BASE, ignores: "dist" }), /ignores/);
    assert.throws(() => base({ tsconfigRootDir: BASE, files: [] }), /files/);
  });

  void it("refuses a negated ignore, which would bring a shared ignore back", () => {
    assert.throws(() => base({ tsconfigRootDir: BASE, ignores: ["!dist/keep.ts"] }), /un-ignore/);
  });
});

void describe("react", () => {
  const eslint = eslintFor(REACT, react({ tsconfigRootDir: REACT }));
  const linted = lint(eslint, REACT);
  linted.catch(() => undefined); // awaited, and so reported, by every test

  void it("enforces the Rules of Hooks", async () => {
    assert.ok(rulesIn(await linted, "src/hooks.ts").includes("react-hooks/rules-of-hooks"));
  });

  void it("keeps a Fast Refresh boundary to components only", async () => {
    assert.ok(rulesIn(await linted, "src/mixed.tsx").includes("react-refresh/only-export-components"));
  });

  void it("allows a constant export next to a component (vite's allowConstantExport)", async () => {
    assert.ok(!rulesIn(await linted, "src/constant.tsx").includes("react-refresh/only-export-components"));
  });

  void it("reports a missing effect dependency and a setState in an effect", async () => {
    const rules = rulesIn(await linted, "src/effects.tsx");
    assert.ok(rules.includes("react-hooks/exhaustive-deps"));
    assert.ok(rules.includes("react-hooks/set-state-in-effect"));
  });

  void it("lints .tsx with type information", async () => {
    assert.ok(rulesIn(await linted, "src/app.tsx").includes("@typescript-eslint/no-floating-promises"));
  });

  void it("keeps everything from base", () => {
    const config = react({ tsconfigRootDir: REACT });
    const names = new Set(config.map((c) => c.name));
    for (const c of base({ tsconfigRootDir: REACT })) assert.ok(names.has(c.name), `missing ${String(c.name)}`);
  });
});
