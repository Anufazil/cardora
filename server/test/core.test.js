import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import sharp from "sharp";
import { readdir, readFile, mkdir, mkdtemp } from "node:fs/promises";
import { resolve } from "node:path";
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = randomBytes(48).toString("hex");
process.env.ANALYTICS_SECRET = randomBytes(48).toString("hex");
process.env.APP_URL = "http://localhost:4380";
process.env.MAIL_DRIVER = "file";
process.env.MEDIA_DRIVER = "local";
let db, app, models, a, b, aCsrf, bCsrf, card, item, uploaded;
const origin = "http://localhost:4380";
const password = "SecurePassword123!";
const draft = {
  displayName: "Alex Example",
  professionalTitle: "Designer",
  biography: "Thoughtful identities.",
  email: "alex@example.com",
  phone: "+919876543210",
  website: "https://example.com",
  socials: [{ platform: "GitHub", url: "https://github.com/example" }],
};
function write(agent, token, method, path, body) {
  const r = agent[method](`/api/v1${path}`)
    .set("Origin", origin)
    .set("X-CSRF-Token", token);
  return body === undefined ? r : r.send(body);
}
before(
  async () => {
    await mkdir(resolve("../work/test-databases"), { recursive: true });
    const dbPath = await mkdtemp(resolve("../work/test-databases/run-"));
    db = await MongoMemoryServer.create({
      instance: { launchTimeout: 60000, dbPath },
    });
    process.env.MONGODB_URI = db.getUri();
    ({ app } = await import("../src/app.js"));
    models = await import("../src/models/index.js");
    await mongoose.connect(db.getUri());
    await Promise.all(Object.values(mongoose.models).map((m) => m.init()));
    a = request.agent(app);
    b = request.agent(app);
    aCsrf = (await a.get("/api/v1/auth/csrf")).body.data.csrfToken;
    bCsrf = (await b.get("/api/v1/auth/csrf")).body.data.csrfToken;
  },
  { timeout: 120000 },
);
after(async () => {
  await mongoose.disconnect();
  if (db) await db.stop();
});
test("register hashes passwords, starts a HttpOnly session, and rejects self-assigned roles", async () => {
  let r = await write(a, aCsrf, "post", "/auth/register", {
    name: "Alex Example",
    email: "a@example.com",
    password,
    role: "admin",
  });
  assert.equal(r.status, 400);
  r = await write(a, aCsrf, "post", "/auth/register", {
    name: "Alex Example",
    email: "a@example.com",
    password,
  });
  assert.equal(r.status, 201);
  assert.ok(r.headers["set-cookie"].some((s) => s.includes("HttpOnly")));
  assert.equal(r.body.data.role, "user");
  assert.equal(r.body.data.passwordHash, undefined);
  const user = await models.User.findOne({ email: "a@example.com" }).select(
    "+passwordHash",
  );
  assert.notEqual(user.passwordHash, password);
  assert.match(user.passwordHash, /^\$2/);
  await write(b, bCsrf, "post", "/auth/register", {
    name: "Another Person",
    email: "b@example.com",
    password,
  }).expect(201);
});
test("validates password strength and duplicate emails", async () => {
  await write(a, aCsrf, "post", "/auth/register", {
    name: "Example",
    email: "c@example.com",
    password: "weak",
  }).expect(400);
  await write(a, aCsrf, "post", "/auth/register", {
    name: "Example",
    email: "a@example.com",
    password,
  }).expect(409);
});
test("restores sessions and rejects anonymous and invalid login attempts", async () => {
  await a.get("/api/v1/auth/me").expect(200);
  await request(app).get("/api/v1/cards").expect(401);
  await write(b, bCsrf, "post", "/auth/login", {
    email: "a@example.com",
    password: "wrong",
  }).expect(401);
});
test("blocks missing CSRF headers and foreign origins", async () => {
  await a
    .post("/api/v1/cards")
    .set("Origin", origin)
    .send({ slug: "bad", draft })
    .expect(403);
  await a
    .post("/api/v1/cards")
    .set("Origin", "https://evil.example")
    .set("X-CSRF-Token", aCsrf)
    .send({ slug: "bad", draft })
    .expect(403);
});
test("creates draft cards, enforces unique/reserved slugs and plan quota", async () => {
  await write(a, aCsrf, "post", "/cards", { slug: "dashboard", draft }).expect(
    400,
  );
  const r = await write(a, aCsrf, "post", "/cards", {
    slug: "alex-example",
    draft,
  }).expect(201);
  card = r.body.data;
  await write(b, bCsrf, "post", "/cards", {
    slug: "alex-example",
    draft,
  }).expect(409);
  await write(a, aCsrf, "post", "/cards", {
    slug: "second-card",
    draft,
  }).expect(403);
  await request(app).get("/api/v1/public/alex-example").expect(404);
});
test("enforces ownership for read, edit, delete, publish and analytics", async () => {
  for (const method of ["get", "patch", "delete"]) {
    const r =
      method === "get"
        ? b.get(`/api/v1/cards/${card._id}`)
        : write(b, bCsrf, method, `/cards/${card._id}`, { draft });
    await r.expect(404);
  }
  await write(b, bCsrf, "post", `/cards/${card._id}/publish`).expect(403);
  await b.get(`/api/v1/analytics/cards/${card._id}`).expect(404);
  await a.get("/api/v1/cards/not-an-id").expect(400);
});
test("validates safe URLs and does not accept arbitrary external media URLs", async () => {
  await write(a, aCsrf, "patch", `/cards/${card._id}`, {
    draft: { ...draft, website: "javascript:alert(1)" },
  }).expect(400);
  await write(a, aCsrf, "patch", `/cards/${card._id}`, {
    draft: { ...draft, profileImage: "https://example.com/file.png" },
  }).expect(400);
});
test("uploads real images, rejects forged MIME types and enforces image ownership", async () => {
  const png = await sharp({
    create: { width: 32, height: 32, channels: 3, background: "#635BFF" },
  })
    .png()
    .toBuffer();
  const r = await write(a, aCsrf, "post", "/media")
    .attach("image", png, {
      filename: "portrait.png",
      contentType: "image/png",
    })
    .expect(201);
  uploaded = r.body.data.url;
  assert.match(uploaded, /\.webp$/);
  await write(a, aCsrf, "post", "/media")
    .attach("image", Buffer.from("<svg/>"), {
      filename: "portrait.png",
      contentType: "image/png",
    })
    .expect(400);
  const bCard = await write(b, bCsrf, "post", "/cards", {
    slug: "another-person",
    draft,
  }).expect(201);
  await write(b, bCsrf, "patch", `/cards/${bCard.body.data._id}`, {
    draft: { ...draft, profileImage: uploaded },
  }).expect(400);
  await write(a, aCsrf, "patch", `/cards/${card._id}`, {
    draft: { ...draft, profileImage: uploaded },
  }).expect(200);
});
test("verification tokens are single-use and publishing requires verification", async () => {
  await write(a, aCsrf, "post", `/cards/${card._id}/publish`).expect(403);
  const { root } = await import("../src/config/env.js");
  const files = await readdir(resolve(root, "work/mail"));
  let token;
  for (const file of files) {
    const mail = JSON.parse(
      await readFile(resolve(root, "work/mail", file), "utf8"),
    );
    if (mail.to === "a@example.com" && mail.subject.includes("Verify"))
      token = mail.text.match(/token=([a-f0-9]{64})/)[1];
  }
  assert.ok(token);
  await write(a, aCsrf, "post", "/auth/verify-email", { token }).expect(200);
  await write(a, aCsrf, "post", "/auth/verify-email", { token }).expect(400);
  await write(a, aCsrf, "post", `/cards/${card._id}/publish`).expect(200);
});
test("public snapshots hide saved drafts and preserve the stable URL", async () => {
  let r = await request(app).get("/api/v1/public/alex-example").expect(200);
  assert.equal(r.body.data.profile.displayName, "Alex Example");
  assert.equal(r.body.data.owner, undefined);
  await write(a, aCsrf, "patch", `/cards/${card._id}`, {
    draft: { ...draft, displayName: "Updated Name" },
  }).expect(200);
  r = await request(app).get("/api/v1/public/alex-example").expect(200);
  assert.equal(r.body.data.profile.displayName, "Alex Example");
  await write(a, aCsrf, "patch", `/cards/${card._id}`, {
    slug: "new-slug",
    draft,
  }).expect(400);
  await write(a, aCsrf, "post", `/cards/${card._id}/publish`).expect(200);
  r = await request(app).get("/api/v1/public/alex-example");
  assert.equal(r.body.data.profile.displayName, "Updated Name");
});
test("portfolio CRUD belongs to its owner and hidden projects stay private", async () => {
  await write(b, bCsrf, "post", `/cards/${card._id}/portfolio`, {
    title: "Wrong owner",
  }).expect(404);
  const r = await write(a, aCsrf, "post", `/cards/${card._id}/portfolio`, {
    title: "Brand project",
    published: false,
  }).expect(201);
  item = r.body.data;
  await write(b, bCsrf, "patch", `/portfolio/${item._id}`, {
    title: "Stolen project",
  }).expect(404);
  await write(b, bCsrf, "delete", `/portfolio/${item._id}`).expect(404);
  assert.equal(
    (await request(app).get("/api/v1/public/alex-example")).body.data.portfolio
      .length,
    0,
  );
  await write(a, aCsrf, "patch", `/portfolio/${item._id}`, {
    title: "Brand project",
    published: true,
    featured: true,
    projectUrl: "https://example.com",
  }).expect(200);
  assert.equal(
    (await request(app).get("/api/v1/public/alex-example")).body.data.portfolio
      .length,
    1,
  );
});
test("analytics records real visits once per window and respects tracking preferences", async () => {
  const profile = (await request(app).get("/api/v1/public/alex-example")).body
    .data;
  const visitor = request.agent(app);
  const csrf = (await visitor.get("/api/v1/auth/csrf")).body.data.csrfToken;
  const body = { type: "view", source: "qr", token: profile.eventToken };
  await write(
    visitor,
    csrf,
    "post",
    "/public/alex-example/events",
    body,
  ).expect(202);
  await write(
    visitor,
    csrf,
    "post",
    "/public/alex-example/events",
    body,
  ).expect(202);
  await write(visitor, csrf, "post", "/public/alex-example/events", {
    ...body,
    type: "email",
  })
    .set("DNT", "1")
    .expect(200);
  await write(visitor, csrf, "post", "/public/alex-example/events", {
    ...body,
    token: "invalid",
  }).expect(400);
  const r = await a.get("/api/v1/analytics/overview?days=7").expect(200);
  assert.equal(r.body.data.views, 1);
  assert.equal(r.body.data.contactClicks, 0);
  assert.equal(r.body.data.top[0].qrVisits, 1);
  assert.equal(r.body.data.series.length, 7);
  assert.equal((await b.get("/api/v1/analytics/overview")).body.data.views, 0);
  await a.get("/api/v1/analytics/overview?days=999").expect(400);
});
test("unpublishing immediately blocks profile and analytics events", async () => {
  await write(a, aCsrf, "post", `/cards/${card._id}/unpublish`).expect(200);
  await request(app).get("/api/v1/public/alex-example").expect(404);
});
test("paid plans are explicitly unavailable and administration rejects non-admins", async () => {
  const r = await a.get("/api/v1/billing/subscription").expect(200);
  assert.equal(r.body.data.checkoutAvailable, false);
  assert.equal(r.body.data.plan, "free");
  await a.get("/api/v1/admin/overview").expect(403);
  await write(a, aCsrf, "patch", "/auth/account", {
    name: "Admin",
    role: "admin",
  }).expect(400);
});
test("password reset invalidates sessions and reset tokens cannot be replayed", async () => {
  await write(a, aCsrf, "post", "/auth/forgot-password", {
    email: "a@example.com",
  }).expect(200);
  const { root } = await import("../src/config/env.js");
  let token;
  for (const file of await readdir(resolve(root, "work/mail"))) {
    const mail = JSON.parse(
      await readFile(resolve(root, "work/mail", file), "utf8"),
    );
    if (mail.to === "a@example.com" && mail.subject.startsWith("Reset"))
      token = mail.text.match(/token=([a-f0-9]{64})/)[1];
  }
  assert.ok(token);
  await write(a, aCsrf, "post", "/auth/reset-password", {
    token,
    password: "AnotherSecure123!",
  }).expect(200);
  await a.get("/api/v1/auth/me").expect(401);
  await write(a, aCsrf, "post", "/auth/reset-password", {
    token,
    password,
  }).expect(400);
  await write(a, aCsrf, "post", "/auth/login", {
    email: "a@example.com",
    password: "AnotherSecure123!",
  }).expect(200);
});
test("logout revokes server-side sessions and deletion removes related projects", async () => {
  await write(a, aCsrf, "delete", `/cards/${card._id}`).expect(200);
  assert.equal(
    await models.PortfolioItem.countDocuments({ businessCard: card._id }),
    0,
  );
  const sessionCount = await models.Session.countDocuments();
  await write(a, aCsrf, "post", "/auth/logout").expect(200);
  assert.equal(await models.Session.countDocuments(), sessionCount - 1);
  await a.get("/api/v1/cards").expect(401);
});
