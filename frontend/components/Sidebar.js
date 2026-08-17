"use client";

import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import "../styles/sidebar.css";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Food diary", href: "/diary" },
  { label: "Lab results", href: "/lab-results" },
  { label: "Assessment", href: "/assessment" },
  { label: "Meal plan", href: "/meal-plan" },
  { label: "Progress", href: "/progress" },
  { label: "Profile", href: "/profile" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  return (
    <aside className="sidebar">
      {/* ── Brand ── */}
      <div className="sidebar-brand">
        <h1>NutriSense</h1>
        {user && (
          <p className="sidebar-username">
            {user.email || user.first_name}
          </p>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.href}
            className={`sidebar-link ${
              pathname === item.href ? "active" : ""
            }`}
            onClick={() => router.push(item.href)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {/* ── Sign out ── */}
      <div className="sidebar-footer">
        <button className="sidebar-signout" onClick={logout}>
          Sign out
        </button>
      </div>
    </aside>
  );
}
