import fs from "node:fs";
import path from "node:path";

const envPaths = [
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "../../.env"),
];

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    try {
      // @ts-ignore
      if (typeof process.loadEnvFile === "function") {
        // @ts-ignore
        process.loadEnvFile(envPath);
      }
      break;
    } catch {}
  }
}
