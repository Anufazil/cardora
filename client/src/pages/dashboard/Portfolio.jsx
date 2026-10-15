import { useState } from "react";
import { useForm } from "react-hook-form";
import { Plus, Upload, Pencil, Trash2, Images } from "lucide-react";
import { toast } from "sonner";
import { api, errorMessage, uploadImage } from "../../services/api";
import { useResource } from "../../hooks/useResource";
import {
  PageHeading,
  Button,
  Field,
  Empty,
  Loading,
  ErrorState,
} from "../../components/common/UI";
const blank = {
  title: "",
  description: "",
  thumbnail: "",
  projectUrl: "",
  tags: [],
  displayOrder: 0,
  featured: false,
  published: false,
};
function ProjectManager({ card }) {
  const { data, loading, error, reload } = useResource(
    `/cards/${card._id}/portfolio`,
  );
  const [editing, setEditing] = useState(null),
    [uploading, setUploading] = useState(false),
    [busy, setBusy] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: blank });
  function edit(item = { ...blank }) {
    setEditing(item);
    reset({ ...item, tags: item.tags.join(", ") });
  }
  async function save(values) {
    try {
      const { _id, owner, businessCard, createdAt, updatedAt, __v, ...rest } =
        values;
      const body = {
        ...rest,
        tags: values.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        displayOrder: Number(values.displayOrder),
      };
      if (editing._id) await api.patch(`/portfolio/${editing._id}`, body);
      else await api.post(`/cards/${card._id}/portfolio`, body);
      setEditing(null);
      toast.success("Project saved");
      reload();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }
  return (
    <>
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error} retry={reload} />
      ) : (
        <>
          <div className="panel-toolbar">
            <span>
              {data.length} of 5 projects · {card.draft.displayName}
            </span>
            <Button disabled={data.length >= 5} onClick={() => edit()}>
              <Plus size={16} />
              Add project
            </Button>
          </div>
          {!data.length ? (
            <Empty
              title="Let your work do the talking."
              icon={Images}
              to={null}
            >
              Add your first project using the button above.
            </Empty>
          ) : (
            <div className="portfolio-grid">
              {data.map((item) => (
                <article className="portfolio-tile" key={item._id}>
                  {item.thumbnail ? (
                    <img src={item.thumbnail} alt={item.title} />
                  ) : (
                    <div className="portfolio-placeholder">
                      <Images size={32} />
                    </div>
                  )}
                  <div>
                    <span className={`status ${item.published ? "live" : ""}`}>
                      {item.published ? "Visible on live card" : "Hidden"}
                      {item.featured ? " · Featured" : ""}
                    </span>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                    <div className="button-row">
                      <Button variant="secondary" onClick={() => edit(item)}>
                        <Pencil size={14} />
                        Edit
                      </Button>
                      <Button
                        disabled={busy}
                        variant="danger"
                        onClick={async () => {
                          if (!confirm(`Delete “${item.title}”?`)) return;
                          setBusy(true);
                          try {
                            await api.delete(`/portfolio/${item._id}`);
                            reload();
                          } catch (e) {
                            toast.error(errorMessage(e));
                          } finally {
                            setBusy(false);
                          }
                        }}
                      >
                        <Trash2 size={15} />
                        Delete
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}
      {editing && (
        <div className="modal-backdrop">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="project-heading"
          >
            <h2 id="project-heading">
              {editing._id ? "Edit project" : "Something worth sharing."}
            </h2>
            <p>Published projects appear immediately on your live card.</p>
            <form onSubmit={handleSubmit(save)}>
              <Field label="Project title" error={errors.title?.message}>
                <input
                  autoFocus
                  {...register("title", {
                    required: "Add a title",
                    minLength: {
                      value: 2,
                      message: "Use at least 2 characters",
                    },
                  })}
                />
              </Field>
              <Field label="Description">
                <textarea rows={3} {...register("description")} />
              </Field>
              <Field label="Project URL">
                <input type="url" {...register("projectUrl")} />
              </Field>
              <Field label="Tags (comma separated)">
                <input {...register("tags")} />
              </Field>
              <Field label="Display order">
                <input
                  type="number"
                  min="0"
                  max="1000"
                  {...register("displayOrder")}
                />
              </Field>
              <label className="button secondary upload-label">
                <Upload size={16} />
                {uploading ? "Uploading…" : "Upload thumbnail"}
                <input
                  aria-label="Upload project thumbnail"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  disabled={uploading}
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    setUploading(true);
                    try {
                      setValue("thumbnail", await uploadImage(file));
                    } catch (e) {
                      toast.error(errorMessage(e));
                    } finally {
                      setUploading(false);
                    }
                  }}
                />
              </label>
              {watch("thumbnail") && (
                <img
                  className="thumbnail-preview"
                  src={watch("thumbnail")}
                  alt="Project thumbnail"
                />
              )}
              <label className="checkbox">
                <input type="checkbox" {...register("featured")} />
                Feature this project
              </label>
              <label className="checkbox">
                <input type="checkbox" {...register("published")} />
                Show on published profile
              </label>
              <div className="button-row">
                <Button type="submit" busy={isSubmitting} disabled={uploading}>
                  Save project
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={isSubmitting}
                  onClick={() => {
                    if (confirm("Discard changes to this project?"))
                      setEditing(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
export default function Portfolio() {
  const { data, loading, error, reload } = useResource("/cards");
  return (
    <>
      <PageHeading
        eyebrow="A COLLECTION OF YOUR BEST"
        title="Your work. Your story."
      >
        Give your next connection something to remember.
      </PageHeading>
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error} retry={reload} />
      ) : data.length ? (
        <ProjectManager card={data[0]} />
      ) : (
        <Empty title="Give your work a home first.">
          Create a digital card, then add the projects you want the world to
          see.
        </Empty>
      )}
    </>
  );
}
