import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { pinoHttp } from "pino-http";
import { type IncomingMessage, type ServerResponse } from "http";
import router from "./routes/index";
import { logger } from "./lib/logger";

const app: Express = express();

if (!process.env.VERCEL) {
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
}

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Serve uploaded files statically if they exist (local only)
if (!process.env.VERCEL) {
  const uploadsPath = path.join(process.cwd(), "public", "uploads");
  if (fs.existsSync(uploadsPath)) {
    app.use("/uploads", express.static(uploadsPath));
  }
}

// API Routes
app.use("/api", router);

// Root route handler for API-only deployments (e.g. Vercel)
app.get("/", (_req: Request, res: Response) => {
  res.json({
    name: "The Fashion Xpress API Server",
    status: "active",
    version: "1.0.0",
    message: "Server is running smoothly. Access endpoints under /api (e.g. /api/health)",
  });
});

// Fallback handler for unmatched non-API routes
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.method !== "GET" || req.path.startsWith("/api") || req.path.startsWith("/uploads")) {
    next();
    return;
  }

  res.json({
    name: "The Fashion Xpress API Server",
    status: "active",
    path: req.path,
    endpoints: "/api",
  });
});

export default app;
