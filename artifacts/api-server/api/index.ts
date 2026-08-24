// @ts-ignore
import app from "../dist/app.js";

export default function handler(req: any, res: any) {
  try {
    const expressApp = (app && (app as any).default) ? (app as any).default : app;
    return expressApp(req, res);
  } catch (err: any) {
    console.error("Vercel Serverless Handler Error:", err);
    res.status(500).json({
      error: "Vercel Serverless Initialization Error",
      message: err.message,
    });
  }
}
