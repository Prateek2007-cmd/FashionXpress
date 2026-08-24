import app from "../dist/app.js";

export default function handler(req, res) {
  const expressApp = (app && app.default) ? app.default : app;
  return expressApp(req, res);
}
