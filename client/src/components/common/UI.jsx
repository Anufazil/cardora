import { Link } from "react-router-dom";
import { Layers2, ArrowRight, LoaderCircle, AlertCircle } from "lucide-react";
export function Logo({ light = false }) {
  return (
    <Link
      className={`brand ${light ? "brand-light" : ""}`}
      to="/"
      aria-label="Cardora home"
    >
      <span className="brand-symbol">
        <Layers2 size={21} />
      </span>
      cardora<span className="brand-dot">.</span>
    </Link>
  );
}
export function Button({
  children,
  variant = "primary",
  busy,
  className = "",
  ...props
}) {
  return (
    <button
      {...props}
      disabled={busy || props.disabled}
      className={`button ${variant} ${className}`}
    >
      {busy && <LoaderCircle size={16} className="spin" />}
      {children}
    </button>
  );
}
export function Field({ label, error, help, children }) {
  return (
    <div className="field">
      <label>
        <span>{label}</span>
        {children}
      </label>
      {help && <small>{help}</small>}
      {error && <small className="field-error">{error}</small>}
    </div>
  );
}
export function Loading() {
  return (
    <div className="loading" role="status">
      <LoaderCircle className="spin" /> Loading your workspace…
    </div>
  );
}
export function ErrorState({ message, retry }) {
  return (
    <div className="error-state" role="alert">
      <AlertCircle />
      <h3>We couldn’t load this</h3>
      <p>{message}</p>
      {retry && (
        <Button variant="secondary" onClick={retry}>
          Try again
        </Button>
      )}
    </div>
  );
}
export function Empty({
  icon: Icon = Layers2,
  title,
  children,
  action = "Create your first card",
  to = "/dashboard/cards/new",
}) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <Icon size={30} />
      </span>
      <h2>{title}</h2>
      <p>{children}</p>
      {to && (
        <Link to={to} className="button primary">
          {action}
          <ArrowRight size={16} />
        </Link>
      )}
    </div>
  );
}
export function PageHeading({ eyebrow, title, children, action }) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {children && <p>{children}</p>}
      </div>
      {action}
    </div>
  );
}
