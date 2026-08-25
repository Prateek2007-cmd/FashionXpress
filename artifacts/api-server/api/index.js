import { createRequire } from "module";
const require = createRequire(import.meta.url);

const app = require("../dist/app.cjs");

export default function handler(req, res) {
  const expressApp = (app && app.default) ? app.default : app;
  return expressApp(req, res);
}
