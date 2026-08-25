let appInstance: any = null;

export default async function handler(req: any, res: any) {
  try {
    if (!appInstance) {
      const appModule = await import("../src/app");
      appInstance = appModule.default || appModule;
    }
    return appInstance(req, res);
  } catch (err: any) {
    console.error("Vercel Serverless Invocation Error:", err);
    res.status(500).json({
      error: "Vercel Serverless Invocation Error",
      message: err?.message || String(err),
      stack: err?.stack,
    });
  }
}
