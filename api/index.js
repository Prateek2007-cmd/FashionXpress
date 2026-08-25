import { createRequire } from "module";
const require = createRequire(import.meta.url);

const app = require("../artifacts/api-server/dist/app.cjs");

export default function handler(req, res) {
  const expressApp = (app && app.default) ? app.default : app;
  return expressApp(req, res);
}
