import { z } from "zod";
export const password = z
  .string()
  .min(12, "Use at least 12 characters")
  .max(128)
  .regex(/[a-z]/, "Include a lowercase letter")
  .regex(/[A-Z]/, "Include an uppercase letter")
  .regex(/[0-9]/, "Include a number");
export const registerSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    email: z
      .email()
      .max(254)
      .transform((s) => s.toLowerCase()),
    password,
  })
  .strict();
export const loginSchema = z
  .object({
    email: z.email().transform((s) => s.toLowerCase()),
    password: z.string().min(1).max(128),
  })
  .strict();
export const safeUrl = z.union([
  z.literal(""),
  z
    .url()
    .max(2048)
    .refine(
      (s) => ["https:", "http:"].includes(new URL(s).protocol),
      "Use an HTTP or HTTPS URL",
    ),
]);
const mediaUrl = z
  .string()
  .max(2048)
  .refine(
    (s) =>
      !s ||
      s.startsWith("/media/") ||
      s.startsWith("https://res.cloudinary.com/"),
    "Upload an image first",
  );
const short = z.string().trim().max(160).default("");
export const cardSchema = z
  .object({
    displayName: z.string().trim().min(2).max(100),
    professionalTitle: short,
    businessName: short,
    biography: z.string().trim().max(1500).default(""),
    profileImage: mediaUrl.default(""),
    logo: mediaUrl.default(""),
    email: z.union([z.literal(""), z.email()]).default(""),
    phone: z
      .string()
      .regex(/^[+\d ()-]{0,30}$/)
      .default(""),
    whatsapp: z
      .string()
      .regex(/^[+\d ()-]{0,30}$/)
      .default(""),
    website: safeUrl.default(""),
    address: z.string().max(400).default(""),
    mapUrl: safeUrl.default(""),
    template: z.enum(["studio", "minimal", "editorial"]).default("studio"),
    accent: z
      .enum(["#635BFF", "#2563EB", "#157D68", "#B34D67", "#252733"])
      .default("#635BFF"),
    appearance: z.enum(["light", "dark"]).default("light"),
    imageLayout: z.enum(["circle", "rounded"]).default("circle"),
    buttonStyle: z.enum(["rounded", "square"]).default("rounded"),
    sections: z
      .array(z.enum(["about", "portfolio", "contact"]))
      .length(3)
      .refine((a) => new Set(a).size === 3)
      .default(["about", "portfolio", "contact"]),
    socials: z
      .array(
        z
          .object({
            platform: z.enum([
              "Instagram",
              "LinkedIn",
              "Facebook",
              "YouTube",
              "TikTok",
              "GitHub",
              "X",
              "Website",
            ]),
            url: safeUrl.refine(Boolean, "Enter a URL"),
          })
          .strict(),
      )
      .max(8)
      .default([]),
  })
  .strict();
const reserved = new Set([
  "admin",
  "dashboard",
  "login",
  "register",
  "pricing",
  "api",
  "settings",
  "examples",
  "forgot-password",
  "reset-password",
  "verify-email",
  "privacy",
  "terms",
  "cookies",
  "help",
  "media",
  "assets",
  "health",
  "sitemap.xml",
]);
export const slugSchema = z
  .string()
  .min(3)
  .max(50)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Use lowercase letters, numbers and single hyphens",
  )
  .refine((s) => !reserved.has(s), "This address is reserved");
export const portfolioSchema = z
  .object({
    title: z.string().trim().min(2).max(120),
    description: z.string().max(2000).default(""),
    thumbnail: mediaUrl.default(""),
    projectUrl: safeUrl.default(""),
    tags: z.array(z.string().max(30)).max(8).default([]),
    displayOrder: z.number().int().min(0).max(1000).default(0),
    featured: z.boolean().default(false),
    published: z.boolean().default(false),
  })
  .strict();
export function parse(schema, body) {
  return schema.parse(body);
}
