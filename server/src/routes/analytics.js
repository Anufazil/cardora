import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/security.js";
import { AnalyticsEvent, BusinessCard } from "../models/index.js";
import { ownedCard } from "../services/cards.js";
export const analytics = Router();
analytics.use(authenticate);
async function overview(req, res) {
  const days = Number(
    z.enum(["7", "30", "90"]).default("30").parse(req.query.days),
  );
  if (req.params.id) await ownedCard(req.params.id, req.user._id);
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  since.setUTCDate(since.getUTCDate() - days + 1);
  const match = { owner: req.user._id, createdAt: { $gte: since } };
  if (req.params.id)
    match.businessCard = (await ownedCard(req.params.id, req.user._id))._id;
  const [groups, series, top, cards, recent] = await Promise.all([
    AnalyticsEvent.aggregate([
      { $match: match },
      { $group: { _id: "$eventType", count: { $sum: 1 } } },
    ]),
    AnalyticsEvent.aggregate([
      { $match: { ...match, eventType: "view" } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          views: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    AnalyticsEvent.aggregate([
      { $match: { ...match, eventType: "view" } },
      {
        $group: {
          _id: "$businessCard",
          views: { $sum: 1 },
          qrVisits: { $sum: { $cond: [{ $eq: ["$source", "qr"] }, 1, 0] } },
        },
      },
      { $sort: { views: -1 } },
      { $limit: 10 },
    ]),
    BusinessCard.find({ owner: req.user._id })
      .select("slug draft.displayName published updatedAt")
      .limit(10),
    AnalyticsEvent.find(match)
      .select("eventType createdAt businessCard source")
      .sort({ createdAt: -1 })
      .limit(8),
  ]);
  const counts = Object.fromEntries(groups.map((g) => [g._id, g.count]));
  const filled = Array.from({ length: days }, (_, i) => {
    const date = new Date(since);
    date.setUTCDate(date.getUTCDate() + i);
    const key = date.toISOString().slice(0, 10);
    return { date: key, views: series.find((s) => s._id === key)?.views || 0 };
  });
  res.json({
    data: {
      days,
      totalCards: cards.length,
      publishedCards: cards.filter((c) => c.published).length,
      views: counts.view || 0,
      contactClicks: ["phone", "email", "whatsapp", "website", "vcard"].reduce(
        (s, k) => s + (counts[k] || 0),
        0,
      ),
      socialClicks: counts.social || 0,
      series: filled,
      top: top.map((t) => ({
        ...t,
        name:
          cards.find((c) => String(c._id) === String(t._id))?.draft
            .displayName || "Deleted card",
      })),
      recent,
      counts,
    },
  });
}
analytics.get("/overview", overview);
analytics.get("/cards/:id", overview);
