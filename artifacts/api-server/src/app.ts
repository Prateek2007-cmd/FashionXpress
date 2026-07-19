import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import path from "path";
import { pinoHttp } from "pino-http";
import { type IncomingMessage, type ServerResponse } from "http";
import router from "./routes/index";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req: IncomingMessage) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res: ServerResponse) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

import fs from "fs";

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(process.cwd(), "public", "uploads")));

const publicPath = path.resolve(import.meta.dirname, "../../fashion-xpress/dist/public");
logger.info({ publicPath, exists: fs.existsSync(publicPath), indexExists: fs.existsSync(path.join(publicPath, "index.html")) }, "SPA static paths check");

app.use(express.static(publicPath, { redirect: false }));

app.use("/api", router);

// SPA fallback for client-side routing
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.method !== "GET") {
    next();
    return;
  }
  if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) {
    next();
    return;
  }

  const candidatePaths = [
    path.join(publicPath, "index.html"),
    path.resolve(process.cwd(), "artifacts/fashion-xpress/dist/public/index.html"),
    path.resolve(process.cwd(), "fashion-xpress/dist/public/index.html"),
    path.resolve(process.cwd(), "dist/public/index.html"),
  ];

  const targetFile = candidatePaths.find(p => fs.existsSync(p));

  if (!targetFile) {
    logger.error({ candidatePaths, cwd: process.cwd() }, "SPA index.html not found in any candidate path");
    res.status(404).send("Not Found");
    return;
  }

  res.sendFile(targetFile, (err) => {
    if (err) {
      logger.error({ err, targetFile }, "Error sending SPA index.html");
      res.status(500).send("Error serving application");
    }
  });
});

export default app;
