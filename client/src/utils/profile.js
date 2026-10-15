export const defaults = {
  displayName: "",
  professionalTitle: "",
  businessName: "",
  biography: "",
  profileImage: "",
  logo: "",
  email: "",
  phone: "",
  whatsapp: "",
  website: "",
  address: "",
  mapUrl: "",
  template: "studio",
  accent: "#635BFF",
  appearance: "light",
  imageLayout: "circle",
  buttonStyle: "rounded",
  sections: ["about", "portfolio", "contact"],
  socials: [],
};
export const sample = {
  ...defaults,
  displayName: "Alex Morgan",
  professionalTitle: "Brand designer & creative thinker",
  businessName: "Studio Morgan",
  biography:
    "I turn ambitious ideas into thoughtful brands and digital experiences. Based in Bangalore. Creating everywhere.",
  email: "alex@example.com",
  website: "https://example.com",
  address: "Bangalore, India",
  socials: [
    { platform: "LinkedIn", url: "https://example.com" },
    { platform: "Instagram", url: "https://example.com" },
  ],
};
export const sampleProjects = [
  {
    _id: "demo-1",
    title: "Forma — A new perspective",
    description: "Brand strategy & visual identity",
    tags: ["Branding"],
    featured: true,
    published: true,
  },
  {
    _id: "demo-2",
    title: "Objects of everyday",
    description: "Art direction & digital design",
    tags: ["Design"],
    published: true,
  },
];
export function publicUrl(slug) {
  return new URL(`/${encodeURIComponent(slug)}`, window.location.origin).href;
}
export function download(data, name, type) {
  const blob = new Blob([data], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function vcard(profile) {
  const escape = (value) =>
    String(value || "")
      .replace(/\\/g, "\\\\")
      .replace(/\r?\n/g, "\\n")
      .replace(/,/g, "\\,")
      .replace(/;/g, "\\;")
      .replace(/\r/g, "");
  return [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${escape(profile.displayName)}`,
    `N:;${escape(profile.displayName)};;;`,
    `TITLE:${escape(profile.professionalTitle)}`,
    `ORG:${escape(profile.businessName)}`,
    `EMAIL:${escape(profile.email)}`,
    `TEL:${escape(profile.phone)}`,
    `URL:${escape(profile.website)}`,
    `ADR:;;${escape(profile.address)};;;;`,
    "END:VCARD",
  ].join("\r\n");
}
