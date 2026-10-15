import { useEffect, useState } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { Share2 } from "lucide-react";
import { useResource } from "../../hooks/useResource";
import { api } from "../../services/api";
import { Logo, Loading, ErrorState, Button } from "../../components/common/UI";
import ProfileCard from "../../components/cards/ProfileCard";
import SharePanel from "../../components/cards/SharePanel";
export default function PublicProfile() {
  const { slug } = useParams();
  const [params] = useSearchParams();
  const { data, loading, error, reload } = useResource(`/public/${slug}`);
  const [share, setShare] = useState(false);
  async function track(type) {
    if (!data) return;
    try {
      await api.post(`/public/${slug}/events`, {
        type,
        source: params.get("source") === "qr" ? "qr" : "direct",
        token: data.eventToken,
      });
    } catch (e) {
      if (import.meta.env.DEV)
        console.warn(
          "Analytics event was not recorded:",
          e.response?.status || "network",
        );
    }
  }
  useEffect(() => {
    if (data) {
      document.title = `${data.profile.displayName} | Cardora`;
      track("view");
    }
    return () => {
      document.title = "Cardora — Your Identity. One Link.";
    };
  }, [data]);
  return (
    <main className="public-page">
      <div className="public-top">
        <Logo />
        {data && (
          <Button variant="secondary" onClick={() => setShare(!share)}>
            <Share2 size={16} />
            Share
          </Button>
        )}
      </div>
      {loading ? (
        <Loading />
      ) : error ? (
        <>
          <ErrorState message={error} retry={reload} />
          <Link to="/" className="button secondary">
            Back to Cardora
          </Link>
        </>
      ) : (
        <>
          <div className="public-profile-wrap">
            <ProfileCard
              profile={data.profile}
              portfolio={data.portfolio}
              onEvent={track}
            />
          </div>
          {share && <SharePanel slug={slug} />}
        </>
      )}
    </main>
  );
}
