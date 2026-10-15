import { useState } from "react";
import { Link } from "react-router-dom";
import {
  PanelsTopLeft,
  Eye,
  MousePointer2,
  Radio,
  ArrowUpRight,
  Plus,
  ArrowRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useAuth } from "../../contexts/Auth";
import { useResource } from "../../hooks/useResource";
import {
  PageHeading,
  Loading,
  ErrorState,
  Empty,
} from "../../components/common/UI";
export function ViewsChart({ data }) {
  return (
    <div
      className="chart"
      role="img"
      aria-label={`Profile views over time: ${data.reduce((s, d) => s + d.views, 0)} total views`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 15, right: 15, left: -28, bottom: 0 }}
        >
          <defs>
            <linearGradient id="viewsFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#635BFF" stopOpacity={0.18} />
              <stop offset="100%" stopColor="#635BFF" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#eef0f5" />
          <XAxis
            dataKey="date"
            tickFormatter={(v) =>
              new Date(`${v}T00:00:00Z`).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })
            }
            tickLine={false}
            axisLine={false}
            minTickGap={45}
            tick={{ fontSize: 11, fill: "#858a99" }}
          />
          <YAxis
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "#858a99" }}
          />
          <Tooltip
            contentStyle={{
              border: "1px solid #e7e9f0",
              borderRadius: 10,
              fontSize: 12,
            }}
          />
          <Area
            isAnimationActive={false}
            type="monotone"
            dataKey="views"
            stroke="#635BFF"
            strokeWidth={2.5}
            fill="url(#viewsFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
