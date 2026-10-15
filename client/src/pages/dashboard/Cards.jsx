import { Link } from "react-router-dom";
import { Plus, ArrowUpRight, Pencil, Trash2, QrCode } from "lucide-react";
import { toast } from "sonner";
import { useResource } from "../../hooks/useResource";
import { api, errorMessage } from "../../services/api";
import {
  PageHeading,
  Empty,
  Loading,
  ErrorState,
  Button,
} from "../../components/common/UI";
import ProfileCard from "../../components/cards/ProfileCard";
import SharePanel from "../../components/cards/SharePanel";
import { useState } from "react";
export default function Cards() {
  const { data, loading, error, reload } = useResource("/cards");
  const [share, setShare] = useState(null),
    [busy, setBusy] = useState(false);
  async function remove(card) {
    if (
      !confirm(
        `Delete “${card.draft.displayName}” and its portfolio? This cannot be undone.`,
      )
    )
      return;
    setBusy(true);
    try {
      await api.delete(`/cards/${card._id}`);
      toast.success("Card deleted");
      await reload();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeading
        eyebrow="YOUR DIGITAL IDENTITIES"
        title="My cards"
        action={
          data?.length === 0 && (
            <Link className="button primary" to="/dashboard/cards/new">
              <Plus size={17} />
              New card
            </Link>
          )
        }
      >
        One good introduction can change everything.
      </PageHeading>
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error} retry={reload} />
      ) : !data.length ? (
        <Empty title="Your first impression starts here">
          Create a card that brings your story, your work and your contact
          details together.
        </Empty>
      ) : (
        <>
          <div className="cards-grid">
            {data.map((card) => (
              <article className="owned-card" key={card._id}>
                <div className="owned-card-preview">
                  <ProfileCard profile={card.draft} preview />
                </div>
                <div className="owned-card-info">
                  <span className={`status ${card.published ? "live" : ""}`}>
                    {card.published ? "Published" : "Draft"}
                  </span>
                  <h3>{card.draft.displayName}</h3>
                  <p>/{card.slug}</p>
                  <div className="button-row">
                    <Link
                      className="button secondary"
                      to={`/dashboard/cards/${card._id}`}
                    >
                      <Pencil size={15} />
                      Edit card
                    </Link>
                    {card.published && (
                      <>
                        <Link
                          className="icon-button"
                          to={`/${card.slug}`}
                          aria-label="Open public profile"
                        >
                          <ArrowUpRight size={18} />
                        </Link>
                        <button
                          className="icon-button"
                          aria-label="Share QR code"
                          onClick={() =>
                            setShare(share === card.slug ? null : card.slug)
                          }
                        >
                          <QrCode size={18} />
                        </button>
                      </>
                    )}
                    <button
                      disabled={busy}
                      className="icon-button danger"
                      aria-label="Delete card"
                      onClick={() => remove(card)}
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
            <div className="card-limit">
              <Plus size={24} />
              <h3>Room to grow.</h3>
              <p>
                Your free plan includes one card.
                <br />
                Multi-card plans are in development.
              </p>
              <Link to="/dashboard/billing">
                View your plan <ArrowUpRight size={14} />
              </Link>
            </div>
          </div>
          {share && <SharePanel slug={share} />}
        </>
      )}
    </>
  );
}
