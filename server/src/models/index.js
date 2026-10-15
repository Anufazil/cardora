import mongoose from "mongoose";
const { Schema, model } = mongoose;
const owner = {
  type: Schema.Types.ObjectId,
  ref: "User",
  required: true,
  index: true,
};
const userSchema = new Schema(
  {
    name: { type: String, required: true, maxlength: 100 },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true, select: false },
    emailVerified: { type: Boolean, default: false },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    accountStatus: {
      type: String,
      enum: ["active", "suspended"],
      default: "active",
    },
    sessionVersion: { type: Number, default: 0 },
    plan: { type: String, default: "free", enum: ["free"] },
  },
  { timestamps: true },
);
export const User = model("User", userSchema);
export const Session = model(
  "Session",
  new Schema(
    {
      owner,
      tokenHash: { type: String, unique: true, required: true },
      expiresAt: { type: Date, expires: 0, required: true },
    },
    { timestamps: true },
  ),
);
export const ActionToken = model(
  "ActionToken",
  new Schema({
    owner,
    hash: { type: String, required: true, unique: true },
    purpose: { type: String, enum: ["verify", "reset"] },
    expiresAt: { type: Date, expires: 0 },
  }),
);
const content = new Schema(
  {
    displayName: String,
    professionalTitle: String,
    businessName: String,
    biography: String,
    profileImage: String,
    logo: String,
    email: String,
    phone: String,
    whatsapp: String,
    website: String,
    address: String,
    mapUrl: String,
    template: { type: String, enum: ["studio", "minimal", "editorial"] },
    accent: String,
    appearance: String,
    imageLayout: String,
    buttonStyle: String,
    sections: [String],
    socials: [{ _id: false, platform: String, url: String }],
  },
  { _id: false },
);
export const BusinessCard = model(
  "BusinessCard",
  new Schema(
    {
      owner,
      slug: { type: String, required: true, unique: true, immutable: true },
      draft: { type: content, required: true },
      snapshot: content,
      published: { type: Boolean, default: false },
      publishedAt: Date,
    },
    { timestamps: true },
  ),
);
export const PortfolioItem = model(
  "PortfolioItem",
  new Schema(
    {
      owner,
      businessCard: {
        type: Schema.Types.ObjectId,
        ref: "BusinessCard",
        required: true,
        index: true,
      },
      title: { type: String, required: true },
      description: String,
      thumbnail: String,
      projectUrl: String,
      tags: [String],
      displayOrder: { type: Number, default: 0 },
      featured: { type: Boolean, default: false },
      published: { type: Boolean, default: false },
    },
    { timestamps: true },
  ),
);
const eventSchema = new Schema({
  owner,
  businessCard: { type: Schema.Types.ObjectId, required: true },
  eventType: {
    type: String,
    enum: ["view", "phone", "email", "whatsapp", "website", "social", "vcard"],
  },
  source: { type: String, enum: ["direct", "qr"] },
  dedupe: { type: String, unique: true },
  createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 100 },
});
eventSchema.index({ owner: 1, createdAt: -1 });
eventSchema.index({ businessCard: 1, createdAt: -1 });
export const AnalyticsEvent = model("AnalyticsEvent", eventSchema);
export const Media = model(
  "Media",
  new Schema(
    { owner, url: { type: String, unique: true }, providerId: String },
    { timestamps: true },
  ),
);