export default function Overview({ analytics = false }) {
  const { user } = useAuth();
  const [days, setDays] = useState("30");
  const { data, loading, error, reload } = useResource(
    `/analytics/overview?days=${days}`,
  );
  const cards = useResource("/cards");
  const first = cards.data?.[0];
  const completion = first
    ? Math.round(
        ([
          "displayName",
          "professionalTitle",
          "biography",
          "email",
          "profileImage",
        ].filter((k) => first.draft[k]).length /
          5) *
          100,
      )
    : 0;
  return (
    <>
      <PageHeading
        eyebrow={
          analytics
            ? "YOUR CONNECTIONS, IN PERSPECTIVE"
            : "YOUR PERSONAL WORKSPACE"
        }
        title={
          analytics
            ? "Every connection counts."
            : `Hello, ${user.name.split(" ")[0]}.`
        }
        action={
          analytics ? (
            <select
              aria-label="Analytics date range"
              value={days}
              onChange={(e) => setDays(e.target.value)}
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          ) : (
            <Link
              className="button primary"
              to={
                first ? `/dashboard/cards/${first._id}` : "/dashboard/cards/new"
              }
            >
              {first ? "Edit your card" : "Create your card"}
              <Plus size={16} />
            </Link>
          )
        }
      >
        {analytics
          ? "A closer look at how people engage with your profile."
          : "Here’s what’s happening with your digital identity."}
      </PageHeading>
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error} retry={reload} />
      ) : (
        <>
          <div className="metrics">
            {[
              [
                PanelsTopLeft,
                "Total cards",
                data.totalCards,
                "Your digital identities",
              ],
              [
                Radio,
                "Published cards",
                data.publishedCards,
                "Ready to make connections",
              ],
              [Eye, "Profile views", data.views, `In the last ${days} days`],
              [
                MousePointer2,
                "Contact clicks",
                data.contactClicks,
                `In the last ${days} days`,
              ],
            ].map(([Icon, label, value, note]) => (
              <article className="metric" key={label}>
                <div>
                  <span>{label}</span>
                  <Icon size={18} />
                </div>
                <strong>{value}</strong>
                <small>{note}</small>
              </article>
            ))}
          </div>
          {!analytics && (
            <div className="welcome-banner">
              <div className="banner-mark">
                c<span>↗</span>
              </div>
              <div>
                <span className="eyebrow">SMALL CARD. BIG POSSIBILITIES.</span>
                <h2>
                  {first
                    ? "Your story deserves to be shared."
                    : "Your next chapter starts with a card."}
                </h2>
                <p>
                  {first
                    ? "Keep your details fresh and your best work front and center."
                    : "A beautiful introduction. Your best work. One simple link."}
                </p>
              </div>
              <Link
                className="button secondary"
                to={first ? "/dashboard/cards" : "/dashboard/cards/new"}
              >
                {first ? "View your cards" : "Make it yours"}
                <ArrowUpRight size={16} />
              </Link>
            </div>
          )}
          <div className="overview-columns">
            <section className="panel">
              <div className="panel-heading">
                <div>
                  <h3>Profile engagement</h3>
                  <p>Your profile views over time</p>
                </div>
                {!analytics && (
                  <select
                    aria-label="Date range"
                    value={days}
                    onChange={(e) => setDays(e.target.value)}
                  >
                    <option value="7">Last 7 days</option>
                    <option value="30">Last 30 days</option>
                    <option value="90">Last 90 days</option>
                  </select>
                )}
              </div>
              <ViewsChart data={data.series} />
              {!data.views && (
                <p className="chart-caption">
                  Your first views will appear here after you publish and share.
                </p>
              )}
            </section>
            <section className="panel completion-panel">
              <div className="panel-heading">
                <h3>
                  {analytics
                    ? "A note on your data"
                    : "Make a strong impression"}
                </h3>
              </div>
              {analytics ? (
                <>
                  <div className="privacy-icon">
                    <Eye size={28} />
                  </div>
                  <h2>Useful, not intrusive.</h2>
                  <p>
                    Views and clicks are deduplicated in 30-minute windows.
                    These are engagement counts, not unique people.
                  </p>
                  <p>
                    QR visits count only when the tagged profile link opens.
                    Tracking respects Do Not Track and Global Privacy Control.
                  </p>
                </>
              ) : (
                <>
                  <div
                    className="completion-ring"
                    style={{ "--progress": `${completion * 3.6}deg` }}
                  >
                    <strong>
                      {completion}
                      <small>%</small>
                    </strong>
                  </div>
                  <h3>
                    {completion === 100
                      ? "Looking good. Ready to connect."
                      : "A few details go a long way."}
                  </h3>
                  <p>
                    Add a photo, title, biography and email to complete your
                    introduction.
                  </p>
                  <Link
                    className="text-link"
                    to={
                      first
                        ? `/dashboard/cards/${first._id}`
                        : "/dashboard/cards/new"
                    }
                  >
                    {first ? "Complete your profile" : "Create your card"}
                    <ArrowRight size={15} />
                  </Link>
                </>
              )}
            </section>
          </div>
          <div className="overview-columns">
            <section className="panel">
              <div className="panel-heading">
                <h3>
                  {analytics ? "Top-performing cards" : "Recent activity"}
                </h3>
                <span className="muted">Last {days} days</span>
              </div>
              {analytics ? (
                data.top.length ? (
                  <div className="activity-list">
                    {data.top.map((t) => (
                      <div key={t._id}>
                        <Eye size={17} />
                        <strong>{t.name}</strong>
                        <span>
                          {t.views} views · {t.qrVisits} QR visits
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="small-empty">
                    No profile views yet. Publish and share your card to get
                    started.
                  </div>
                )
              ) : data.recent.length ? (
                <div className="activity-list">
                  {data.recent.map((a) => (
                    <div key={a._id}>
                      <span className="activity-dot" />
                      <strong>
                        {a.eventType === "view"
                          ? "Someone opened your profile"
                          : `${a.eventType} action clicked`}
                      </strong>
                      <span>{new Date(a.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="small-empty">
                  <Radio size={24} />
                  <h4>A quiet start. A world of potential.</h4>
                  <p>Your real profile activity will appear here.</p>
                </div>
              )}
            </section>
            <section className="panel quick-links">
              <div className="panel-heading">
                <h3>{analytics ? "Contact actions" : "Your next step"}</h3>
              </div>
              {analytics ? (
                <div className="activity-list">
                  {[
                    "phone",
                    "email",
                    "whatsapp",
                    "website",
                    "social",
                    "vcard",
                  ].map((t) => (
                    <div key={t}>
                      <strong>{t}</strong>
                      <span>{data.counts[t] || 0}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {[
                    [
                      "Explore templates",
                      "Find a look that feels like you.",
                      "/examples",
                    ],
                    [
                      "Showcase your work",
                      "Build a portfolio worth sharing.",
                      "/dashboard/portfolio",
                    ],
                    [
                      "Share your identity",
                      "Get your profile link and QR code.",
                      "/dashboard/cards",
                    ],
                  ].map(([t, d, to]) => (
                    <Link key={t} to={to}>
                      <div>
                        <h4>{t}</h4>
                        <p>{d}</p>
                      </div>
                      <ArrowUpRight size={17} />
                    </Link>
                  ))}
                </>
              )}
            </section>
          </div>
        </>
      )}
    </>
  );
}
