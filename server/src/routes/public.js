import { Router } from "express";
import { createHmac } from "node:crypto";
import jwt from "jsonwebtoken";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { publicCard } from "../services/cards.js";
import { PortfolioItem, AnalyticsEvent } from "../models/index.js";
import { config } from "../config/env.js";
import { httpError } from "../middleware/security.js";
export const publicProfiles = Router();
publicProfiles.use(
  rateLimit({
    windowMs: 60000,
    limit: 100,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: { message: "Please wait a moment and try again." } },
  }),
);
publicProfiles.get("/:slug", async (req, res) => {
  const card = await publicCard(req.params.slug);
  const portfolio = await PortfolioItem.find({
    businessCard: card._id,
    published: true,
  })
    .select("title description thumbnail projectUrl tags displayOrder featured")
    .sort({ displayOrder: 1 })
    .limit(5);
  const eventToken = jwt.sign({ card: card.id }, config.analyticsSecret, {
    expiresIn: "1h",
    audience: "cardora-events",
  });
  res
    .set("Cache-Control", "no-store")
    .json({
      data: { slug: card.slug, profile: card.snapshot, portfolio, eventToken },
    });
});
publicProfiles.post("/:slug/events", async (req, res) => {
  const data = z
    .object({
      type: z.enum([
        "view",
        "phone",
        "email",
        "whatsapp",
        "website",
        "social",
        "vcard",
      ]),
      source: z.enum(["direct", "qr"]).default("direct"),
      token: z.string().max(1000),
    })
    .strict()
    .parse(req.body);
  const card = await publicCard(req.params.slug);
  let verified;
  try {
    verified = jwt.verify(data.token, config.analyticsSecret, {
      algorithms: ["HS256"],
      audience: "cardora-events",
    });
  } catch {
    throw httpError(400, "Event token expired.");
  }
  if (verified.card !== card.id) throw httpError(400, "Invalid event.");
  if (req.get("DNT") === "1" || req.get("Sec-GPC") === "1")
    return res.json({ data: { recorded: false } });
  // Only a keyed, short-window digest is stored. Raw IP and user agent are never persisted.
  const bucket = Math.floor(Date.now() / (30 * 60000));
  const dedupe = createHmac("sha256", config.analyticsSecret)
    .update(
      `${card.id}|${data.type}|${req.ip}|${req.get("user-agent") || ""}|${bucket}`,
    )
    .digest("hex");
  try {
    await AnalyticsEvent.create({
      owner: card.owner._id,
      businessCard: card._id,
      eventType: data.type,
      source: data.source,
      dedupe,
    });
  } catch (e) {
    if (e.code !== 11000) throw e;
  }
  res.status(202).json({ data: { recorded: true } });
});
