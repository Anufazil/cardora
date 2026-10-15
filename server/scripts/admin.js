import mongoose from "mongoose";
import { config, validateConfig } from "../src/config/env.js";
import { User } from "../src/models/index.js";
validateConfig();
const email = process.argv[2];
if (!email || !email.includes("@"))
  throw new Error(
    "Usage: npm run admin -w server -- existing-user@example.com",
  );
await mongoose.connect(config.mongo);
const user = await User.findOneAndUpdate(
  { email: email.toLowerCase(), emailVerified: true },
  { role: "admin" },
);
if (!user) throw new Error("A verified existing account is required.");
console.log("Administrator role granted.");
await mongoose.disconnect();
