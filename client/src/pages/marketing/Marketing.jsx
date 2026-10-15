import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  QrCode,
  Layers2,
  Palette,
  BarChart3,
  Globe2,
  MousePointer2,
  Menu,
  Plus,
  Minus,
} from "lucide-react";
import { Logo } from "../../components/common/UI";
import ProfileCard from "../../components/cards/ProfileCard";
import { sample, sampleProjects } from "../../utils/profile";
const faqs = [
  [
    "What is Cardora?",
    "Cardora brings your business card, contact details, social links and portfolio together in one personal page.",
  ],
  [
    "How does the QR code work?",
    "Your downloadable QR code opens your published profile URL. Update your profile anytime; the URL and QR code stay the same.",
  ],
  [
    "Is there a free plan?",
    "Yes. Create one digital card with any of our three templates, five portfolio projects, QR downloads and basic analytics.",
  ],
  [
    "Can I edit a published card?",
    "Yes. Save your edits as a draft and publish when you are ready. Your live card stays unchanged until you publish again.",
  ],
  [
    "Who can see my profile?",
    "Anyone with your link can see a published profile. Draft and unpublished profiles are private. Only include information you want to share publicly.",
  ],
  [
    "Do I need technical knowledge?",
    "No. Add your details, choose a template, preview your card and publish.",
  ],
  [
    "What happens when a subscription expires?",
    "Only the free plan is currently available. Paid plans and their subscription terms will be introduced before checkout becomes available.",
  ],
  [
    "Does it work on mobile?",
    "Yes. Your card, portfolio and dashboard adapt to phones, tablets and desktop screens.",
  ],
];
export function MarketingNav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="marketing-nav">
      <Logo />
      <button
        className="nav-toggle"
        aria-label="Toggle menu"
        onClick={() => setOpen(!open)}
      >
        <Menu />
      </button>
      <nav className={open ? "is-open" : ""}>
        <a href="/#features" onClick={() => setOpen(false)}>
          Features
        </a>
        <Link to="/examples">Templates</Link>
        <a href="/#pricing">Pricing</a>
        <a href="/#faq">FAQ</a>
      </nav>
      <div className="nav-actions">
        <Link to="/login">Log in</Link>
        <Link className="button primary small" to="/register">
          Get started <ArrowUpRight size={15} />
        </Link>
      </div>
    </header>
  );
}
export function MarketingFooter() {
  return (
    <footer className="marketing-footer">
      <div>
        <Logo />
        <p>A better way to introduce yourself.</p>
      </div>
      <div>
        <Link to="/examples">Templates</Link>
        <Link to="/help">Contact & help</Link>
        <Link to="/privacy">Privacy</Link>
        <Link to="/terms">Terms</Link>
        <Link to="/cookies">Tracking</Link>
      </div>
      <small>© {new Date().getFullYear()} Cardora</small>
    </footer>
  );
}
export default function Marketing() {
  const [faq, setFaq] = useState(0);
  return (
    <>
      <MarketingNav />
      <main>
        <section className="hero">
          <div className="hero-copy">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="pill">
                <span className="tiny-dot" /> YOUR NEXT FIRST IMPRESSION
              </div>
              <h1>
                Your identity.
                <br />
                <span>One link.</span>
                <svg viewBox="0 0 290 15" aria-hidden="true">
                  <path d="M3 11 Q140 -6 286 8" />
                </svg>
              </h1>
              <p>
                Create a beautiful digital business card and portfolio, share it
                with one QR code, and turn everyday connections into new
                opportunities.
              </p>
              <div className="hero-actions">
                <Link className="button primary large" to="/register">
                  Create your free card <ArrowUpRight size={19} />
                </Link>
                <Link className="text-link" to="/examples">
                  Explore examples <ArrowRight size={16} />
                </Link>
              </div>
              <div className="hero-benefits">
                <span>
                  <Check size={15} />
                  Free to get started
                </span>
                <span>
                  <Check size={15} />
                  No coding needed
                </span>
                <span>
                  <Check size={15} />
                  Made for you
                </span>
              </div>
            </motion.div>
            <div className="hero-caption">
              <span className="caption-line" /> A small link. A bigger world of
              possibility.
            </div>
          </div>
          <div className="hero-visual">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <span className="visual-label">
              YOUR DIGITAL INTRODUCTION, REIMAGINED.
            </span>
            <div className="hero-card-wrap">
              <ProfileCard
                profile={sample}
                portfolio={sampleProjects.slice(0, 1)}
                preview
                demo
              />
            </div>
            <div className="floating-card qr-floating">
              <QrCode size={52} strokeWidth={1.25} />
              <div>
                <strong>Meet. Scan. Connect.</strong>
                <small>Everything you do, one link.</small>
              </div>
            </div>
            <div className="floating-card identity-floating">
              <span className="check-circle">
                <Check size={16} />
              </span>
              <div>
                <strong>Uniquely you.</strong>
                <small>Ready for your next opportunity.</small>
              </div>
              <MousePointer2 size={18} />
            </div>
            <div className="visual-bottom">
              ALEX MORGAN <span>DEMO PROFILE</span>
            </div>
          </div>
        </section>
        <section className="audience-strip">
          <span>
            BUILT FOR PEOPLE
            <br />
            WHO MAKE THINGS HAPPEN
          </span>
          <div>Independent minds.</div>
          <div>Creative businesses.</div>
          <div>Big ambitions.</div>
        </section>
        <section id="features" className="section features-section">
          <div className="section-heading">
            <div>
              <div className="eyebrow">MORE THAN A BUSINESS CARD</div>
              <h2>
                Everything you are.
                <br />
                All in one place.
              </h2>
            </div>
            <p>
              Make it easy for people to discover your work,
              <br />
              remember your name, and take the next step.
            </p>
          </div>
          <div className="feature-grid">
            {[
              [
                Layers2,
                "An introduction that stays with them",
                "Your story, your contact details and your best work. A personal page that does more than a paper card.",
              ],
              [
                QrCode,
                "Make every meeting a connection",
                "Download your QR code and share your stable profile link wherever opportunity finds you.",
              ],
              [
                Palette,
                "Your style, beautifully expressed",
                "Choose from three thoughtful templates. Fine-tune colors, layouts and details to make it yours.",
              ],
              [
                BarChart3,
                "See your connections grow",
                "Understand profile views and contact clicks with simple, privacy-conscious analytics.",
              ],
            ].map(([Icon, title, text], i) => (
              <article key={title} className={`feature feature-${i}`}>
                <span className="feature-number">0{i + 1}</span>
                <Icon size={27} />
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="how-section section">
          <div>
            <div className="eyebrow">FROM HELLO TO WHAT’S NEXT</div>
            <h2>
              A few minutes.
              <br />A lasting impression.
            </h2>
            <Link className="text-link" to="/register">
              Let’s make your card <ArrowRight size={17} />
            </Link>
          </div>
          <div className="steps">
            {[
              [
                "01",
                "Tell your story",
                "Add your name, contact details and the work you are proud of.",
              ],
              [
                "02",
                "Make it yours",
                "Choose your template. Pick your colors. Find your signature look.",
              ],
              [
                "03",
                "Take it everywhere",
                "Publish your profile and share your link or downloadable QR code.",
              ],
            ].map(([n, t, d]) => (
              <div className="step" key={n}>
                <span>{n}</span>
                <div>
                  <h3>{t}</h3>
                  <p>{d}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="section template-section">
          <div className="section-heading">
            <div>
              <div className="eyebrow">A GOOD START, IN YOUR STYLE</div>
              <h2>Made to feel like you.</h2>
            </div>
            <Link className="button secondary" to="/examples">
              Explore all templates <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="template-grid">
            {["studio", "minimal", "editorial"].map((t, i) => (
              <Link
                to={`/examples?template=${t}`}
                className={`template-tile tile-${t}`}
                key={t}
              >
                <div className="template-mini">
                  <ProfileCard
                    profile={{
                      ...sample,
                      template: t,
                      accent: ["#635BFF", "#157D68", "#252733"][i],
                    }}
                    preview
                    demo
                  />
                </div>
                <div className="template-tile-label">
                  <div>
                    <h3>{t}</h3>
                    <span>
                      {
                        [
                          "Expressive & confident",
                          "Simple & intentional",
                          "Distinctive & considered",
                        ][i]
                      }
                    </span>
                  </div>
                  <ArrowUpRight size={21} />
                </div>
              </Link>
            ))}
          </div>
        </section>
        <section id="pricing" className="section pricing-section">
          <div className="center-heading">
            <div className="eyebrow">SMALL CARD. BIG POSSIBILITIES.</div>
            <h2>Start free. Make it yours.</h2>
            <p>Everything you need for a confident first impression.</p>
          </div>
          <div className="pricing-grid">
            {[
              [
                "Free",
                "0",
                "Available now",
                [
                  "1 digital card",
                  "All three launch templates",
                  "5 portfolio projects",
                  "PNG & SVG QR downloads",
                  "Basic analytics",
                ],
              ],
              [
                "Pro",
                "249",
                "Planned · not available",
                [
                  "Up to 3 cards",
                  "More portfolio projects",
                  "Services & appointment requests",
                  "Advanced analytics",
                ],
              ],
              [
                "Business",
                "499",
                "Planned · not available",
                [
                  "Up to 10 cards",
                  "Higher media limits",
                  "Expanded analytics",
                  "Business tools",
                ],
              ],
            ].map(([name, price, status, items], i) => (
              <article
                className={`price-card ${i === 0 ? "available" : ""}`}
                key={name}
              >
                <div className="price-head">
                  <h3>{name}</h3>
                  <span className="badge">{status}</span>
                </div>
                <div className="price">
                  ₹{price}
                  <small>/ month</small>
                </div>
                <p>
                  {i === 0
                    ? "Your next chapter starts here."
                    : "Proposed pricing. Features under development."}
                </p>
                <ul>
                  {items.map((it) => (
                    <li key={it}>
                      <Check size={16} />
                      {it}
                    </li>
                  ))}
                </ul>
                {i === 0 ? (
                  <Link to="/register" className="button primary">
                    Create your free card <ArrowRight size={16} />
                  </Link>
                ) : (
                  <div className="planned-note">Coming in a future release</div>
                )}
              </article>
            ))}
          </div>
        </section>
        <section id="faq" className="section faq-section">
          <div>
            <div className="eyebrow">GOOD QUESTIONS</div>
            <h2>
              A little clarity
              <br />
              before you begin.
            </h2>
            <Link className="text-link" to="/help">
              More help <ArrowUpRight size={16} />
            </Link>
          </div>
          <div>
            {faqs.map(([q, a], i) => (
              <div className="faq-item" key={q}>
                <button
                  onClick={() => setFaq(faq === i ? -1 : i)}
                  aria-expanded={faq === i}
                >
                  {q}
                  {faq === i ? <Minus size={18} /> : <Plus size={18} />}
                </button>
                {faq === i && <p>{a}</p>}
              </div>
            ))}
          </div>
        </section>
        <section className="closing-cta">
          <Globe2 size={30} />
          <h2>
            Your next opportunity
            <br />
            starts with a hello.
          </h2>
          <Link className="button primary large" to="/register">
            Create your free card <ArrowUpRight size={18} />
          </Link>
          <p>Your identity. One link. Zero code.</p>
        </section>
      </main>
      <MarketingFooter />
    </>
  );
}
