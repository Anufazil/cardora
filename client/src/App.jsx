import { lazy, Suspense, Component } from "react";
import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "./contexts/Auth";
import { Loading } from "./components/common/UI";
const Marketing = lazy(() => import("./pages/marketing/Marketing"));
const AuthPage = lazy(() => import("./pages/auth/AuthPage"));
import DashboardLayout from "./components/layout/DashboardLayout";
const Examples = lazy(() => import("./pages/marketing/Examples"));
const Info = lazy(() => import("./pages/marketing/Info"));
const Overview = lazy(() => import("./pages/dashboard/Overview"));
const Cards = lazy(() => import("./pages/dashboard/Cards"));
const Editor = lazy(() => import("./pages/dashboard/Editor"));
const Portfolio = lazy(() => import("./pages/dashboard/Portfolio"));
const PublicProfile = lazy(() => import("./pages/public/PublicProfile"));
const Settings = lazy(() =>
  import("./pages/dashboard/Account").then((m) => ({ default: m.Settings })),
);
const Billing = lazy(() =>
  import("./pages/dashboard/Account").then((m) => ({ default: m.Billing })),
);
const Appointments = lazy(() =>
  import("./pages/dashboard/Account").then((m) => ({
    default: m.Appointments,
  })),
);
const Admin = lazy(() =>
  import("./pages/dashboard/Account").then((m) => ({ default: m.Admin })),
);
class ErrorBoundary extends Component {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <main className="error-state">
        <h1>Something didn’t load correctly.</h1>
        <p>Your saved work is still safe.</p>
        <button
          className="button primary"
          onClick={() => window.location.reload()}
        >
          Reload Cardora
        </button>
      </main>
    ) : (
      this.props.children
    );
  }
}
export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route path="/" element={<Marketing />} />
              <Route path="/examples" element={<Examples />} />
              {[
                "login",
                "register",
                "forgot-password",
                "reset-password",
                "verify-email",
              ].map((mode) => (
                <Route
                  key={mode}
                  path={`/${mode}`}
                  element={<AuthPage key={mode} mode={mode} />}
                />
              ))}
              {["privacy", "terms", "cookies", "help"].map((kind) => (
                <Route
                  key={kind}
                  path={`/${kind}`}
                  element={<Info kind={kind} />}
                />
              ))}
              <Route path="/pricing" element={<Navigate to="/#pricing" />} />
              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<Overview />} />
                <Route path="cards" element={<Cards />} />
                <Route path="cards/new" element={<Editor key="new" />} />
                <Route path="cards/:id" element={<Editor />} />
                <Route path="portfolio" element={<Portfolio />} />
                <Route path="analytics" element={<Overview analytics />} />
                <Route path="settings" element={<Settings />} />
                <Route path="billing" element={<Billing />} />
                <Route path="appointments" element={<Appointments />} />
                <Route path="admin" element={<Admin />} />
                <Route path="help" element={<Info kind="help" />} />
              </Route>
              <Route path="/:slug" element={<PublicProfile />} />
              <Route
                path="*"
                element={
                  <main className="empty">
                    <h1>This page took a different turn.</h1>
                    <p>The address may have changed.</p>
                    <Link to="/" className="button primary">
                      Back to Cardora
                    </Link>
                  </main>
                }
              />
            </Routes>
          </Suspense>
          <Toaster position="bottom-right" richColors closeButton />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
