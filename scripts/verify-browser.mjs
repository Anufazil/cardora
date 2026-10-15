import { spawn } from "node:child_process";
import { MongoMemoryServer } from "mongodb-memory-server";
import { mkdir, mkdtemp } from "node:fs/promises";
import { resolve } from "node:path";
import { randomBytes } from "node:crypto";
import mongoose from "mongoose";
import { createServer } from "vite";
process.env.NODE_ENV = "test";
process.env.APP_URL = "http://localhost:4382";
process.env.PORT = "4383";
process.env.JWT_SECRET = randomBytes(48).toString("hex");
process.env.ANALYTICS_SECRET = randomBytes(48).toString("hex");
process.env.MAIL_DRIVER = "file";
process.env.MEDIA_DRIVER = "local";
await mkdir("work/browser-databases", { recursive: true });
const dbPath = await mkdtemp(resolve("work/browser-databases/run-"));
const db = await MongoMemoryServer.create({
  instance: { dbPath, launchTimeout: 60000 },
});
process.env.MONGODB_URI = db.getUri();
const { app } = await import("../server/src/app.js");
await mongoose.connect(db.getUri());
await Promise.all(Object.values(mongoose.models).map((m) => m.init()));
const api = app.listen(4383, "127.0.0.1");
await new Promise((r) => api.once("listening", r));
const vite = await createServer({
  root: resolve("client"),
  configFile: resolve("client/vite.config.js"),
  server: {
    host: "127.0.0.1",
    port: 4382,
    strictPort: true,
    proxy: {
      "/api": "http://127.0.0.1:4383",
      "/media": "http://127.0.0.1:4383",
    },
  },
});
await vite.listen();
console.log(
  "Browser-test app HTTP status:",
  (await fetch("http://127.0.0.1:4382")).status,
);
const child = spawn(
  process.execPath,
  ["node_modules/@playwright/test/cli.js", "test"],
  {
    env: { ...process.env, TEST_BASE_URL: "http://localhost:4382" },
    stdio: "inherit",
  },
);
const code = await new Promise((r) => child.once("exit", r));
await vite.close();
await new Promise((r) => api.close(r));
await mongoose.disconnect();
await db.stop();
process.exit(code || 0);
