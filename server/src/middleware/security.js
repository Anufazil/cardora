import jwt from "jsonwebtoken";
import { randomBytes, createHash, timingSafeEqual } from "node:crypto";
import mongoose from "mongoose";
import { config } from "../config/env.js";
import { User, Session } from "../models/index.js";
export const hash = (s) => createHash("sha256").update(s).digest("hex");
export const httpError = (status, message) =>
  Object.assign(new Error(message), { status });
export const cookieOptions = {
  httpOnly: true,
  secure: config.production,
  sameSite: "lax",
  path: "/",
};
export function csrf(req, res, next) {
  let token = req.cookies.csrf;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) {
    token = randomBytes(32).toString("hex");
    res.cookie("csrf", token, { ...cookieOptions, httpOnly: false });
  }
  req.csrfToken = token;
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  const origin = req.headers.origin;
  if (origin !== new URL(config.appUrl).origin)
    return next(httpError(403, "Request origin is not allowed."));
  const supplied = req.headers["x-csrf-token"];
  if (
    typeof supplied !== "string" ||
    supplied.length !== token.length ||
    !timingSafeEqual(Buffer.from(supplied), Buffer.from(token))
  )
    return next(
      httpError(403, "Security token expired. Refresh and try again."),
    );
  next();
}
export async function authenticate(req, res, next) {
  try {
    const decoded = jwt.verify(req.cookies.session || "", config.jwtSecret, {
      algorithms: ["HS256"],
      issuer: "cardora",
      audience: "cardora-web",
    });
    const [user, session] = await Promise.all([
      User.findById(decoded.sub),
      Session.findOne({
        owner: decoded.sub,
        tokenHash: hash(decoded.jti),
        expiresAt: { $gt: new Date() },
      }),
    ]);
    if (
      !user ||
      !session ||
      user.sessionVersion !== decoded.version ||
      user.accountStatus !== "active"
    )
      throw new Error();
    req.user = user;
    req.session = session;
    next();
  } catch {
    next(httpError(401, "Please sign in to continue."));
  }
}
export async function createSession(user, res) {
  const jti = randomBytes(32).toString("hex");
  await Session.create({
    owner: user._id,
    tokenHash: hash(jti),
    expiresAt: new Date(Date.now() + 7 * 86400000),
  });
  const token = jwt.sign({ version: user.sessionVersion }, config.jwtSecret, {
    subject: String(user._id),
    jwtid: jti,
    expiresIn: "7d",
    issuer: "cardora",
    audience: "cardora-web",
    algorithm: "HS256",
  });
  res.cookie("session", token, { ...cookieOptions, maxAge: 7 * 86400000 });
}
export function validId(id) {
  if (!mongoose.isValidObjectId(id))
    throw httpError(400, "Invalid resource ID.");
  return id;
}
export const publicUser = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  emailVerified: u.emailVerified,
  role: u.role,
  plan: u.plan,
});
export function errorHandler(err, req, res, next) {
  if (err.type === "entity.parse.failed")
    return res
      .status(400)
      .json({ error: { message: "Request body must be valid JSON." } });
  if (err.name === "ZodError")
    return res
      .status(400)
      .json({
        error: {
          message: "Please check the form.",
          fields: err.issues.map((i) => ({
            path: i.path.join("."),
            message: i.message,
          })),
        },
      });
  if (err.code === 11000)
    return res
      .status(409)
      .json({
        error: { message: "That email or profile address is already in use." },
      });
  const status = err.status || (err.code === "LIMIT_FILE_SIZE" ? 413 : 500);
  if (status >= 500)
  console.error("Request failed:", err.name, err.code, err.command, err.responseCode, err.message);
  res
    .status(status)
    .json({
      error: {
        message:
          status >= 500
            ? "Something went wrong. Please try again."
            : err.message,
      },
    });
}
