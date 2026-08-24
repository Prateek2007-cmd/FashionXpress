import path from "path";
import fs from "fs";

let expressApp: any = null;

export default async function handler(req: any, res: any) {
  try {
    if (!expressApp) {
      const candidatePaths = [
        path.resolve(process.cwd(), "artifacts/api-server/dist/app.js"),
        path.resolve(process.cwd(), "dist/app.js"),
        path.resolve(process.cwd(), ".vercel/output/functions/api/index.func/dist/app.js"),
      ];
      const targetPath = candidatePaths.find(p => fs.existsSync(p));
      if (!targetPath) {
        throw new Error(`dist/app.js not found. Tried paths: ${candidatePaths.join(" | ")}`);
      }
      const appModule = await import(targetPath);
      expressApp = (appModule && (appModule as any).default) ? (appModule as any).default : appModule;
    }
    return expressApp(req, res);
  } catch (err: any) {
    console.error("Vercel Serverless Handler Error:", err);
    res.status(500).json({
      error: "Vercel Serverless Initialization Error",
      message: err.message,
      stack: err.stack
    });
  }
}
