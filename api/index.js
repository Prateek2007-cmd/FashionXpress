const app = require("../artifacts/api-server/dist/app.cjs");

module.exports = (req, res) => {
  const expressApp = (app && app.default) ? app.default : app;
  return expressApp(req, res);
};
