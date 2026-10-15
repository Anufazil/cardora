import { Link } from "react-router-dom";
import { MarketingNav, MarketingFooter } from "./Marketing";
const content = {
  privacy: [
    "Privacy notice",
    "Your information belongs in the right hands.",
    [
      [
        "Account information",
        "Cardora stores your name, email and hashed password to provide your account. The contact details and work you add to a published card are public. Draft cards remain private. Uploaded image URLs are not secret; do not upload confidential material.",
      ],
      [
        "Engagement analytics",
        "We record profile views and contact actions. We use a keyed digest of the request IP, user agent and a 30-minute time window to reduce duplicate events. Raw IP addresses and user agents are not stored in analytics records. Events expire after 100 days. We do not claim to identify unique people. Do Not Track and Global Privacy Control requests are respected.",
      ],
      [
        "Service providers",
        "Production media storage uses Cloudinary. Email is sent using the operator’s configured SMTP provider. Your deployment operator must publish their identity, contact address, retention policy and applicable privacy terms before public launch.",
      ],
      [
        "Your choices",
        "You can unpublish or delete cards, edit your public details, and remove portfolio projects. For account deletion or data export, contact the deployment operator; self-service account deletion is not yet available.",
      ],
    ],
  ],
  terms: [
    "Terms of use",
    "A clear starting point.",
    [
      [
        "Development release",
        "Cardora is an MVP software release. These are draft product terms, not a completed legal agreement. The deployment operator must supply their identity, support contact and applicable terms before commercial launch.",
      ],
      [
        "Your content",
        "Only publish content you have permission to share. Do not use Cardora for impersonation, unlawful content or abuse. You are responsible for the accuracy of your public contact details.",
      ],
      [
        "Availability and plans",
        "The current release provides a free plan with one card and five projects. Proposed paid plans are not for sale. Custom domains, team management, services and appointments are not available in this release.",
      ],
    ],
  ],
  cookies: [
    "Cookies & tracking",
    "Useful information. Minimal collection.",
    [
      [
        "Essential cookies",
        "The HttpOnly session cookie keeps you signed in for up to seven days. A separate CSRF cookie protects write requests. Session tokens are not stored in localStorage.",
      ],
      [
        "Analytics",
        "Basic first-party engagement tracking is used on public profiles. There are no advertising cookies. We deduplicate repeated events and respect browser Do Not Track and Global Privacy Control signals. Read the Privacy notice for details.",
      ],
    ],
  ],
  help: [
    "A little help goes a long way.",
    "Your quick guide to a great first impression.",
    [
      [
        "Create and publish",
        "Register, verify your email, and create a card. Add your details, choose a template, and save a draft. When you’re ready, select Publish card. In local development, verification messages are saved to the private work/mail directory.",
      ],
      [
        "Share your identity",
        "Open My cards and select the QR icon on a published card. Download PNG for digital use or SVG for printing. Your public URL stays fixed even when you edit your profile.",
      ],
      [
        "Show your work",
        "Use Portfolio to upload thumbnails and add project descriptions, links and tags. Enable Show on published profile for each project. Portfolio changes appear immediately; card detail changes need republishing.",
      ],
      [
        "Need support?",
        "A support contact has not been configured for this development release. Contact your deployment operator. Before launch, replace this placeholder with a monitored support address.",
      ],
    ],
  ],
};
export default function Info({ kind = "help" }) {
  const [title, subtitle, sections] = content[kind];
  return (
    <>
      <MarketingNav />
      <main className="info-page">
        <div className="eyebrow">CARDORA / {kind.toUpperCase()}</div>
        <h1>{title}</h1>
        <p className="info-subtitle">{subtitle}</p>
        {sections.map(([h, p]) => (
          <section key={h}>
            <h2>{h}</h2>
            <p>{p}</p>
          </section>
        ))}
        <Link to="/dashboard" className="button primary">
          Go to your workspace
        </Link>
      </main>
      <MarketingFooter />
    </>
  );
}
