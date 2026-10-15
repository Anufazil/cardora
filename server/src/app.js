import express from "express";
import mongoose from "mongoose";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { resolve } from "node:path";
import { existsSync, readFileSync } from "node:fs";
import { config, root } from "./config/env.js";
import {
  csrf,
  errorHandler,
  authenticate,
  httpError,
  validId,
} from "./middleware/security.js";
import { auth } from "./routes/auth.js";
import { cards, portfolio } from "./routes/cards.js";
import { media } from "./routes/media.js";
import { publicProfiles } from "./routes/public.js";
import { analytics } from "./routes/analytics.js";
import { User, BusinessCard } from "./models/index.js";
import { z } from "zod";
export const app = express();
app.disable("x-powered-by");
app.set("trust proxy", Number(process.env.TRUST_PROXY || 0));
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        "img-src": ["'self'", "data:", "https://res.cloudinary.com"],
        "script-src": ["'self'"],
        "style-src": ["'self'", "'unsafe-inline'"],
        "connect-src": ["'self'"],
        "upgrade-insecure-requests": config.production ? [] : null,
      },
    },
    crossOriginEmbedderPolicy: false,
  }),
);
app.use(cors({ origin: new URL(config.appUrl).origin, credentials: true }));
app.use(express.json({ limit: "100kb" }), cookieParser());
app.get("/api/v1/health", (req, res) =>
  res
    .status(mongoose.connection.readyState === 1 ? 200 : 503)
    .json({
      data: {
        status: mongoose.connection.readyState === 1 ? "ok" : "unavailable",
      },
    }),
);
app.use(
  "/api",
  rateLimit({
    windowMs: 60000,
    limit: process.env.NODE_ENV === "test" ? 10000 : 240,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: { message: "Too many requests. Try again shortly." } },
  }),
  csrf,
);
app.use("/api", (req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});
app.use("/api/v1/auth", auth);
app.use("/api/v1/cards", cards);
app.use("/api/v1/portfolio", portfolio);
app.use("/api/v1/media", media);
app.use("/api/v1/public", publicProfiles);
app.use("/api/v1/analytics", analytics);
app.get("/api/v1/billing/subscription", authenticate, (req, res) =>
  res.json({
    data: {
      plan: "free",
      price: 0,
      recurring: false,
      checkoutAvailable: false,
      limits: { cards: 1, portfolio: 5, media: 20 },
    },
  }),
);
app.use("/api/v1/admin", authenticate, (req, res, next) =>
  req.user.role === "admin"
    ? next()
    : next(httpError(403, "Administrator access required.")),
);
app.get("/api/v1/admin/overview", async (req, res) =>
  res.json({
    data: {
      users: await User.countDocuments(),
      publishedCards: await BusinessCard.countDocuments({ published: true }),
    },
  }),
);
app.get("/api/v1/admin/users", async (req, res) => {
  const page = z.coerce
    .number()
    .int()
    .min(1)
    .max(10000)
    .default(1)
    .parse(req.query.page);
  const email = req.query.email ? z.email().parse(req.query.email) : null;
  const filter = email ? { email: email.toLowerCase() } : {};
  res.json({
    data: await User.find(filter)
      .select("name email accountStatus plan createdAt")
      .sort({ _id: -1 })
      .skip((page - 1) * 25)
      .limit(25),
    meta: { page, total: await User.countDocuments(filter) },
  });
});
app.patch("/api/v1/admin/users/:id/status", async (req, res) => {
  const { accountStatus } = z
    .object({ accountStatus: z.enum(["active", "suspended"]) })
    .strict()
    .parse(req.body);
  if (req.params.id === req.user.id)
    throw httpError(400, "You cannot suspend your own account.");
  const user = await User.findOneAndUpdate(
    { _id: validId(req.params.id), role: "user" },
    { $set: { accountStatus }, $inc: { sessionVersion: 1 } },
    { new: true },
  );
  if (!user) throw httpError(404, "User not found.");
  res.json({ data: { id: user.id, accountStatus } });
});
app.use("/api", (req, res) =>
  res.status(404).json({ error: { message: "Endpoint not found." } }),
);
if (!config.production)
  app.use(
    "/media",
    express.static(resolve(root, "work/media"), {
      maxAge: "1d",
      dotfiles: "deny",
      setHeaders: (res) => res.set("X-Content-Type-Options", "nosniff"),
    }),
  );
const dist = resolve(root, "client/dist");
if (existsSync(resolve(dist, "index.html"))) {
  app.use(express.static(dist, { index: false }));
  app.get("/sitemap.xml", async (req, res) => {
    const profiles = await BusinessCard.find({ published: true })
      .select("slug")
      .limit(10000);
    res
      .type("xml")
      .send(
        `<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${profiles.map((c) => `<url><loc>${config.appUrl}/${c.slug}</loc></url>`).join("")}</urlset>`,
      );
  });
  app.get("/{*path}", async (req, res) => {
    let html = readFileSync(resolve(dist, "index.html"), "utf8");
    const slug = req.path.slice(1);
    if (/^[a-z0-9-]+$/.test(slug)) {
      const card = await BusinessCard.findOne({
        slug,
        published: true,
      }).populate("owner", "accountStatus");
      if (card?.owner?.accountStatus === "active") {
        const escape = (s) =>
          String(s || "").replace(
            /[&<>"']/g,
            (c) =>
              ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;",
              })[c],
          );
        const name = escape(card.snapshot.displayName);
        html = html
          .replace(/<title>.*?<\/title>/, `<title>${name} | Cardora</title>`)
          .replace(
            "</head>",
            `<meta property="og:title" content="${name}"/><meta property="og:description" content="${escape(card.snapshot.biography)}"/><meta property="og:image" content="${escape(card.snapshot.profileImage.startsWith("/") ? config.appUrl + card.snapshot.profileImage : card.snapshot.profileImage)}"/><link rel="canonical" href="${config.appUrl}/${card.slug}"/></head>`,
          );
      }
    }
    res.type("html").send(html);
  });
}
app.use(errorHandler);
