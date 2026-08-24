let expressApp: any = null;

export default async function handler(req: any, res: any) {
  try {
    if (!expressApp) {
      // @ts-ignore
      const appModule = await import("../dist/app.js");
      expressApp = (appModule && appModule.default) ? appModule.default : appModule;
    }
    return expressApp(req, res);
  } catch (err: any) {
    console.error("Vercel Serverless Error:", err);
    res.status(500).json({
      error: "Server Initialization Error",
      message: err.message || String(err),
      stack: err.stack,
    });
  }
}
