import mongoose from "mongoose";
import { config, validateConfig } from "./config/env.js";
import { app } from "./app.js";
validateConfig();
await mongoose.connect(config.mongo, { serverSelectionTimeoutMS: 10000 });
await Promise.all(Object.values(mongoose.models).map((m) => m.init()));
const server = app.listen(
  config.port,
  config.production ? "0.0.0.0" : "127.0.0.1",
  () => console.log(`Cardora API ready at http://localhost:${config.port}`),
);
async function shutdown() {
  server.close();
  await mongoose.disconnect();
  process.exit(0);
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
