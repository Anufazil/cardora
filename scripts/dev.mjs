import { MongoMemoryServer } from "mongodb-memory-server";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import mongoose from "mongoose";
import { createServer } from "vite";
await import("./setup.mjs");
await mkdir("work/database", { recursive: true });
// This is a real local mongod with durable WiredTiger files, not a mock database.
const db = await MongoMemoryServer.create({
  instance: {
    dbPath: resolve("work/database"),
    storageEngine: "wiredTiger",
    dbName: "cardora",
    launchTimeout: 60000,
  },
});
process.env.MONGODB_URI = db.getUri("cardora");
const { config, validateConfig } = await import("../server/src/config/env.js");
const { app } = await import("../server/src/app.js");
validateConfig();
await mongoose.connect(config.mongo);
await Promise.all(Object.values(mongoose.models).map((model) => model.init()));
const server = app.listen(config.port, "127.0.0.1");
await new Promise((resolve, reject) => {
  server.once("listening", resolve);
  server.once("error", reject);
});
const client = await createServer({
  root: resolve("client"),
  configFile: resolve("client/vite.config.js"),
  server: { host: "127.0.0.1", strictPort: true },
});
await client.listen();
console.log(
  `Cardora ready at ${config.appUrl} | API http://localhost:${config.port}`,
);
console.log(
  "Frontend changes reload automatically. Restart this command after backend changes.",
);
let stopping = false;
async function stop() {
  if (stopping) return;
  stopping = true;
  await client.close();
  await new Promise((resolve) => server.close(resolve));
  await mongoose.disconnect();
  await db.stop({ doCleanup: false });
  process.exit();
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
