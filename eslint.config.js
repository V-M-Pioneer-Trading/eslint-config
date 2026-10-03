// The package lints itself with its own base config. Its source is JavaScript
// typechecked through JSDoc (tsconfig.json), so it is linted type-aware too.
import { base } from "./index.js";

export default base({
  tsconfigRootDir: import.meta.dirname,
  files: ["index.js", "react.js", "test/*.js"],
  // Deliberately full of violations: they are what the tests assert.
  ignores: ["test/fixtures/"],
});
