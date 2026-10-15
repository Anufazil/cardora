import { useEffect, useState } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Plus,
  Trash2,
  Smartphone,
  Monitor,
  Upload,
  Check,
  Eye,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { api, errorMessage, uploadImage } from "../../services/api";
import { useAuth } from "../../contexts/Auth";
import { defaults } from "../../utils/profile";
import ProfileCard from "../../components/cards/ProfileCard";
import SharePanel from "../../components/cards/SharePanel";
import { Button, Field, Loading, ErrorState } from "../../components/common/UI";
export default function Editor() {
  const { id } = useParams(),
    navigate = useNavigate(),
    { user } = useAuth();
  const [card, setCard] = useState(null),
    [items, setItems] = useState([]),
    [loading, setLoading] = useState(!!id),
    [loadError, setLoadError] = useState(""),
    [busy, setBusy] = useState(""),
    [uploading, setUploading] = useState(""),
    [tab, setTab] = useState("Details"),
    [device, setDevice] = useState("mobile"),
    [mobilePreview, setMobilePreview] = useState(false),
    [showShare, setShowShare] = useState(false);
  const {
    register,
    control,
    reset,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, isDirty },
  } = useForm({
    defaultValues: { ...defaults, displayName: user.name, slug: "" },
  });
  const profile = useWatch({ control }),
    socials = useFieldArray({ control, name: "socials" });
  useEffect(() => {
    let active = true;
    if (id) {
      Promise.all([api.get(`/cards/${id}`), api.get(`/cards/${id}/portfolio`)])
        .then(([a, b]) => {
          if (active) {
            setCard(a.data.data);
            setItems(b.data.data);
            reset({ ...a.data.data.draft, slug: a.data.data.slug });
          }
        })
        .catch((e) => active && setLoadError(errorMessage(e)))
        .finally(() => active && setLoading(false));
    }
    return () => {
      active = false;
    };
  }, [id, reset]);
  useEffect(() => {
    const prevent = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    const click = (e) => {
      const a = e.target.closest("a[href]");
      if (
        isDirty &&
        a &&
        a.origin === location.origin &&
        a.pathname !== location.pathname &&
        !confirm("Leave this editor? Your unsaved changes will be lost.")
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", prevent);
    document.addEventListener("click", click, true);
    return () => {
      window.removeEventListener("beforeunload", prevent);
      document.removeEventListener("click", click, true);
    };
  }, [isDirty]);
  async function persist(values, publish = false) {
    let savedId;
    setBusy(publish ? "publish" : "save");
    try {
      const { slug, _id, ...draft } = values;
      const response = id
        ? await api.patch(`/cards/${id}`, { draft })
        : await api.post("/cards", { slug, draft });
      let saved = response.data.data;
      savedId = saved._id;
      reset({ ...saved.draft, slug: saved.slug });
      setCard(saved);
      if (publish) {
        saved = (await api.post(`/cards/${saved._id}/publish`)).data.data;
        setCard(saved);
        toast.success("Your card is live");
      } else toast.success("Draft saved");
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy("");
      if (!id && savedId)
        navigate(`/dashboard/cards/${savedId}`, { replace: true });
    }
  }
  async function image(event, field) {
    const file = event.target.files[0];
    if (!file) return;
    setUploading(field);
    try {
      setValue(field, await uploadImage(file), { shouldDirty: true });
      toast.success("Image uploaded");
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setUploading("");
      event.target.value = "";
    }
  }
  function field(label, key, options = {}) {
    return (
      <Field label={label} error={errors[key]?.message} help={options.help}>
        {options.textarea ? (
          <textarea rows={4} {...register(key, { maxLength: 1500 })} />
        ) : (
          <input
            type={options.type || "text"}
            {...register(key, {
              required: options.required ? "This field is required" : false,
              ...(options.type === "email"
                ? {
                    pattern: {
                      value: /^$|^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: "Enter a valid email",
                    },
                  }
                : {}),
            })}
          />
        )}
      </Field>
    );
  }
  if (loading) return <Loading />;
  if (loadError)
    return (
      <ErrorState message={loadError} retry={() => window.location.reload()} />
    );
  return (
    <>
      <div className="editor-heading">
        <div>
          <Link to="/dashboard/cards" className="back-link">
            <ArrowLeft size={15} />
            My cards
          </Link>
          <h1>{id ? "Make it yours." : "A new introduction."}</h1>
          <p>
            {isDirty
              ? "You have unsaved changes."
              : card
                ? "All changes saved as draft."
                : "Start with the essentials. The rest is you."}
          </p>
        </div>
        <div className="button-row">
          <Button
            variant="secondary"
            disabled={!!busy || !!uploading}
            onClick={handleSubmit((v) => persist(v))}
          >
            <Save size={16} />
            {busy === "save" ? "Saving…" : "Save draft"}
          </Button>
          <Button
            disabled={!!busy || !!uploading}
            onClick={handleSubmit((v) => persist(v, true))}
          >
            {busy === "publish"
              ? "Publishing…"
              : card?.published
                ? "Republish changes"
                : "Publish card"}
            <Eye size={16} />
          </Button>
        </div>
      </div>
      {!user.emailVerified && (
        <div className="notice">
          Save a draft anytime.{" "}
          <Link to="/dashboard/settings">Verify your email</Link> to publish
          your card.
        </div>
      )}
      <button
        className="button secondary preview-toggle"
        onClick={() => setMobilePreview(!mobilePreview)}
      >
        {mobilePreview ? "Back to editing" : "Show live preview"}
      </button>
      <div className={`editor-layout ${mobilePreview ? "show-preview" : ""}`}>
        <section className="editor-fields">
          <div className="editor-tabs">
            {["Details", "Links", "Design"].map((t) => (
              <button
                key={t}
                className={tab === t ? "active" : ""}
                onClick={() => setTab(t)}
              >
                {t}
              </button>
            ))}
          </div>
          <form onSubmit={handleSubmit((v) => persist(v))}>
            {tab === "Details" && (
              <>
                <div className="form-section">
                  <div className="section-title">
                    <span>01</span>
                    <div>
                      <h3>The face behind the name</h3>
                      <p>Start with a warm introduction.</p>
                    </div>
                  </div>
                  <div className="upload-row">
                    <div className="editor-avatar">
                      {profile.profileImage ? (
                        <img src={profile.profileImage} alt="Your profile" />
                      ) : (
                        user.name.slice(0, 1)
                      )}
                    </div>
                    <div>
                      <label className="button secondary upload-label">
                        <Upload size={15} />
                        {uploading === "profileImage"
                          ? "Uploading…"
                          : "Upload photo"}
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          aria-label="Upload profile photo"
                          disabled={!!uploading}
                          onChange={(e) => image(e, "profileImage")}
                        />
                      </label>
                      <small>JPG, PNG or WebP · up to 5 MB</small>
                    </div>
                  </div>
                  {field("Full name", "displayName", { required: true })}
                  {field("Professional title", "professionalTitle")}
                  {field("Business / organization", "businessName")}
                  <label className="button secondary upload-label">
                    <Upload size={15} />
                    {uploading === "logo"
                      ? "Uploading…"
                      : "Upload business logo"}
                    <input
                      aria-label="Upload business logo"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      disabled={!!uploading}
                      onChange={(e) => image(e, "logo")}
                    />
                  </label>
                  {field("A little about you", "biography", {
                    textarea: true,
                    help: "What do you do, and what makes your work different?",
                  })}
                </div>
                <div className="form-section">
                  <div className="section-title">
                    <span>02</span>
                    <div>
                      <h3>Your place on the internet</h3>
                      <p>A stable address for every new connection.</p>
                    </div>
                  </div>
                  <Field
                    label="Profile address"
                    error={errors.slug?.message}
                    help="Choose carefully. Your address is fixed to keep QR codes working."
                  >
                    <div className="slug-input">
                      <span>{location.host}/</span>
                      <input
                        readOnly={!!id}
                        {...register("slug", {
                          required: "Choose an address",
                          minLength: {
                            value: 3,
                            message: "Use at least 3 characters",
                          },
                          pattern: {
                            value: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
                            message:
                              "Use lowercase letters, numbers and hyphens",
                          },
                        })}
                      />
                    </div>
                  </Field>
                </div>
              </>
            )}
            {tab === "Links" && (
              <>
                <div className="form-section">
                  <div className="section-title">
                    <span>01</span>
                    <div>
                      <h3>Keep the conversation going</h3>
                      <p>Only add information you want to share publicly.</p>
                    </div>
                  </div>
                  {field("Email", "email", { type: "email" })}
                  {field("Phone number", "phone")}
                  {field("WhatsApp number", "whatsapp", {
                    help: "Include your country code.",
                  })}
                  {field("Website", "website", { type: "url" })}
                  {field("Business address", "address")}
                  {field("Map link", "mapUrl", { type: "url" })}
                </div>
                <div className="form-section">
                  <h3>Find you elsewhere</h3>
                  <p className="muted">
                    Add up to eight social links, in your preferred order.
                  </p>
                  {socials.fields.map((item, i) => (
                    <div className="social-editor" key={item.id}>
                      <select
                        aria-label={`Platform ${i + 1}`}
                        {...register(`socials.${i}.platform`)}
                      >
                        {[
                          "Instagram",
                          "LinkedIn",
                          "Facebook",
                          "YouTube",
                          "TikTok",
                          "GitHub",
                          "X",
                          "Website",
                        ].map((p) => (
                          <option key={p}>{p}</option>
                        ))}
                      </select>
                      <input
                        aria-label={`Social URL ${i + 1}`}
                        placeholder="https://"
                        {...register(`socials.${i}.url`, { required: true })}
                      />
                      <button
                        type="button"
                        className="icon-button"
                        aria-label="Move link up"
                        disabled={i === 0}
                        onClick={() => socials.move(i, i - 1)}
                      >
                        <ArrowUp size={15} />
                      </button>
                      <button
                        type="button"
                        className="icon-button danger"
                        aria-label="Remove link"
                        onClick={() => socials.remove(i)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                  <Button
                    variant="secondary"
                    type="button"
                    disabled={socials.fields.length >= 8}
                    onClick={() =>
                      socials.append({ platform: "LinkedIn", url: "" })
                    }
                  >
                    <Plus size={15} />
                    Add social link
                  </Button>
                </div>
              </>
            )}
            {tab === "Design" && (
              <>
                <div className="form-section">
                  <h3>A look that feels like you</h3>
                  <p className="muted">
                    Three starting points. Your own signature.
                  </p>
                  <div className="template-options">
                    {["studio", "minimal", "editorial"].map((t) => (
                      <button
                        type="button"
                        key={t}
                        className={profile.template === t ? "selected" : ""}
                        onClick={() =>
                          setValue("template", t, { shouldDirty: true })
                        }
                      >
                        <span className={`template-swatch swatch-${t}`} />
                        {t}
                        {profile.template === t && <Check size={14} />}
                      </button>
                    ))}
                  </div>
                  <Field label="Accent color">
                    <div className="color-options">
                      {[
                        "#635BFF",
                        "#2563EB",
                        "#157D68",
                        "#B34D67",
                        "#252733",
                      ].map((color) => (
                        <button
                          key={color}
                          type="button"
                          style={{ background: color }}
                          aria-label={`Accent ${color}`}
                          aria-pressed={profile.accent === color}
                          onClick={() =>
                            setValue("accent", color, { shouldDirty: true })
                          }
                        >
                          {profile.accent === color && <Check size={17} />}
                        </button>
                      ))}
                    </div>
                  </Field>
                  <Field label="Appearance">
                    <select {...register("appearance")}>
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                    </select>
                  </Field>
                  <Field label="Photo shape">
                    <select {...register("imageLayout")}>
                      <option value="circle">Circle</option>
                      <option value="rounded">Rounded square</option>
                    </select>
                  </Field>
                  <Field label="Button style">
                    <select {...register("buttonStyle")}>
                      <option value="rounded">Rounded</option>
                      <option value="square">Square</option>
                    </select>
                  </Field>
                </div>
                <div className="form-section">
                  <h3>Tell your story in your order</h3>
                  {profile.sections.map((section, i) => (
                    <div className="section-order" key={section}>
                      <span>{section}</span>
                      <div>
                        <button
                          type="button"
                          aria-label={`Move ${section} up`}
                          disabled={i === 0}
                          onClick={() => {
                            const next = [...getValues("sections")];
                            [next[i - 1], next[i]] = [next[i], next[i - 1]];
                            setValue("sections", next, { shouldDirty: true });
                          }}
                        >
                          <ArrowUp size={16} />
                        </button>
                        <button
                          type="button"
                          aria-label={`Move ${section} down`}
                          disabled={i === 2}
                          onClick={() => {
                            const next = [...getValues("sections")];
                            [next[i + 1], next[i]] = [next[i], next[i + 1]];
                            setValue("sections", next, { shouldDirty: true });
                          }}
                        >
                          <ArrowDown size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </form>
          {card && (
            <div className="form-section">
              <h3>Ready for the next step?</h3>
              <div className="button-row">
                <Link to="/dashboard/portfolio" className="button secondary">
                  Manage portfolio
                </Link>
                {card.published && (
                  <>
                    <Link
                      className="button secondary"
                      to={`/${card.slug}`}
                      target="_blank"
                    >
                      View live profile
                    </Link>
                    <Button
                      variant="secondary"
                      onClick={() => setShowShare(!showShare)}
                    >
                      Share & QR
                    </Button>
                    <Button
                      variant="danger"
                      disabled={!!busy}
                      onClick={async () => {
                        if (
                          !confirm(
                            "Unpublish this card? Visitors will no longer be able to view it.",
                          )
                        )
                          return;
                        setBusy("unpublish");
                        try {
                          const r = await api.post(
                            `/cards/${card._id}/unpublish`,
                          );
                          setCard(r.data.data);
                          setShowShare(false);
                          toast.success("Card unpublished");
                        } catch (e) {
                          toast.error(errorMessage(e));
                        } finally {
                          setBusy("");
                        }
                      }}
                    >
                      Unpublish
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </section>
        <aside className={`editor-preview device-${device}`}>
          <div className="preview-toolbar">
            <span>
              <span className="tiny-dot" /> LIVE PREVIEW
            </span>
            <div>
              <button
                aria-label="Mobile preview"
                className={device === "mobile" ? "active" : ""}
                onClick={() => setDevice("mobile")}
              >
                <Smartphone size={17} />
              </button>
              <button
                aria-label="Desktop preview"
                className={device === "desktop" ? "active" : ""}
                onClick={() => setDevice("desktop")}
              >
                <Monitor size={17} />
              </button>
            </div>
          </div>
          <div className="preview-stage">
            <ProfileCard
              profile={profile}
              portfolio={items.filter((i) => i.published)}
              preview
            />
          </div>
          <p className="preview-note">
            A little preview of your next big introduction.
          </p>
        </aside>
      </div>
      {showShare && card?.published && <SharePanel slug={card.slug} />}
    </>
  );
}
