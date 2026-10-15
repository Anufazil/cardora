import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ArrowUpRight, CheckCircle2 } from "lucide-react";
import { api, errorMessage } from "../../services/api";
import { useAuth } from "../../contexts/Auth";
import { Logo, Button, Field } from "../../components/common/UI";
const strong = z
  .string()
  .min(12, "Use at least 12 characters")
  .max(128)
  .regex(/[A-Z]/, "Include an uppercase letter")
  .regex(/[a-z]/, "Include a lowercase letter")
  .regex(/[0-9]/, "Include a number");
export default function AuthPage({ mode = "login" }) {
  const { setUser, refresh } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [message, setMessage] = useState(""),
    [error, setError] = useState("");
  const registerMode = mode === "register",
    reset = mode === "reset-password",
    verify = mode === "verify-email",
    forgot = mode === "forgot-password";
  const schema = z.object({
    ...(registerMode ? { name: z.string().min(2, "Enter your name") } : {}),
    ...(!verify && !reset ? { email: z.email("Enter a valid email") } : {}),
    ...(!verify && !forgot
      ? {
          password:
            registerMode || reset
              ? strong
              : z.string().min(1, "Enter your password"),
        }
      : {}),
  });
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });
  const title = registerMode
    ? "Make your first impression."
    : forgot
      ? "Let’s get you back in."
      : reset
        ? "A fresh start."
        : verify
          ? "One last introduction."
          : "Good to see you again.";
  async function submit(values) {
    setError("");
    try {
      const token = new URLSearchParams(location.hash.slice(1)).get("token");
      const response = await api.post(`/auth/${mode}`, {
        ...values,
        ...(reset || verify ? { token } : {}),
      });
      if (registerMode || mode === "login") {
        setUser(response.data.data);
        navigate("/dashboard");
      } else {
        setMessage(response.data.data.message);
        if (verify) await refresh();
      }
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  return (
    <main className="auth-page">
      <aside className="auth-story">
        <Logo light />
        <div>
          <div className="eyebrow">YOUR IDENTITY. ONE LINK.</div>
          <h1>
            Be remembered
            <br />
            for what
            <br />
            <em>makes you, you.</em>
          </h1>
          <p>
            Your work, your story, your next opportunity.
            <br />
            All connected in one beautiful place.
          </p>
        </div>
        <small>A better way to say hello.</small>
      </aside>
      <section className="auth-main">
        <div className="auth-mobile-logo">
          <Logo />
        </div>
        <div className="auth-form">
          <span className="eyebrow">WELCOME TO CARDORA</span>
          <h1>{title}</h1>
          <p>
            {registerMode
              ? "Create your free account. No card details needed."
              : verify
                ? "Verify your email to publish your first digital card."
                : forgot
                  ? "We’ll send you a secure password reset link."
                  : reset
                    ? "Choose a strong password to protect your account."
                    : "Sign in to your personal workspace."}
          </p>
          {message ? (
            <div className="success-state">
              <CheckCircle2 />
              <h3>{message}</h3>
              <Link
                to={verify ? "/dashboard" : "/login"}
                className="button primary"
              >
                Continue <ArrowUpRight size={17} />
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(submit)} noValidate>
              {registerMode && (
                <Field label="Full name" error={errors.name?.message}>
                  <input autoComplete="name" {...register("name")} />
                </Field>
              )}
              {!verify && !reset && (
                <Field label="Email address" error={errors.email?.message}>
                  <input
                    type="email"
                    autoComplete="email"
                    {...register("email")}
                  />
                </Field>
              )}
              {!verify && !forgot && (
                <Field
                  label="Password"
                  error={errors.password?.message}
                  help={
                    registerMode || reset
                      ? "12+ characters, with uppercase, lowercase and a number."
                      : null
                  }
                >
                  <input
                    type="password"
                    autoComplete={
                      registerMode || reset
                        ? "new-password"
                        : "current-password"
                    }
                    {...register("password")}
                  />
                </Field>
              )}
              {mode === "login" && (
                <Link className="forgot-link" to="/forgot-password">
                  Forgot password?
                </Link>
              )}
              {error && (
                <p role="alert" className="form-error">
                  {error}
                </p>
              )}
              <Button busy={isSubmitting} className="full" type="submit">
                {registerMode
                  ? "Create your free account"
                  : forgot
                    ? "Send reset link"
                    : reset
                      ? "Reset password"
                      : verify
                        ? "Verify email"
                        : "Sign in"}
                <ArrowUpRight size={17} />
              </Button>
              {registerMode && (
                <small className="auth-terms">
                  By creating an account, you agree to our{" "}
                  <Link to="/terms">Terms</Link> and{" "}
                  <Link to="/privacy">Privacy notice</Link>.
                </small>
              )}
            </form>
          )}
          <div className="auth-switch">
            {registerMode ? (
              <>
                Already have an account? <Link to="/login">Sign in</Link>
              </>
            ) : (
              <>
                New to Cardora? <Link to="/register">Create an account</Link>
              </>
            )}
          </div>
        </div>
        <div className="auth-bottom">
          <Link to="/">Back to Cardora</Link>
          <Link to="/help">Need a hand?</Link>
        </div>
      </section>
    </main>
  );
}
