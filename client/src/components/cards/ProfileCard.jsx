import {
  Mail,
  Phone,
  Globe,
  Download,
  MapPin,
  ArrowUpRight,
  MessageCircle,
  BriefcaseBusiness,
} from "lucide-react";
import { download, vcard } from "../../utils/profile";
const socialLabels = {
  LinkedIn: "in",
  Instagram: "ig",
  Facebook: "f",
  YouTube: "yt",
  TikTok: "tk",
  GitHub: "gh",
  X: "x",
  Website: "www",
};
export default function ProfileCard({
  profile: p,
  portfolio = [],
  preview = false,
  demo = false,
  onEvent = () => {},
}) {
  const links = [
    ["phone", p.phone, `tel:${p.phone}`, Phone, "Call me"],
    ["email", p.email, `mailto:${p.email}`, Mail, "Email me"],
    [
      "whatsapp",
      p.whatsapp,
      `https://wa.me/${p.whatsapp.replace(/\D/g, "")}`,
      MessageCircle,
      "WhatsApp",
    ],
    ["website", p.website, p.website, Globe, "Website"],
  ].filter((x) => x[1]);
  const about = p.biography && (
    <section key="about" className="profile-section">
      <h3>A little about me</h3>
      <p>{p.biography}</p>
    </section>
  );
  const work = portfolio.length > 0 && (
    <section key="portfolio" className="profile-section">
      <div className="section-label">
        <h3>Selected work</h3>
        <span>{String(portfolio.length).padStart(2, "0")}</span>
      </div>
      <div className="project-grid">
        {portfolio.map((item, i) => (
          <article
            key={item._id || i}
            className={`project ${item.featured ? "featured" : ""}`}
          >
            {item.thumbnail ? (
              <img src={item.thumbnail} alt={item.title} loading="lazy" />
            ) : (
              <div className={`project-art art-${i % 2}`} aria-hidden="true">
                <span>{i % 2 ? "o." : "forma"}</span>
              </div>
            )}
            <div className="project-content">
              <h4>
                {item.projectUrl && !preview ? (
                  <a
                    href={item.projectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {item.title}
                    <ArrowUpRight size={15} />
                  </a>
                ) : (
                  item.title
                )}
              </h4>
              <p>{item.description}</p>
              {item.tags?.length > 0 && <small>{item.tags.join(" / ")}</small>}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
  const contact = (links.length > 0 || p.address) && (
    <section key="contact" className="profile-section">
      <h3>Let’s connect</h3>
      <div className="contact-grid">
        {links.map(([type, , href, Icon, label]) => (
          <a
            key={type}
            href={preview ? undefined : href}
            onClick={() => !preview && onEvent(type)}
            target={
              ["website", "whatsapp"].includes(type) ? "_blank" : undefined
            }
            rel="noopener noreferrer"
          >
            <Icon size={17} />
            {label}
            <ArrowUpRight size={14} />
          </a>
        ))}
      </div>
      {p.address && (
        <div className="location">
          <MapPin size={15} />
          {p.mapUrl && !preview ? (
            <a href={p.mapUrl} target="_blank" rel="noopener noreferrer">
              {p.address}
            </a>
          ) : (
            p.address
          )}
        </div>
      )}
    </section>
  );
  return (
    <article
      className={`profile-card template-${p.template} appearance-${p.appearance} image-${p.imageLayout} buttons-${p.buttonStyle}`}
      style={{ "--profile-accent": p.accent }}
    >
      <div className="profile-cover">
        <div className="cover-orbit" />
        <span>{p.businessName || "YOUR NEXT CONNECTION"}</span>
        {p.logo && <img src={p.logo} alt="Business logo" />}
      </div>
      <div className="profile-body">
        <div className="profile-intro">
          <div className="avatar">
            {p.profileImage ? (
              <img src={p.profileImage} alt={p.displayName} />
            ) : (
              <span>
                {(p.displayName || "Your name")
                  .split(" ")
                  .map((s) => s[0])
                  .slice(0, 2)
                  .join("")}
              </span>
            )}
          </div>
          <span className="profile-kicker">
            <BriefcaseBusiness size={13} />{" "}
            {p.businessName || "Independent professional"}
          </span>
          <h2>{p.displayName || "Your name"}</h2>
          <p className="profile-title">
            {p.professionalTitle || "Your professional title"}
          </p>
          <div className="social-row">
            {p.socials.map((s, i) => (
              <a
                key={`${s.platform}-${i}`}
                href={preview ? undefined : s.url}
                aria-label={s.platform}
                title={s.platform}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => !preview && onEvent("social")}
              >
                {socialLabels[s.platform]}
              </a>
            ))}
          </div>
          {!preview && (
            <button
              className="save-contact"
              onClick={() => {
                download(
                  vcard(p),
                  `${p.displayName}.vcf`,
                  "text/vcard;charset=utf-8",
                );
                onEvent("vcard");
              }}
            >
              <Download size={17} />
              Save contact
            </button>
          )}
        </div>
        {p.sections.map(
          (section) => ({ about, portfolio: work, contact })[section],
        )}
        <div className="profile-footer">
          {demo ? (
            "DEMONSTRATION PROFILE"
          ) : (
            <>
              Made with <a href="/">cardora.</a>
            </>
          )}
        </div>
      </div>
    </article>
  );
}
