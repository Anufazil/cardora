import { Router } from "express";
import multer from "multer";
import { fileTypeFromBuffer } from "file-type";
import sharp from "sharp";
import { v2 as cloudinary } from "cloudinary";
import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { config, root } from "../config/env.js";
import { Media } from "../models/index.js";
import { authenticate, httpError } from "../middleware/security.js";
import { ownerLock, limits } from "../services/cards.js";
export const media = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
});
media.post("/", authenticate, upload.single("image"), async (req, res) => {
  if (!req.file) throw httpError(400, "Choose an image.");
  const type = await fileTypeFromBuffer(req.file.buffer);
  if (!type || !["image/jpeg", "image/png", "image/webp"].includes(type.mime))
    throw httpError(400, "Use a JPEG, PNG or WebP image.");
  let buffer;
  try {
    buffer = await sharp(req.file.buffer, { limitInputPixels: 24000000 })
      .rotate()
      .resize(1400, 1400, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();
  } catch {
    throw httpError(400, "This image could not be processed.");
  }
  const result = await ownerLock(req.user.id, async () => {
    if ((await Media.countDocuments({ owner: req.user._id })) >= limits.media)
      throw httpError(403, "The free plan allows 20 image uploads.");
    let url, providerId;
    if (config.mediaDriver === "cloudinary") {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });
      const asset = await new Promise((resolve, reject) =>
        cloudinary.uploader
          .upload_stream(
            { folder: "cardora", resource_type: "image", format: "webp" },
            (e, result) => (e ? reject(e) : resolve(result)),
          )
          .end(buffer),
      );
      url = asset.secure_url;
      providerId = asset.public_id;
    } else {
      providerId = `${randomUUID()}.webp`;
      await mkdir(resolve(root, "work/media"), { recursive: true });
      await writeFile(resolve(root, "work/media", providerId), buffer);
      url = `/media/${providerId}`;
    }
    return Media.create({ owner: req.user._id, url, providerId });
  });
  res.status(201).json({ data: { url: result.url } });
});
