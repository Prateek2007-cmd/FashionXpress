// @ts-ignore
import app from "../dist/app.mjs";

const handler = (req: any, res: any) => {
  const expressApp = (app && app.default) ? app.default : app;
  return expressApp(req, res);
};

export default handler;
