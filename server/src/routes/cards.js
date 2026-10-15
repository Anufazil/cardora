import { Router } from "express";
import { z } from "zod";
import { BusinessCard, PortfolioItem } from "../models/index.js";
import { authenticate, httpError, validId } from "../middleware/security.js";
import {
  cardSchema,
  slugSchema,
  portfolioSchema,
} from "../validators/index.js";
import {
  ownedCard,
  checkImages,
  limits,
  ownerLock,
  removeCard,
} from "../services/cards.js";
export const cards = Router();
cards.use(authenticate);
cards.get("/", async (req, res) =>
  res.json({
    data: await BusinessCard.find({ owner: req.user._id })
      .sort({ updatedAt: -1 })
      .limit(10),
    meta: { limits },
  }),
);
cards.post("/", async (req, res) => {
  const data = z
    .object({ slug: slugSchema, draft: cardSchema })
    .strict()
    .parse(req.body);
  const card = await ownerLock(req.user.id, async () => {
    if (
      (await BusinessCard.countDocuments({ owner: req.user._id })) >=
      limits.cards
    )
      throw httpError(403, "The free plan includes one card.");
    await checkImages(req.user._id, data.draft);
    return BusinessCard.create({ owner: req.user._id, ...data });
  });
  res.status(201).json({ data: card });
});
cards.get("/:id", async (req, res) =>
  res.json({ data: await ownedCard(req.params.id, req.user._id) }),
);
cards.patch("/:id", async (req, res) => {
  const card = await ownedCard(req.params.id, req.user._id);
  const { draft } = z.object({ draft: cardSchema }).strict().parse(req.body);
  await checkImages(req.user._id, draft);
  card.draft = draft;
  await card.save();
  res.json({ data: card });
});
cards.delete("/:id", async (req, res) => {
  await removeCard(await ownedCard(req.params.id, req.user._id));
  res.json({ data: { ok: true } });
});
cards.post("/:id/publish", async (req, res) => {
  if (!req.user.emailVerified)
    throw httpError(403, "Verify your email before publishing.");
  const card = await ownedCard(req.params.id, req.user._id);
  card.snapshot = card.draft.toObject();
  card.published = true;
  card.publishedAt = new Date();
  await card.save();
  res.json({ data: card });
});
cards.post("/:id/unpublish", async (req, res) => {
  const card = await ownedCard(req.params.id, req.user._id);
  card.published = false;
  await card.save();
  res.json({ data: card });
});
cards.get("/:id/portfolio", async (req, res) => {
  await ownedCard(req.params.id, req.user._id);
  res.json({
    data: await PortfolioItem.find({
      owner: req.user._id,
      businessCard: req.params.id,
    })
      .sort({ displayOrder: 1, createdAt: 1 })
      .limit(limits.portfolio),
  });
});
cards.post("/:id/portfolio", async (req, res) => {
  const card = await ownedCard(req.params.id, req.user._id);
  const data = portfolioSchema.parse(req.body);
  const item = await ownerLock(req.user.id, async () => {
    if (
      (await PortfolioItem.countDocuments({ owner: req.user._id })) >=
      limits.portfolio
    )
      throw httpError(403, "The free plan includes five portfolio projects.");
    await checkImages(req.user._id, data);
    return PortfolioItem.create({
      ...data,
      owner: req.user._id,
      businessCard: card._id,
    });
  });
  res.status(201).json({ data: item });
});
export const portfolio = Router();
portfolio.use(authenticate);
portfolio.patch("/:id", async (req, res) => {
  const data = portfolioSchema.parse(req.body);
  await checkImages(req.user._id, data);
  const item = await PortfolioItem.findOneAndUpdate(
    { _id: validId(req.params.id), owner: req.user._id },
    data,
    { new: true, runValidators: true },
  );
  if (!item) throw httpError(404, "Project not found.");
  res.json({ data: item });
});
portfolio.delete("/:id", async (req, res) => {
  const item = await PortfolioItem.findOneAndDelete({
    _id: validId(req.params.id),
    owner: req.user._id,
  });
  if (!item) throw httpError(404, "Project not found.");
  res.json({ data: { ok: true } });
});
