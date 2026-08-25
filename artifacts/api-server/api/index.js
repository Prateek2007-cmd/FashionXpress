import { createRequire } from "module";
const require = createRequire(import.meta.url);

let expressApp = null;

export default async function handler(req, res) {
  try {
    if (!expressApp) {
      const appModule = require("../dist/app.cjs");
      expressApp = (appModule && appModule.default) ? appModule.default : appModule;
    }
    return expressApp(req, res);
  } catch (err) {
    console.error("Vercel Serverless Init Error:", err);
    res.status(500).json({
      error: "Vercel Serverless Init Error",
      message: err.message || String(err),
      stack: err.stack,
    });
  }
}
