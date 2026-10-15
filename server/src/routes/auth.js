import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { User, Session, ActionToken } from "../models/index.js";
import { registerSchema, loginSchema, password } from "../validators/index.js";
import {
  authenticate,
  createSession,
  publicUser,
  cookieOptions,
  httpError,
  hash,
} from "../middleware/security.js";
import { sendAction } from "../services/mail.js";
export const auth = Router();
auth.get("/csrf", (req, res) =>
  res.json({ data: { csrfToken: req.csrfToken } }),
);
auth.get("/me", authenticate, (req, res) =>
  res.json({ data: publicUser(req.user) }),
);
auth.use(
  rateLimit({
    windowMs: 15 * 60000,
    limit: process.env.NODE_ENV === "test" ? 1000 : 30,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
      error: { message: "Too many attempts. Try again in 15 minutes." },
    },
  }),
);
auth.post("/register", async (req, res) => {
  const data = registerSchema.parse(req.body);
  const user = await User.create({
    name: data.name,
    email: data.email,
    passwordHash: await bcrypt.hash(data.password, 12),
  });
  let emailSent = true;
  try {
    await sendAction(user, "verify");
  } catch {
    emailSent = false;
  }
  await createSession(user, res);
  res.status(201).json({ data: publicUser(user), meta: { emailSent } });
});
auth.post("/login", async (req, res) => {
  const data = loginSchema.parse(req.body);
  const user = await User.findOne({ email: data.email }).select(
    "+passwordHash",
  );
  // Comparable hash work for unknown accounts reduces timing-based enumeration.
  const match = await bcrypt.compare(
    data.password,
    user?.passwordHash ||
      "$2b$12$zhn84HVKxp90LsXpeVIIKOvJhOGnrO7.YVWaaCA.TivwWxCILwt2e",
  );
  if (!user || !match || user.accountStatus !== "active")
    throw httpError(401, "Email or password is incorrect.");
  await createSession(user, res);
  res.json({ data: publicUser(user) });
});
auth.post("/logout", authenticate, async (req, res) => {
  await req.session.deleteOne();
  res.clearCookie("session", cookieOptions);
  res.json({ data: { ok: true } });
});
auth.post("/forgot-password", async (req, res) => {
  const { email } = z.object({ email: z.email() }).parse(req.body);
  const user = await User.findOne({ email: email.toLowerCase() });
  if (user) {
    try {
      await sendAction(user, "reset");
    } catch {
      /* Response deliberately remains identical to prevent account enumeration. */
    }
  }
  res.json({
    data: { message: "If an account exists, a reset link has been sent." },
  });
});
auth.post("/resend-verification", authenticate, async (req, res) => {
  if (!req.user.emailVerified) await sendAction(req.user, "verify");
  res.json({ data: { message: "Verification email sent." } });
});
async function consume(token, purpose) {
  const found = await ActionToken.findOneAndDelete({
    hash: hash(token),
    purpose,
    expiresAt: { $gt: new Date() },
  });
  if (!found)
    throw httpError(400, "This link has expired or has already been used.");
  return found;
}
auth.post("/verify-email", async (req, res) => {
  const { token } = z
    .object({ token: z.string().regex(/^[a-f0-9]{64}$/) })
    .parse(req.body);
  const record = await consume(token, "verify");
  await User.updateOne({ _id: record.owner }, { emailVerified: true });
  res.json({ data: { message: "Your email is verified." } });
});
auth.post("/reset-password", async (req, res) => {
  const data = z
    .object({ token: z.string().regex(/^[a-f0-9]{64}$/), password })
    .parse(req.body);
  const record = await consume(data.token, "reset");
  await User.updateOne(
    { _id: record.owner },
    {
      $set: { passwordHash: await bcrypt.hash(data.password, 12) },
      $inc: { sessionVersion: 1 },
    },
  );
  await Promise.all([
    Session.deleteMany({ owner: record.owner }),
    ActionToken.deleteMany({ owner: record.owner, purpose: "reset" }),
  ]);
  res.clearCookie("session", cookieOptions);
  res.json({
    data: { message: "Password updated. Sign in with your new password." },
  });
});
auth.patch("/account", authenticate, async (req, res) => {
  const { name } = z
    .object({ name: z.string().trim().min(2).max(100) })
    .strict()
    .parse(req.body);
  req.user.name = name;
  await req.user.save();
  res.json({ data: publicUser(req.user) });
});
