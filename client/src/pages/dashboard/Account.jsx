import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { ShieldCheck, Check, CalendarDays } from "lucide-react";
import { useAuth } from "../../contexts/Auth";
import { api, errorMessage } from "../../services/api";
import { useResource } from "../../hooks/useResource";
import {
  PageHeading,
  Button,
  Field,
  Loading,
  ErrorState,
  Empty,
} from "../../components/common/UI";
export function Settings() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user.name),
    [busy, setBusy] = useState(false);
  return (
    <>
      <PageHeading title="A little about you." eyebrow="ACCOUNT SETTINGS">
        Your account details and security, in one place.
      </PageHeading>
      <section className="panel settings-panel">
        <h3>Personal details</h3>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              setUser((await api.patch("/auth/account", { name })).data.data);
              toast.success("Account updated");
            } catch (e) {
              toast.error(errorMessage(e));
            } finally {
              setBusy(false);
            }
          }}
        >
          <Field label="Full name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              minLength={2}
              maxLength={100}
              required
            />
          </Field>
          <Field
            label="Account email"
            help="This is your sign-in email. Public contact details are managed in your card."
          >
            <input value={user.email} readOnly />
          </Field>
          <Button busy={busy}>Save changes</Button>
        </form>
      </section>
      <section className="panel settings-panel">
        <div className="section-title">
          <ShieldCheck />
          <h3>Email & security</h3>
        </div>
        <p>
          {user.emailVerified
            ? "Your email is verified. You’re ready to publish."
            : "Verify your email before publishing your profile."}
        </p>
        <div className="button-row">
          {!user.emailVerified && (
            <Button
              variant="secondary"
              busy={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await api.post("/auth/resend-verification");
                  toast.success(
                    "Verification email sent. In local development, check work/mail.",
                  );
                } catch (e) {
                  toast.error(errorMessage(e));
                } finally {
                  setBusy(false);
                }
              }}
            >
              Resend verification email
            </Button>
          )}
          <Link to="/forgot-password" className="button secondary">
            Reset password
          </Link>
        </div>
        <small>
          Local development email delivery is saved privately to work/mail.
          Production uses your configured email provider.
        </small>
      </section>
    </>
  );
}
export function Billing() {
  const { data, loading, error, reload } = useResource("/billing/subscription");
  return (
    <>
      <PageHeading title="Space to start. Room to grow." eyebrow="YOUR PLAN">
        Clear limits. No surprises.
      </PageHeading>
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error} retry={reload} />
      ) : (
        <section className="panel billing-panel">
          <span className="badge">CURRENT PLAN</span>
          <h2>Cardora Free</h2>
          <div className="price">
            ₹0<small>/ month</small>
          </div>
          <p>No renewal or payment method required.</p>
          <ul>
            {[
              `${data.limits.cards} digital card`,
              "All 3 launch templates",
              `${data.limits.portfolio} portfolio projects`,
              `${data.limits.media} image uploads`,
              "QR downloads and basic analytics",
            ].map((t) => (
              <li key={t}>
                <Check size={17} />
                {t}
              </li>
            ))}
          </ul>
          <div className="notice">
            Pro and Business plans are in development. Paid checkout is not
            available. No payments have been collected.
          </div>
        </section>
      )}
    </>
  );
}
export function Appointments() {
  return (
    <>
      <PageHeading
        title="A place for what’s next."
        eyebrow="APPOINTMENT REQUESTS"
      >
        In development for a future release.
      </PageHeading>
      <Empty
        icon={CalendarDays}
        title="Good conversations take time."
        to="/dashboard/cards"
        action="Manage your contact links"
      >
        Appointment requests and services are not available yet. For now,
        visitors can reach you through the contact buttons on your card.
      </Empty>
    </>
  );
}
export function Admin() {
  const info = useResource("/admin/overview"),
    users = useResource("/admin/users");
  const [busy, setBusy] = useState(false);
  return (
    <>
      <PageHeading title="Platform overview" eyebrow="ADMINISTRATION" />
      {info.loading || users.loading ? (
        <Loading />
      ) : info.error || users.error ? (
        <ErrorState
          message={info.error || users.error}
          retry={() => {
            info.reload();
            users.reload();
          }}
        />
      ) : (
        <>
          <div className="notice">
            {info.data.users} registered users · {info.data.publishedCards}{" "}
            published cards. Showing the first 25 accounts.
          </div>
          <div className="panel activity-list">
            {users.data.map((u) => (
              <div key={u._id}>
                <div>
                  <strong>{u.name}</strong>
                  <p>{u.email}</p>
                </div>
                <span>
                  {u.plan} · {u.accountStatus}
                </span>
                <Button
                  variant="secondary"
                  disabled={busy}
                  onClick={async () => {
                    if (!confirm(`Change account status for ${u.email}?`))
                      return;
                    setBusy(true);
                    try {
                      await api.patch(`/admin/users/${u._id}/status`, {
                        accountStatus:
                          u.accountStatus === "active" ? "suspended" : "active",
                      });
                      users.reload();
                    } catch (e) {
                      toast.error(errorMessage(e));
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  {u.accountStatus === "active" ? "Suspend" : "Restore"}
                </Button>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
