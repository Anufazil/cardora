import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Copy, Download, Share2 } from "lucide-react";
import { toast } from "sonner";
import { publicUrl, download } from "../../utils/profile";
import { Button } from "../common/UI";
export default function SharePanel({ slug }) {
  const [png, setPng] = useState("");
  const url = publicUrl(slug),
    qrUrl = `${url}?source=qr`;
  useEffect(() => {
    QRCode.toDataURL(qrUrl, {
      width: 800,
      margin: 3,
      errorCorrectionLevel: "M",
    })
      .then(setPng)
      .catch(() => toast.error("QR generation failed."));
  }, [qrUrl]);
  async function share() {
    try {
      if (navigator.share)
        await navigator.share({ title: "My Cardora profile", url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success("Profile link copied");
      }
    } catch (e) {
      if (e.name !== "AbortError")
        toast.error("Could not share. Copy the link below.");
    }
  }
  return (
    <div className="share-panel">
      <div>
        {png && <img src={png} alt={`QR code for ${url}`} />}
        <small>One code. Always up to date.</small>
      </div>
      <div>
        <h3>Make your next connection.</h3>
        <p>
          Your QR code always opens this address, even after you update your
          card.
        </p>
        <div className="copy-link">
          <input aria-label="Public profile URL" value={url} readOnly />
          <button
            aria-label="Copy link"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(url);
                toast.success("Link copied");
              } catch {
                toast.error("Copy the displayed URL manually.");
              }
            }}
          >
            <Copy size={17} />
          </button>
        </div>
        <div className="button-row">
          <a
            className="button secondary"
            href={png || undefined}
            download={`${slug}-qr.png`}
          >
            <Download size={16} />
            PNG
          </a>
          <Button
            variant="secondary"
            onClick={async () => {
              try {
                download(
                  await QRCode.toString(qrUrl, { type: "svg", margin: 3 }),
                  `${slug}-qr.svg`,
                  "image/svg+xml",
                );
              } catch {
                toast.error("QR generation failed.");
              }
            }}
          >
            SVG / print
          </Button>
          <Button variant="secondary" onClick={share}>
            <Share2 size={16} />
            Share
          </Button>
        </div>
      </div>
    </div>
  );
}
