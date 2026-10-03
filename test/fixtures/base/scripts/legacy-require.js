// require() in a file not named .cjs is reported: rename it.
const path = require("node:path");

export const separator = path.sep;
