import {
  BusinessCard,
  PortfolioItem,
  Media,
  AnalyticsEvent,
} from "../models/index.js";
import { httpError, validId } from "../middleware/security.js";
export const limits = { cards: 1, portfolio: 5, media: 20 };
// Serialize quota-changing mutations per owner in this single-process MVP.
const locks = new Map();
export async function ownerLock(owner, task) {
  const key = String(owner);
  const previous = locks.get(key) || Promise.resolve();
  let release;
  const gate = new Promise((r) => {
    release = r;
  });
  const tail = previous.then(() => gate);
  locks.set(key, tail);
  await previous;
  try {
    return await task();
  } finally {
    release();
    if (locks.get(key) === tail) locks.delete(key);
  }
}
export async function ownedCard(id, owner) {
  const card = await BusinessCard.findOne({ _id: validId(id), owner });
  if (!card) throw httpError(404, "Card not found.");
  return card;
}
export async function checkImages(owner, data) {
  for (const url of [data.profileImage, data.logo, data.thumbnail].filter(
    Boolean,
  ))
    if (!(await Media.exists({ owner, url })))
      throw httpError(400, "Choose an image uploaded to your account.");
}
export async function publicCard(slug) {
  const card = await BusinessCard.findOne({ slug, published: true }).populate(
    "owner",
    "accountStatus",
  );
  if (!card || card.owner?.accountStatus !== "active")
    throw httpError(404, "This profile is not available.");
  return card;
}
export async function removeCard(card) {
  await Promise.all([
    PortfolioItem.deleteMany({ businessCard: card._id }),
    AnalyticsEvent.deleteMany({ businessCard: card._id }),
  ]);
  await card.deleteOne();
}
