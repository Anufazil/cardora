import nodemailer from "nodemailer";
import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { config, root } from "../config/env.js";
import { ActionToken } from "../models/index.js";
import { hash } from "../middleware/security.js";
export async function sendAction(user, purpose) {
  const token = randomBytes(32).toString("hex");
  const record = await ActionToken.create({
    owner: user._id,
    purpose,
    hash: hash(token),
    expiresAt: new Date(Date.now() + (purpose === "reset" ? 30 : 1440) * 60000),
  });
  const url = `${config.appUrl}/${purpose === "reset" ? "reset-password" : "verify-email"}#token=${token}`;
  const mail = {
    from: process.env.MAIL_FROM || "Cardora <noreply@example.com>",
    to: user.email,
    subject:
      purpose === "reset"
        ? "Reset your Cardora password"
        : "Verify your Cardora email",
    text: `Open this link to ${purpose === "reset" ? "reset your password" : "verify your email"}:\n\n${url}\n\nIf you did not request this, ignore this email.`,
  };
  try {
    if (config.mailDriver === "file" && !config.production) {
      await mkdir(resolve(root, "work/mail"), { recursive: true });
      await writeFile(
        resolve(root, `work/mail/${record.id}.json`),
        JSON.stringify(mail, null, 2),
        { mode: 0o600 },
      );
    } else {
      const transport = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
      });
      await transport.sendMail(mail);
    }
  } catch (error) {
    await ActionToken.deleteOne({ _id: record._id });
    throw error;
  }
}
