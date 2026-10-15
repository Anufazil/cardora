import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";
export const root = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../..",
);
dotenv.config({ path: resolve(root, ".env"), quiet: true });
export const config = {
  production: process.env.NODE_ENV === "production",
  port: Number(process.env.PORT || 4381),
  appUrl: process.env.APP_URL || "http://localhost:4380",
  mongo: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  analyticsSecret: process.env.ANALYTICS_SECRET,
  mediaDriver: process.env.MEDIA_DRIVER || "local",
  mailDriver: process.env.MAIL_DRIVER || "file",
};
export function validateConfig() {
  for (const key of ["mongo", "jwtSecret", "analyticsSecret"])
    if (!config[key] || (key !== "mongo" && config[key].length < 32))
      throw new Error(`Missing or weak configuration: ${key}`);
  if (
    config.production &&
    (!config.appUrl.startsWith("https://") ||
      config.mediaDriver !== "cloudinary" ||
      config.mailDriver !== "smtp")
  )
    throw new Error("Production requires HTTPS, Cloudinary and SMTP.");
}
