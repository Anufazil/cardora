import { useState } from "react";
import { NavLink, Outlet, Link, Navigate } from "react-router-dom";
import {
  LayoutDashboard,
  PanelsTopLeft,
  Images,
  CalendarDays,
  ChartNoAxesCombined,
  CreditCard,
  Settings,
  CircleHelp,
  LogOut,
  ArrowUpRight,
  Menu,
  Shield,
} from "lucide-react";
import { useAuth } from "../../contexts/Auth";
import { Logo, Loading, ErrorState } from "../common/UI";
import { toast } from "sonner";
const nav = [
  ["", "Overview", LayoutDashboard],
  ["/cards", "My cards", PanelsTopLeft],
  ["/portfolio", "Portfolio", Images],
  ["/appointments", "Appointments", CalendarDays],
  ["/analytics", "Analytics", ChartNoAxesCombined],
];
export default function DashboardLayout() {
  const { user, loading, error, refresh, logout } = useAuth();
  const [open, setOpen] = useState(false);
  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} retry={refresh} />;
  if (!user) return <Navigate to="/login" replace />;
  return (
    <div className="workspace">
      <button
        className="mobile-toggle"
        aria-label="Toggle navigation"
        onClick={() => setOpen(!open)}
      >
        <Menu />
      </button>
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <Logo />
        <div className="workspace-label">PERSONAL WORKSPACE</div>
        <nav>
          {nav.map(([path, label, Icon]) => (
            <NavLink
              end
              to={`/dashboard${path}`}
              key={path}
              onClick={() => setOpen(false)}
            >
              <Icon size={19} />
              {label}
              {label === "Appointments" && (
                <span className="nav-soon">Soon</span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="plan-note">
            <div>
              <span className="tiny-dot" /> Free plan
            </div>
            <p>A little card. A world of possibilities.</p>
            <Link to="/dashboard/billing">
              View your plan <ArrowUpRight size={15} />
            </Link>
          </div>
          <nav>
            {[
              ["billing", "Billing", CreditCard],
              ["settings", "Account settings", Settings],
              ["help", "Help & support", CircleHelp],
              ...(user.role === "admin"
                ? [["admin", "Administration", Shield]]
                : []),
            ].map(([path, label, Icon]) => (
              <NavLink
                key={path}
                to={`/dashboard/${path}`}
                onClick={() => setOpen(false)}
              >
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="user-menu">
            <span className="user-avatar">{user.name.slice(0, 1)}</span>
            <div>
              <strong>{user.name}</strong>
              <small>Personal account</small>
            </div>
            <button
              aria-label="Log out"
              onClick={async () => {
                try {
                  await logout();
                } catch {
                  toast.error("Could not log out. Try again.");
                }
              }}
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>
      <div className="workspace-main">
        <header className="workspace-top">
          <span>Your next opportunity starts here.</span>
          <Link to="/examples">
            Explore templates <ArrowUpRight size={15} />
          </Link>
        </header>
        <main className="dashboard-content">
          <Outlet />
        </main>
        <footer className="dashboard-footer">
          © {new Date().getFullYear()} Cardora{" "}
          <Link to="/privacy">Privacy</Link>
          <span>Your identity. One link.</span>
        </footer>
      </div>
    </div>
  );
}
