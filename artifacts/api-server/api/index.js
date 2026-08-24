const app = require("../dist/app.js");

module.exports = (req, res) => {
  const expressApp = (app && app.default) ? app.default : app;
  return expressApp(req, res);
};
