import { Link, useSearchParams } from "react-router-dom";
import { MarketingNav, MarketingFooter } from "./Marketing";
import { sample, sampleProjects } from "../../utils/profile";
import ProfileCard from "../../components/cards/ProfileCard";
export default function Examples() {
  const [params, setParams] = useSearchParams();
  const template = ["studio", "minimal", "editorial"].includes(
    params.get("template"),
  )
    ? params.get("template")
    : "studio";
  return (
    <>
      <MarketingNav />
      <main className="examples-page">
        <div className="center-heading">
          <div className="eyebrow">FIND YOUR FIRST IMPRESSION</div>
          <h1>Three ways to be yourself.</h1>
          <p>Explore a demonstration profile. Your own story comes next.</p>
        </div>
        <div className="segmented">
          {["studio", "minimal", "editorial"].map((t) => (
            <button
              key={t}
              className={template === t ? "active" : ""}
              onClick={() => setParams({ template: t })}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="example-profile">
          <ProfileCard
            profile={{ ...sample, template }}
            portfolio={sampleProjects}
            preview
            demo
          />
        </div>
        <Link className="button primary" to={`/register?template=${template}`}>
          Start with {template}
        </Link>
      </main>
      <MarketingFooter />
    </>
  );
}
